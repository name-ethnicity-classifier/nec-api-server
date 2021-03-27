import express from "express";
import { Request, Response, NextFunction } from "express";
import logging from "../config/logging";


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


const router = express.Router();
router.get("/ping", serverHealthCheck);
router.get("/nationalities", getNationalityData);

export = router;
