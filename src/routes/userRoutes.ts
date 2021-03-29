import express from "express";
import logging from "../config/logging";
import config from "../config/config";
import utilRoutes from "../routes/utilRoutes";
import { v4 as uuidv4 } from "uuid";
const bcrypt = require("bcrypt");

const cors = require("cors");
const pool = require("../db");

const router = express.Router();


function validateEmail(email: string) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}


// register user
router.post("/registration", async (req, res) => {
    logging.info("User post", "User registry post request called.");
  
    const userPlaceholder = {
        "email": "theos mail3.com",
        "password": "meinGeilesPassword123",
        "signupTime": "01/10/2071"
    }
  
    try {   

        const { rawUserData } = req.body;
        const userData = userPlaceholder; 
        
        // check if email already exist in database
        const checkEmailDuplicates = await pool.query(
            `SELECT EXISTS(SELECT 1 from "user" where email='${userData.email}')`
        );
        if (checkEmailDuplicates.rows[0].exists) {
            logging.error("User post", "User email already exists.");
    
            return res.status(409).json({
                error: "emailDuplicateExists",
            });
        }

        // check if email is valid
        if(!validateEmail(userData.email)) {
            logging.error("User post", "Invalid email address.");
    
            return res.status(405).json({
                error: "invalidEmailAddress",
            });
        }

        // check if the password is valid
        if (userData.password.length < 10) {
            logging.error("User post", "Password too short.");
    
            return res.status(405).json({
                error: "passwordTooShort",
            });
        }

        // hash password
        var passwordHash = await bcrypt.hash(userData.password, 10);

        // create user
        const user = {
            email: userData.email,
            password: passwordHash,
            signupTime: userData.signupTime
        };
        
        const newUser = await pool.query(
            `INSERT INTO "user" (email, password, signup_time) VALUES ('${user.email}', '${user.password}', '${user.signupTime}')`
        );
        res.json(newUser);
  
    }
    catch (err) {
        logging.error("User post", err.message);
    }
});
  
  


module.exports = router;