/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable no-shadow */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import omit from "lodash.omit";
import waterfall from "async/waterfall";
import db from "../models/index";
import config, { cookiesOptions } from "./config";
import {
  getAccessToken,
  getRefreshToken,
  processRefreshToken,
} from "../functions/jwt";

const User = db.user;
const Role = db.role;
const Token = db.token;
const ThirdPartyProvider = db.thirdPartyProviderSchema;

export const signup = async (req, res) => {
  try {
    let rolesResult;

    if (req.body.roles) {
      const roles = await Role.find({
        name: { $in: req.body.roles },
      });
      rolesResult = roles.map((role) => role._id);
    } else {
      const role = await Role.findOne({ name: "user" });
      if (!role) throw new Error("Default role not found.");
      rolesResult = [role._id];
    }

    let provider;
    if (req.body.profile) {
      provider = new ThirdPartyProvider({
        provider_name: req.body.profile.provider,
        provider_id: req.body.profile.id,
        provider_data: omit(req.body.profile, ["provider", "id"]),
      });
      await provider.save();
    }

    const user = new User({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      nickname: req.body.nickname || req.body.email.split("@")[0],
      roles: rolesResult,
    });

    if (provider) {
      user.third_party_auth.push(provider);
    }

    const refreshToken = await getRefreshToken(user, req.fingerprint);
    const accessToken = getAccessToken(user.id);

    await user.save();

    res.cookie("refreshToken", refreshToken, cookiesOptions);
    res.send({
      email: user.email,
      nickname: user.nickname,
      roles: user.roles,
      image: user.image,
      accessToken,
      expiryToken: config.expiryToken,
    });
  } catch (err) {
    console.error("Signup error:", err.message || err);
    res.status(500).send({ message: "Internal server error" });
  }
};

// signout controller to handle refreshToken deletion on singout redux action
export const signout = async (req, res) => {
  if (req.cookies.refreshToken) {
    try {
      const token = await Token.findOne({
        refreshToken: req.cookies.refreshToken,
      });

      if (!token) {
        return res.status(404).send({ message: "Refresh token Not found." });
      }

      if (req.body.email) {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
          return res.status(404).send({
            message: "User Not found.",
          });
        }

        user.token = user.token.filter((u) => !u.equals(token._id));

        await user.save();
        await Token.deleteOne({ _id: token._id });

        return res.send({
          ok: "ok",
        });
      } else {
        // no email in req body
        return res.status(404).send({ message: "No email provided." });
      }
    } catch (err) {
      console.log("Error during signout:", err.message);
      return res.status(500).send({
        message: "Internal server error",
      });
    }
  } else {
    // no cookie.refreshToken
    return res.status(404).send({ message: "Action forbidden." });
  }
};

export const signin = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).populate(
      "roles",
      "-__v"
    );

    if (!user) {
      return res.status(404).send({ message: "User Not Found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    const token = getAccessToken(user.id);
    try {
      const refreshToken = await getRefreshToken(user, req.fingerprint);
      const authorities = user.roles.map(
        (role) => `ROLE_${role.name.toUpperCase()}`
      );

      res.cookie("refreshToken", refreshToken, cookiesOptions);
      return res.status(200).send({
        email: user.email,
        nickname: user.nickname,
        roles: authorities,
        image: user.image,
        accessToken: token,
        expiryToken: config.expiryToken,
      });
    } catch (error) {
      return res.status(500).send({ message: error });
    }
  } catch (err) {
    console.error("Signin mongoose/user error: ", err.message);
    return res.status(500).send({ message: "Internal server error" });
  }
};

export const refreshTokenController = (req, res) => {
  const refreshToken =
    req.headers.cookie
      .split(";")
      .filter((c) => c.includes("refreshToken"))[0]
      .split("=")[1] || "";

  processRefreshToken(refreshToken, req.fingerprint)
    .then((tokens) => {
      res.cookie("refreshToken", tokens.refreshToken, cookiesOptions);
      return res.send({
        accessToken: tokens.accessToken,
        expiryToken: config.expiryToken,
      });
    })
    .catch((err) => {
      const message = err && err.message ? err.message : err;
      res.status(403).send({ message });
    });
};

export const resetPassword = async (req, res) => {
  try {
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString("hex");

    const user = await User.findOne({ email: req.body.email }).populate(
      "roles",
      "-__v"
    );

    if (!user) {
      return res.status(404).send({ message: "User Email Not found." });
    }

    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiration = Date.now() + 3600000;

    await user.save();

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const hosting =
      process.env.NODE_ENV === "production"
        ? `https://${process.env.SERVER_URL}`
        : `http://${process.env.SERVER_URL}`;

    const msg = {
      to: req.body.email,
      from: "contact@seva32.tk",
      subject: "Password reset on seva32.tk",
      text: "You requested a password reset.",
      html: `
        <strong>You requested a password reset</strong>
        <strong>Click this <a href="${hosting}/reset-password/${token}/${req.body.email}">link</a> to set a new password.</strong>
      `,
    };

    await sgMail.send(msg);
    return res.redirect("/");
  } catch (err) {
    console.error("Reset Password Error: ", err.message || err);
    return res.status(500).send({
      message: "We couldn't process your request, please try again.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword, oldPassword, token, email } = req.body;

    if (!newPassword || !oldPassword || !token || !email) {
      return res
        .status(400)
        .send({ message: "Incomplete data, we couldn't reset your password" });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordTokenExpiration: { $gt: Date.now() },
    }).populate("roles", "-__v");

    if (!user) {
      return res.status(404).send({
        message: "Invalid data trying to change your password.",
      });
    }

    const passwordIsValid = bcrypt.compareSync(oldPassword, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Your data didn't match, no change applied",
      });
    }

    user.password = bcrypt.hashSync(newPassword, 8);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiration = undefined;

    await user.save();

    return res.status(200).send({
      message: "Password changed! Sign in with your new password",
    });
  } catch (err) {
    console.error("Change password error:", err.message || err);
    return res.status(500).send({ message: "Internal server error" });
  }
};
