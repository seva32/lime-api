import express from "express";

const router = express.Router();

router.get("/test", (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "Yuppyyyyyy!" });
});

export default router;