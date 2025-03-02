// import express from "express";
// import { Message } from "@limebasket/api-interfaces";
// import cors from "cors";
// import testRouter from "./app/test.js";
// const app = express();

// // Add a list of allowed origins.
// // If you have more origins you would like to add, you can add them to the array below.
// const allowedOrigins = ["http://localhost", "http://chat.localhost"];

// const options: cors.CorsOptions = {
//   origin: allowedOrigins,
// };

// app.use(cors(options));

// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// const greeting: Message = { message: "Welcome to api!" };

// app.use('/sebas-api', testRouter);

// app.get("/api", (req, res) => {
//   res.send(greeting);
// });

// app.post("/api/compute", (req, res) => {
//   console.log(req.body);
//   res.status(200).json({ message: "Received now!" });
// });

// const port = process.env.PORT || 4939;
// const server = app.listen(port, () => {
//   console.log("Listening at http://localhost:" + port + "/api");
// });
// server.on("error", console.error);

/* eslint-disable no-console */
import throng from "throng";
import server, { isDockerDev } from "./server/express";

import db from "./server/models";
import initial from "./server/models/initial";

const isProd = process.env.NODE_ENV === "production";
const isDev = !isProd;
const PORT = process.env.PORT || 4939;
const HOST = isDockerDev ? "localhost" : "api.limebasket.tk";
let isBuilt = false;
const WORKERS = process.env.WEB_CONCURRENCY || 1;

function start() {
  const done = () => {
    const Role = db.role;
    db.mongoose.set("useFindAndModify", false);
    db.mongoose
      .connect(process.env.MONGOOSE, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: isDev,
      })
      .then(() => {
        console.log("Successfully connect to MongoDB.");
        initial(Role);

        !isBuilt &&
          server.listen(PORT, () => {
            isBuilt = true;
            console.log(
              `Server listening on \x1b[42m\x1b[1mhttp://${HOST}:${PORT}\x1b[0m in \x1b[41m${process.env.NODE_ENV}\x1b[0m 🌎...`
            );
          });
      })
      .catch((err: any) => {
        console.error("MongoDB connection error", err);
        process.exit();
      });
  };

  done();
}

throng(
  {
    workers: WORKERS,
    lifetime: Infinity,
  },
  start
);

if (process.env.NODE_ENV !== "production") {
  process.on("uncaughtException", (err) => {
    console.log("Dev error: ", err);
    process.exit(1);
  });

  process.on("exit", (code) => {
    process.exit(code);
  });
  process.on("SIGINT", () => {
    process.exit(0);
  });
}

// memory leak check
// const numeral = require('numeral');

// setInterval(() => {
//   const { rss, heapTotal, external, heapUsed } = process.memoryUsage();
//   console.log(
//     'rss',
//     numeral(rss).format('0.0 ib'),
//     'heapTotal',
//     numeral(heapTotal).format('0.0 ib'),
//   );
// }, 5000);
