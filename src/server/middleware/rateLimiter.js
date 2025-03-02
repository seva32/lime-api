import dotenv from 'dotenv';
import { RateLimiterMongo } from 'rate-limiter-flexible';
import mongoose from 'mongoose';

dotenv.config({ silent: true });

const rateLimiterMiddleware = (req, res, next) => {
  mongoose
    .connect(process.env.MONGOOSE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((_c) => {
      const mongoConn = mongoose.connection;

      const opts = {
        storeClient: mongoConn,
        points: process.env.REQUEST_PER_SECOND_LIMIT || 15, // 'n' requests
        duration: 1, // Per second(s)
      };

      const rateLimiterMongo = new RateLimiterMongo(opts);

      rateLimiterMongo
        .consume(req.ip, 2) // consume 2 points
        .then(
          (_rateLimiterRes) => next(), // 2 points consumed
        )
        .catch(
          (_rateLimiterRes) => res.status(429).send('Too Many Requests'),
          // Not enough points to consume
        );
    })
    .catch((e) => {
      console.log('mongoose error: ', e);
      return res.status(500).send('Internal server error');
    });
};

export default rateLimiterMiddleware;
