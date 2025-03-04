import cors from "cors";

const corsWhitelist = [
  process.env.SERVER_URL,
  "https://limebasket.sfantini.us",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (corsWhitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
  credentials: true, // required to pass allowedHeaders
  allowedHeaders: [
    "X-Access-Token",
    "X-Requested-With",
    "X-HTTP-Method-Override",
    "Content-Type",
    "Accept",
    "Authorization",
    "refreshToken",
    "seva",
  ],
  exposedHeaders: ["refreshToken", "X-Access-Token", "seva"],
};

export default cors(corsOptions);
