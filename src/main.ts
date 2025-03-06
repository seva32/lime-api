import cluster from "node:cluster";
import server from "./server/express";
import db from "./server/models";
import initial from "./server/models/initial";
import os from "os";

const isProd = process.env.NODE_ENV === "production";
const isDev = !isProd;
const PORT = process.env.PORT || 4939;
const HOST = "localhost";
const WORKERS = Number(process.env.WEB_CONCURRENCY) || os.cpus().length;

async function start() {
  try {
    await db.mongoose.connect(process.env.MONGOOSE as string, {
      autoIndex: isDev,
    });

    console.log("Successfully connected to MongoDB.");
    await initial(db.role);

    server.listen(PORT, () => {
      console.log(
        `Worker ${process.pid} listening on http://${HOST}:${PORT} in ${process.env.NODE_ENV} mode...`
      );
    });
  } catch (err) {
    console.error("MongoDB connection error", err);
    process.exit(1);
  }
}

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, _code, _signal) => {
    console.log(`Worker ${worker.process.pid} exited. Restarting...`);
    cluster.fork();
  });
} else {
  start();
}

if (!isProd) {
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
