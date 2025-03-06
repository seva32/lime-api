import db from '../models';

const User = db.user;

// eslint-disable-next-line consistent-return
const isAdmin = async (req, res, next) => {
  try {
    // Profile image requests don't require admin role
    if (req.originalUrl.includes("profile")) {
      return next();
    }

    if (!req.accessTokenUserId) {
      return res.status(401).send({ message: "Unauthorized (token)." });
    }

    const user = await User.findById(req.accessTokenUserId).populate(
      "roles",
      "-__v"
    );

    if (!user) {
      return res.status(400).send({
        message: "Unauthorized",
      });
    }

    const isAdm = user.roles.some((r) => r.name === "admin");

    if (!isAdm) {
      return res.status(403).send({
        message: "You are not authorized to perform this action.",
      });
    }

    // User is admin
    return next();
  } catch (err) {
    console.error("Error in isAdmin middleware:", err.message || err);
    return res.status(500).send({ message: "Internal server error" });
  }
};


export default isAdmin;
