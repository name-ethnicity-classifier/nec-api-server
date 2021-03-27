import http from "http";
import express from "express";
import bodyParser from "body-parser";
import logging from "./config/logging";
import config from "./config/config";
import utilRoutes from "./routes/utilRoutes";
import registerUser from "./routes/databaseRoutes";


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
    "modelId": "k9723gda09",
    "name": "top_3_european",
    "accuracy": 87.03,
    "description": "-",
    "nationalities": '{"german", "new zealander", "greek"}',
    "scores": '{90.72, 81.93, 95.04}'
  }

  try {
    const { rawModelData } = req.body;
    const modelData = modelPlaceholder;

    const checkNameHeader = await pool.query(
      `SELECT EXISTS(SELECT 1 from "model" where name='${modelData.name}')`
    );

    const checkIdHeader = await pool.query(
      `SELECT EXISTS(SELECT 1 from "model" where model_id='${modelData.modelId}')`
    );

    if (checkIdHeader.rows[0].exists) {
      logging.error("Model post", "Model id already exists.");

      return res.status(405).json({
        error: "modelIdDuplicateExists",
      });
    }
    else if (checkNameHeader.rows[0].exists) {
      logging.error("Model post", "Model name already exists.");

      return res.status(405).json({
        error: "modelNameDuplicateExists",
      });
    }
    
    else {
      const newModel = await pool.query(
        `INSERT INTO "model" (model_id, name, accuracy, description, nationalities, scores) 
        VALUES ('${modelData.modelId}', '${modelData.name}', '${modelData.accuracy}', '${modelData.description}', '${modelData.nationalities}', '${modelData.scores}')`
      );
      res.json(newModel);
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
