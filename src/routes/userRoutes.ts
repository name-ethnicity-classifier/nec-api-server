import express from "express";
import logging from "../config/logging";
import config from "../config/config";
import { v4 as uuidv4 } from "uuid";

require("dotenv").config();

const jwt = require("jsonwebtoken");
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
    logging.info("Sign up post", "User registration request called.");
  
    const userPlaceholder = {
        "email": "testmail@this.com",
        "password": "meinPwd123",
        "signupTime": "01/10/2071"
    }
  
    try {   

        const { rawUserData } = req.body;
        const userData = userPlaceholder; 
        
        // check if email already exists in database
        const checkEmailDuplicates = await pool.query(
            `SELECT EXISTS(SELECT 1 from "user" WHERE email='${userData.email}')`
        );
        if (checkEmailDuplicates.rows[0].exists) {
            logging.error("Sign up post", "User email already exists.");
    
            return res.status(409).json({
                error: "emailDuplicateExists",
            });
        }

        // check if email is valid
        if(!validateEmail(userData.email)) {
            logging.error("Sign up post", "Invalid email address.");
    
            return res.status(405).json({
                error: "invalidEmailAddress",
            });
        }

        // check if the password is valid
        if (userData.password.length < 10) {
            logging.error("Sign up post", "Password too short.");
    
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
        logging.error("Sign up post", err.message);
    }
});


// login user
router.post("/login", async (req, res) => {
    logging.info("Log in post", "User login request called.");
  
    const userPlaceholder = {
        "email": "testmail@this.com",
        "password": "meinPwd123",
    }
  
    try {
        const { rawUserData } = req.body;
        const userData = userPlaceholder;

        const user = {
            email: userData.email,
            password: userData.password,
        };
        
        // check if email exists in database
        const checkEmailExistence = await pool.query(
            `SELECT EXISTS(SELECT 1 from "user" WHERE email='${user.email}')`
        );
        if (!checkEmailExistence.rows[0].exists) {
            logging.error("Log in post", "Email doesn't exist.");
    
            return res.status(402).json({
                error: "authenticationFailed",
            });
        }

        // get password and check if it matches
        var trueHashedPassword = await pool.query(
            `SELECT password from "user" WHERE email='${user.email}'`
        );
        trueHashedPassword = trueHashedPassword.rows[0].password;
        
        // get id and hash it
        var userId = await pool.query(
            `SELECT id from "user" WHERE email='${user.email}'`
        );
        userId = await bcrypt.hash(userId.rows[0].id.toString(), 0);

        bcrypt.compare(user.password, trueHashedPassword, (err: any, result: boolean) => {
            if (err) {
                logging.error("Log in post", "Password doesn't match.");

                return res.status(402).json({
                    error: "authenticationFailed",
                });
            }

            if (result) {
                const token = jwt.sign(
                    {
                        email: user.email,
                        id: userId 
                    }, 
                    process.env.JWT_KEY,
                    {
                        expiresIn: "1h"
                    },
                )

                return res.status(200).json({
                    message: "successfulAuthentification",
                    token: token
                });
            }
            else {
                return res.status(409).json({
                    error: "authenticationFailed",
                });
            }
        })
    }
    catch (err) {
        logging.error("Sign up post", err.message);
        console.log(err);
    }
});
  
  


module.exports = router;