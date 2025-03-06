import db from "../models";

const { ROLES } = db;
const User = db.user;

export const checkDuplicateEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      return res
        .status(400)
        .send({ message: "Failed! Email is already in use!" });
    }

    next();
  } catch (err) {
    console.error(
      "Error in checkDuplicateEmail middleware:",
      err.message || err
    );
    return res.status(500).send({ message: "Internal server error" });
  }
};

export const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`,
        });
        return;
      }
    }
  }

  next();
};

export const checkThirdPartyProvider = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).send({ message: "Invalid email" });
    }

    if (user.third_party_auth.length) {
      return res.status(400).send({
        message:
          "You cannot change the password, you created this profile with your Google account data",
      });
    }

    next();
  } catch (err) {
    console.error(
      "Error in checkThirdPartyProvider middleware:",
      err.message || err
    );
    return res.status(500).send({ message: "Internal server error" });
  }
};
