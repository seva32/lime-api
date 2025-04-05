/* eslint-disable consistent-return */
import jwt from "jsonwebtoken";
import config from "../contollers/config";
import db from "../models/index";

const User = db.user;
const Token = db.token;

export function getAccessToken(payload) {
  return jwt.sign({ id: payload }, config.secret, {
    expiresIn: config.expiryToken,
  });
}

// promise based to check that new refresh token got saved in db
// fingerprint to add extra security check
export async function getRefreshToken(user, fingerprint) {
  const {
    hash,
    components: {
      useragent: {
        browser: { family: browserfamily = "unknown" } = {},
        os: { family: osfamily = "unknown" } = {},
      } = {},
    },
  } = fingerprint;

  // the user may started different sessions on diff devices
  // if accessToken expires check to delete prev refreshtokens
  let userRefreshTokensArr;

  userRefreshTokensArr = user.token;
  if (userRefreshTokensArr.length >= 5) {
    userRefreshTokensArr = userRefreshTokensArr.slice(-4); // up to 5 sessions active
  } // this 4 and the new one

  const refreshToken = jwt.sign({ id: user._id }, config.secret, {
    expiresIn: config.expiryRefreshToken,
  });

  try {
    const token = await new Token({
      refreshToken,
      hash,
      osfamily,
      browserfamily,
    }).save();

    userRefreshTokensArr.push(token);
    user.token = userRefreshTokensArr;

    // Save user with updated token
    await user.save();

    return refreshToken;
  } catch (error) {
    return Promise.reject(new Error(error));
  }
}

export function verifyJWTToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.secret, (err, decodedToken) => {
      if (err) {
        return reject(new Error(`Access token: ${err.message}`));
      }
      if (!decodedToken || !decodedToken.id) {
        return reject(new Error("Access token is invalid"));
      }
      return resolve(decodedToken.id);
    });
  });
}

export async function verifyRefreshToken(token, fingerprint) {
  try {
    const rToken = await Token.findOne({ refreshToken: token });

    if (!rToken) {
      throw new Error("Refresh token doesn't exist (verify)");
    }

    const decodedToken = jwt.verify(rToken.refreshToken, config.secret);

    if (!decodedToken || !decodedToken.id) {
      throw new Error("Refresh token is invalid");
    }

    // If the refresh token is valid, update it
    const tokens = await processRefreshToken(token, fingerprint);
    return tokens;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function processRefreshToken(token, fingerprint) {
  const {
    hash,
    components: {
      useragent: {
        browser: { family: browserfamily = "unknown" } = {},
        os: { family: osfamily = "unknown" } = {},
      } = {},
    },
  } = fingerprint;

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, config.secret);
  } catch (err) {
    throw new Error("Invalid token");
  }

  const user = await User.findById(decodedToken.id);
  if (!user || !user.token?.length) {
    throw new Error("No refresh token, access forbidden");
  }

  const rToken = await Token.findOne({ refreshToken: token });
  if (!rToken) {
    throw new Error("Refresh token doesn't exist (process).");
  }

  const newRefreshToken = jwt.sign({ id: user.id }, config.secret, {
    expiresIn: config.expiryRefreshToken,
  });

  const update = {
    refreshToken: newRefreshToken,
    hash,
    osfamily,
    browserfamily,
  };

  const updateResult = await rToken.updateOne(update);
  if (!updateResult.acknowledged) {
    throw new Error("Refresh token failure");
  }

  const newAccessToken = getAccessToken(user.id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
