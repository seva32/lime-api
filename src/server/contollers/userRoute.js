import express from "express";
import db from "../models/index";
import exp from "constants";

const User = db.user;

const router = express.Router();

router.get("/", async (req, res) => {
  console.log("Get all users", req.accessTokenUserId);
  try {
    const user = await User.findOne({ _id: req.accessTokenUserId });
    if (user) {
      const { email, image, nickname } = user;
      return res.send({
        email,
        image,
        nickname,
      });
    }
    return res.status(404).send({ message: "User Not Found." });
  } catch (e) {
    console.log("Error on user router: ", e);
    return res.status(500).send({ message: "Internal server error." });
  }
});

export default router;
