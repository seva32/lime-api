import express from "express";

import { cors, expressValidator } from "../middleware";
import {
  checkDuplicateEmail,
  checkRolesExisted,
  checkThirdPartyProvider,
} from "../middleware/verifySignUp";
import {
  signin,
  signup,
  signout,
  refreshTokenController,
  resetPassword,
  changePassword,
} from "../contollers/authController";
import { isDocker } from "../express";

const router = express.Router();

router.post(
  "/signup",
  [
    expressValidator.authValidationRules(),
    expressValidator.profileValidationRules(),
    expressValidator.validate,
    checkDuplicateEmail,
    checkRolesExisted,
  ],
  signup
);
router.post(
  "/signin",
  [
    expressValidator.authValidationRules(),
    expressValidator.validate,
    ...(isDocker ? [] : [cors]),
  ],
  signin
);
router.post("/signout", [cors], signout);
router.post("/refresh-token", [cors], refreshTokenController);
router.post(
  "/reset-password",
  [
    expressValidator.authValidationRules(),
    expressValidator.validate,
    checkThirdPartyProvider,
    ...(isDocker ? [] : [cors]),
  ],
  resetPassword
);
router.post(
  "/change-password",
  [
    expressValidator.authValidationRules(),
    expressValidator.validate,
    ...(isDocker ? [] : [cors]),
  ],
  changePassword
);

export default router;
