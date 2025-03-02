import cors from "cors";

const corsWhitelist = [
  process.env.SERVER_URL,
  "localhost",
  "http://localhost",
  "http://localhost:4200",
  "api.localhost",
  "http://api.localhost",
  "limebasket.tk",
  "https://limebasket.tk",
  "www.limebasket.tk",
  "https://www.limebasket.tk",
  "api.limebasket.tk",
  "https://api.limebasket.tk",
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
