/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
import dotenv from "dotenv";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fingerprint from "express-fingerprint";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { cookiesOptions } from "./contollers/config";
import { cors, rateLimiterMiddleware } from "./middleware";
import {
  authRouter,
  authFilterRouter,
  paymentRouter,
  shopRouter,
} from "./router";

dotenv.config({ debug: true });

export const isDocker = process.env.IS_DOCKER === "true";
export const isDockerDev = process.env.DOCKER_DEV === "dev";

const server = express();

// server.use((req, res, next) => {
//   console.log("======================");
//   console.log(req.headers);
//   console.log(req.path);
//   console.log(req.url);
//   next();
// });

server.use(bodyParser.json());
server.use(
  bodyParser.urlencoded({
    limit: "10mb",
    extended: true,
    parameterLimit: 50000,
  })
);
server.use(cookieParser());
server.use(fingerprint());

// no need for cors as we're using nginx proxy
// if (!isDocker) server.options("*", cors);

process.env.NODE_ENV === "production" &&
  server.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const swaggerDocument = require("../../swagger.json");
import { Request, Response, NextFunction } from "express";

server.use(
  session({
    secret: process.env.LOGIN_SERVER_SECRET,
    store: new MongoStore({ url: process.env.MONGOOSE }),
    saveUninitialized: true,
    resave: true,
    cookie: cookiesOptions,
    name: "seva",
    path: "/",
  })
);

server.use((req, res, next) => {
  const corsWhitelist = [
    process.env.SERVER_URL,
    "localhost",
    "http://localhost",
    "http://localhost:3000",
  ];
  if (corsWhitelist.includes(req.headers.origin)) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "X-Access-Token, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, refreshToken, seva"
  );

  if (
    req.headers.origin ||
    req.headers["access-control-request-method"] ||
    req.headers["access-control-request-headers"]
  ) {
    res.header("Access-Control-Max-Age", `${60 * 60 * 24 * 365}`);
    if (req.method == "OPTIONS") {
      res.sendStatus(200);
    }
  }

  next();
});

server.use(rateLimiterMiddleware);

server.use(
  "/lime-api/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);
// server.use("/", (req, res, next) => {
//   console.log("params ", req.params);
//   next();
// });
server.use("/lime-api/auth", authRouter);
server.use(authFilterRouter);
server.use("/lime-api/payment", paymentRouter);
server.use("/lime-api/shop", shopRouter);

server.use(
  "/lime-api/uploads",
  express.static(path.join(__dirname, "../../uploads"))
);

// error handler
interface Error {
  message: string;
  stack?: string;
  status?: number;
}

server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.error("Message: ", err.message);
    console.error("Stack: ", err.stack);
    const message = err && err.message ? err.message : err;
    return res.status(err.status || 500).send({ message });
  }
  return next();
});

export default server;
