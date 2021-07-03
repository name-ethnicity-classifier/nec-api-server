import express from "express";
import { Request, Response, NextFunction } from "express";
import logging from "../config/logging";
import { getUserIdFromEmail, getUserModelData, getStandardModelData } from "../utils";

const checkAuthentication = require("../middleware/checkAuthentication");


// ping to check if the server is active
const serverHealthCheck = (req: Request, res: Response, next: NextFunction) => {
  logging.info("Health check route", "Health check route called.");

  return res.status(200).json({
    message: "pong",
  });
};


// get a dictionary of all available nationalities and their amount of samples
const getNationalityData = (req: Request, res: Response, next: NextFunction) => {
  logging.info("Nationality data route", "Available nationalities route called.");
  var data = require("../data/nationalityData.json");

  // filter out nationalities with too little amount of samples
  const MAX_NAMES_PER_NATIONALITY = 5000;
  Object.keys(data).forEach((element: any) => {
    if (data[element] < MAX_NAMES_PER_NATIONALITY) {
      delete data[element];
    }
  });

  return res.status(200).json(data);
};


// get all models the user has access to
async function getUserModels(req: any, res: Response, next: NextFunction) {
  logging.info("Model data route", "User models route called.");
  const data = await getUserModelData(req.headers.email);

  return res.status(200).json(data);
};


// get all standard models
async function getStandardModels(req: any, res: Response, next: NextFunction) {
  logging.info("Model data route", "User models route called.");
  const data = await getStandardModelData();

  var standardModels: { [name: string]: number} = {}

  for (let i=0; i<data.length; i++) {
    console.log(data[i]);
    var modelName = data[i].name;
    standardModels[modelName] = data[i].accuracy;
  }

  return res.status(200).json(standardModels);
};


const router = express.Router();
router.get("/ping", serverHealthCheck);
router.get("/nationalities", getNationalityData);
router.get("/my-models", checkAuthentication, getUserModels);
router.get("/standard-models", getStandardModels);

export = router;
