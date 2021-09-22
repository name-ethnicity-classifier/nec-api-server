import express from "express";
import logging from "../config/logging";
import { Request, Response } from "express";
import { getUserIdFromEmail, sendVerificationEmail } from "../utils";

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");
const checkAuthentication = require("../middleware/checkAuthentication");
const router = express.Router();
require("dotenv").config();


function validateEmail(email: string) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}


router.get("/authentication-check", checkAuthentication, async (req: Request, res: Response) => {
    logging.info("Authentication check post", "User authentication-check request called.");

    try {
        return res.status(200).json({
            message: "stillAuthenticated"
        });
    }
    catch (err: any) {
        console.log(err);
        logging.error("Authentication check post", err.message);
    }

});


// signup user
router.post("/signup", async (req: Request, res: Response) => {
    logging.info("Sign up post", "User registration request called.");
  
    try {   
        const userData = req.body;

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
        
        // get creation date and time
        var currentdate = new Date();
        var signupTime = `${currentdate.getDate()}/${currentdate.getMonth() + 1}/${currentdate.getFullYear()} ${currentdate.getHours()}:${currentdate.getMinutes()}`

        const newUser = await pool.query(
            `INSERT INTO "user" (email, password, signup_time, verified) VALUES ('${userData.email}', '${passwordHash}', '${signupTime}', ${false})`
        );
        res.json(newUser);

        sendVerificationEmail(userData.email);
    }
    catch (err: any) {
        logging.error("Sign up post", err.message);
    }
});


// login user
router.post("/login", async (req: Request, res: Response) => {
    logging.info("Log in post", "User login request called.");
  
    try {
        const userData = req.body;

        // check if email exists in database
        const checkEmailExistence = await pool.query(
            `SELECT EXISTS(SELECT 1 from "user" WHERE email='${userData.email}')`
        );
        if (!checkEmailExistence.rows[0].exists) {
            logging.error("Log in post", "Email doesn't exist.");
    
            return res.status(401).json({
                error: "authenticationFailed",
            });
        }

        // check verification
        const verified = await pool.query(
            `SELECT verified from "user" WHERE email='${userData.email}'`
        );
        if (!verified.rows[0].verified) {
            logging.error("Log in post", "User not verified, sending new verification email.");
    
            sendVerificationEmail(userData.email);

            return res.status(401).json({
                error: "userNotVerified",
            });
        }

        // get password and check if it matches
        var trueHashedPassword = await pool.query(
            `SELECT password from "user" WHERE email='${userData.email}'`
        );
        trueHashedPassword = trueHashedPassword.rows[0].password;
        
        // get id and hash it
        var userId = await pool.query(
            `SELECT id from "user" WHERE email='${userData.email}'`
        );
        userId = await bcrypt.hash(userId.rows[0].id.toString(), 0);

        bcrypt.compare(userData.password, trueHashedPassword, (err: any, result: boolean) => {
            if (err) {
                logging.error("Log in post", "Password doesn't match.");

                return res.status(402).json({
                    error: "authenticationFailed",
                });
            }

            if (result) {
                const token = jwt.sign(
                    {
                        email: userData.email,
                        id: userId 
                    }, 
                    process.env.JWT_KEY,
                    {
                        expiresIn: "10d"
                    },
                )
                
                return res.status(200).json({
                    message: "successfulAuthentification",
                    token: token,
                });
            }
            else {
                return res.status(409).json({
                    error: "authenticationFailed",
                });
            }
        })
    }
    catch (err: any) {
        logging.error("Log in post-request", err.message);
        console.log(err);
    }
});


// change password
router.post("/change-password", checkAuthentication, async (req: Request, res: Response) => {
    logging.info("Password change post", "Password change post-request called.");

    try {
        const userData = req.body;
        
        // check if email exists in database
        const checkEmailExistence = await pool.query(
            `SELECT EXISTS(SELECT 1 from "user" WHERE email='${userData.email}')`
        );
        if (!checkEmailExistence.rows[0].exists) {
            logging.error("Password change post", "Email doesn't exist.");
    
            return res.status(401).json({
                error: "authorizationFailed",
            });
        }

        // get password and check if it matches
        var trueHashedPassword = await pool.query(
            `SELECT password from "user" WHERE email='${userData.email}'`
        );
        trueHashedPassword = trueHashedPassword.rows[0].password;

        bcrypt.compare(userData.password, trueHashedPassword, (err: any, result: any) => {
            console.log(result)
            if (!result) {
                logging.error("Password change post", "Password doesn't match.");

                return res.status(401).json({
                    error: "authorizationFailed",
                });
            }
        });

        // change password
        if (userData.newPassword.length < 10) {
            logging.error("Sign up post", "Password too short.");
    
            return res.status(405).json({
                error: "passwordTooShort",
            });
        }
        else {
            var passwordHash = await bcrypt.hash(userData.newPassword, 10);
            const newPassword = await pool.query(
                `UPDATE "user" SET password='${passwordHash}' WHERE email='${userData.email}'`
            );
            res.json(newPassword);
        }
        
    }
    catch (err: any) {
        logging.error("Password change post-request", err.message);
        console.log(err);
    }
});


// delete user
router.post("/delete-user", checkAuthentication, async (req: Request, res: Response) => {
    logging.info("User deletion post", "User deletion post-request called.");

    try {
        const userData = req.body;
        const userId = await getUserIdFromEmail(userData.email);
        
        // check if email exists in database
        const checkEmailExistence = await pool.query(
            `SELECT EXISTS(SELECT 1 from "user" WHERE email='${userData.email}')`
        );
        if (!checkEmailExistence.rows[0].exists) {
            logging.error("User deletion post", "Email doesn't exist.");
    
            return res.status(401).json({
                error: "authorizationFailed",
            });
        }

        // get password and check if it matches
        var trueHashedPassword = await pool.query(
            `SELECT password from "user" WHERE email='${userData.email}'`
        );
        trueHashedPassword = trueHashedPassword.rows[0].password;
        
        var passwordsMatch = false;
        bcrypt.compare(userData.password, trueHashedPassword, (err: any, result: any) => {
            if (!result) {
                logging.error("User deletion post", "Password doesn't match.");

                return res.status(401).json({
                    error: "authorizationFailed",
                });
            }
            else {
                passwordsMatch = true;
            }
        });

        // delete user entry
        const deletedUser = await pool.query(
            `DELETE FROM "user" WHERE email='${userData.email}' ;
             DELETE FROM "model" WHERE model_id IN ( SELECT model_id FROM "user_to_model" WHERE user_id='${userId}' ) ;
             DELETE FROM "user_to_model" WHERE user_id='${userId}'`
        );
        res.json(deletedUser);
        
    }
    catch (err: any) {
        logging.error("User deletion post-request", err.message);
    }
});


router.get("/confirmation/:emailToken", async (req: Request, res: Response) => {
    try {
        const emailToken = req.params.emailToken;
        const decoded = jwt.verify(emailToken, process.env.JWT_EMAIL_KEY);
        
        const confirm = await pool.query(
            `UPDATE "user" SET verified=true WHERE email='${decoded.email}'`
        );

        return res.redirect("http://localhost:3000/login");
    }
    catch (e: any) {
        return res.status(404).json({
            error: "confirmationFailed",
        });
    }
});



module.exports = router;