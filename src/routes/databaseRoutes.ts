import express from "express";
import { Request, Response, NextFunction } from "express";
import logging from "../config/logging";

const pool = require("../db");


async function registerUser(req: Request, res: Response) {
    logging.info("User post", "User post request called.");
    
    try {

        const user = {
            "email": "teddypeifer@gmail.com",
            "password": "dfvnfv8z3r7gsa0dh20",
            "signupTime": "01/10/2071"
        }
        
        const { description } = req.body;
        const newUser = await pool.query(
            `INSERT INTO "user" (email, password, signup_time) VALUES ('${user.email}', '${user.password}', '${user.signupTime}')`
        );

        res.json(newUser);

    }
    catch (err) {
        logging.error("User post", err.message);
    }
  
    return res.status(200).json({
        message: "registered",
    });
};

//const router = express.Router();
//router.post("/register", registerUser);

export = registerUser;