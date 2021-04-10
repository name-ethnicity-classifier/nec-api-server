import logging from "../config/logging";
import { Request, Response, NextFunction } from "express";

const jwt = require("jsonwebtoken");

module.exports = (req: any, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decoded;
        
        console.log("WWWWWWW")
        if (req.userData.email !== req.body.userEmail) {
            logging.error("User authorization", "User email doesn't match the email in the token.");

            return res.status(401).json({
                error: "authorizationProhibited"
            });
        }

        next();
    }
    catch (error) {
        logging.error("User authorization", "Token not provided (invalid or expired).");

        return res.status(401).json({
            error: "authorizationProhibited"
        });
    }
}