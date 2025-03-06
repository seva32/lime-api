import dotenv from "dotenv";
import { RateLimiterMongo } from "rate-limiter-flexible";
import mongoose from "mongoose";

dotenv.config({ silent: true });

mongoose
  .connect(process.env.MONGOOSE)
  .then(() => {
    console.log("MongoDB connected for limiter.");
  })
  .catch((e) => {
    console.error("MongoDB connection error in limiter:", e);
  });

const mongoConn = mongoose.connection;

let rateLimiterMiddleware;

const initializeRateLimiter = new Promise((resolve, reject) => {
  mongoConn.once("open", () => {

    const opts = {
      storeClient: mongoConn,
      points: process.env.REQUEST_PER_SECOND_LIMIT || 15, // 'n' requests
      duration: 1, // Per second(s)
    };

    const rateLimiterMongo = new RateLimiterMongo(opts);

    rateLimiterMiddleware = async (req, res, next) => {
      try {
        const rateLimiterRes = await rateLimiterMongo.consume(req.ip, 2); // consume 2 points
        next(); // 2 points consumed
      } catch (rateLimiterRes) {
        res.status(429).send("Too Many Requests"); // Not enough points to consume
      }
    };

    resolve();
  });

  mongoConn.on("error", (err) => {
    reject(err);
  });
});

const rateLimiterMiddlewareWrapper = async (req, res, next) => {
  if (!rateLimiterMiddleware) {
    await initializeRateLimiter;
  }
  return rateLimiterMiddleware(req, res, next);
};

export default rateLimiterMiddlewareWrapper;
