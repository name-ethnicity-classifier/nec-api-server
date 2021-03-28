import http from "http";
import express from "express";
import bodyParser from "body-parser";
import logging from "./config/logging";
import config from "./config/config";
import utilRoutes from "./routes/utilRoutes";
import registerUser from "./routes/databaseRoutes";
import { v4 as uuidv4 } from "uuid";
 
import getUserIdFromEmail from "./utils";


const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* logging */
app.use((req, res, next) => {
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

//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json());

/* API rules */
app.use((req, res, next) => {
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

// register user
app.post("/register", async (req, res) => {
  logging.info("User post", "User registry post request called.");

  const userPlaceholder = {
    "email": "teddy3peifer3@gmail.com",
    "password": "dfvnfv8z3r7gsa0dh20",
    "signupTime": "01/10/2071"
  }

  try {
    const { rawUserData } = req.body;
    const userData = userPlaceholder;
    console.log(userData)
    const checkEmailHeader = await pool.query(
      `SELECT EXISTS(SELECT 1 from "user" where email='${userData.email}')`
    );

    if (checkEmailHeader.rows[0].exists) {
      logging.error("User post", "User email already exists.");

      return res.status(405).json({
        error: "emailDuplicateExists",
      });
    }
    
    if (!checkEmailHeader.rows[0].exists) {
      const newUser = await pool.query(
        `INSERT INTO "user" (email, password, signup_time) VALUES ('${userData.email}', '${userData.password}', '${userData.signupTime}')`
      );
      res.json(newUser);
    }
    else {
    }

  }
  catch (err) {
    logging.error("User post", err.message);
  }
});


// create model
app.post("/create-model", async (req, res) => {
  logging.info("Model post", "Model creation post request called.");

  const modelPlaceholder = {
    "userEmail": "teddypeifer@gmail.com",
    "modelId": uuidv4().split("-").slice(-1)[0],
    "name": "top_15_european_and_else",
    "accuracy": 0.0,
    "description": "-",
    "nationalities": '{"german", "new zealander", "greek", "else"}',
    "scores": '{}', // 90.72, 81.93, 95.04
    "mode": 0
  }

  try {
    const { rawModelData } = req.body;
    const modelData = modelPlaceholder;

    // get user id from email
    const userId = await getUserIdFromEmail(modelData.userEmail);
    if (userId === -1) {
      logging.error("Model post", "User email does not exists.");

      return res.status(405).json({
        error: "emailDoesNotExist",
      });
    }
    
    // check if user has already a model with the wanted name
    var modelNameDuplicates = await pool.query(
      `SELECT user_id from "user_to_model" WHERE model_id IN ( SELECT model_id FROM "model" WHERE name='${modelData.name}' ) AND user_id='${userId}'`
    );
    
    // check if the model id already exists
    const checkIdDuplicates = await pool.query(
      `SELECT EXISTS(SELECT 1 from "model" WHERE model_id='${modelData.modelId}')`
    );
    
    if (checkIdDuplicates.rows[0].exists) {
      logging.error("Model post", "Model id already exists.");

      return res.status(405).json({
        error: "modelIdDuplicateExists",
      });
    }
    else if (modelNameDuplicates.rows.length > 0) {
      logging.error("Model post", "Model name already exists.");

      return res.status(405).json({
        error: "modelNameDuplicateExists",
      });
    }
    
    else {
      // create model entry
      const newModel = await pool.query(
        `INSERT INTO "model" (model_id, name, accuracy, description, nationalities, scores, mode) 
        VALUES ('${modelData.modelId}', '${modelData.name}', '${modelData.accuracy}', '${modelData.description}', 
                '${modelData.nationalities}', '${modelData.scores}', '${modelData.mode}')`
      );
      res.json(newModel);

      // create user-to-model entry
      const newUserModelRelation = await pool.query(
        `INSERT INTO "user_to_model" (user_id, model_id) 
        VALUES ('${userId}', '${modelData.modelId}')`
      );
      res.json(newUserModelRelation);
    }


  }
  catch (err) {
    logging.error("Model post", err.message);
  }
});












/* error handling */
app.use((req, res, next) => {
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
