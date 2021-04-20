import express from "express";
import { Request, Response, NextFunction } from "express";
import logging from "../config/logging";
import { getUserIdFromEmail, getUserModelData } from "../utils";

const checkAuthentication = require("../middleware/checkAuthentication");


const serverHealthCheck = (req: Request, res: Response, next: NextFunction) => {
  logging.info("Health check route", "Health check route called.");

  return res.status(200).json({
    message: "pong",
  });
};

const getNationalityData = (req: Request, res: Response, next: NextFunction) => {
  logging.info("Nationality data route", "Available nationalities route called.");
  const data = require("../data/nationalityData.json");

  return res.status(200).json(data);
};

async function getUserModels(req: any, res: Response, next: NextFunction) {
  logging.info("Model data route", "User models route called.");
  const data = await getUserModelData(req.headers.email);

  return res.status(200).json(data);
};


const router = express.Router();
router.get("/ping", serverHealthCheck);
router.get("/nationalities", getNationalityData);
router.get("/my-models", checkAuthentication, getUserModels);
export = router;
