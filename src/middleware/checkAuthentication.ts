import logging from "../config/logging";
import config from "../config/config";
import { Response, NextFunction } from "express";


const jwt = require("jsonwebtoken");

module.exports = (req: any, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decoded;
        req.tokenEmail = req.userData.email;
        next();
    }
    catch (err) {
        logging.error("User authorization", "Token not provided (invalid or expired).");

        return res.status(401).json({
            err: "authorizationProhibited"
        });
    }
}