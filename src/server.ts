import http from "http";
import express from "express";
import logging from "./config/logging";
import config from "./config/config";
import utilRoutes from "./routes/utilRoutes";
import registerUser from "./routes/databaseRoutes";
import { v4 as uuidv4 } from "uuid";
import { getUserIdFromEmail } from "./utils";
import { Request, Response, NextFunction } from "express";


const cors = require("cors");
const pool = require("./db");
const busboy = require("connect-busboy");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(busboy());

const userRoutes = require("./routes/userRoutes");
const modelRoutes = require("./routes/modelRoutes");


/* logging */
app.use((req: Request, res: Response, next: NextFunction) => {
  logging.info(
    "Server",
    `METHOD - [${req.method}], URL - [${req.url}], IP - [${req.socket.remoteAddress}]`
  );

  res.on("finish", () => {
    logging.info(
      "Server",
      `METHOD - [${req.method}], URL - [${req.url}], IP - [${req.socket.remoteAddress}], STATUS - [${res.statusCode}]`
    );
  });

  next();
});



/* API rules */
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    // "Access-Control-Allow-Origin",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method == "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET PATCH DELETE POST PUT");
    return res.status(200).json({});
  }

  next();
});


/* routes */

// add utility routes
app.use("/", utilRoutes);
app.use("/", userRoutes);
app.use("/", modelRoutes)



/* error handling */
app.use((req: Request, res: Response) => {
  const error = new Error("not found");

  return res.status(404).json({
    message: error.message,
  });
});




/* create server */
const httpServer = http.createServer(app);
httpServer.listen(config.server.port, () =>
  logging.info(
    "Server",
    `Server running on ${config.server.hostname}:${config.server.port}`
  )
);
