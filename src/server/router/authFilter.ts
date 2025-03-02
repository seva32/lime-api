import express from "express";

import { cors, jwtMiddleware } from "../middleware";

const router = express.Router();

interface Request extends express.Request {}
interface Response extends express.Response {}
interface NextFunction extends express.NextFunction {}

router.use(
  ["/lime-api/users", "/lime-api/posts"],
  [cors, jwtMiddleware],
  (req: Request, res: Response, next: NextFunction) => {
    next();
  }
);

export default router;
