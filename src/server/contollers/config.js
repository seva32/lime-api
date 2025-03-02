import dotenv from "dotenv";
import { isDockerDev } from "../express";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export const cookiesOptions = {
  secure: isProd,
  httpOnly: isProd,
  maxAge: 5184000000, // 2m
  path: "/",
  sameSite: "lax",
  domain: isDockerDev ? "localhost" : "limebasket.tk",
};

export default {
  secret: process.env.TOKEN_SECRET,
  expiryToken: isProd ? 9000 : 15000, // only in seconds!!!
  expiryRefreshToken: isProd ? "15d" : 400000, // seconds or not '15d'
};
