import express from "express";

import { cors, jwtMiddleware } from "../middleware";

const router = express.Router();

router.use(
  ["/lime-api/users", "/lime-api/posts"],
  [cors, jwtMiddleware],
  (req, res, next) => {
    next();
  }
);

export default router;
