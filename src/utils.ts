import logging from "./config/logging";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import config from "./config/config";
import dotenv from "dotenv";

dotenv.config();
const jwt = require("jsonwebtoken");
const pool = require("./db");
var mg = require('nodemailer-mailgun-transport');


async function getUserIdFromEmail(email: string) {
    var userId = await pool.query(
        `SELECT id from "user" WHERE email=$1`,
        [email]
    );
    if (userId.rows.length === 0) {
        return -1;
    }
    else {
        return userId.rows[0].id;
    }
}

async function getUserModelData(email: string) {
    var modelData = await pool.query(
        `SELECT * FROM "model" WHERE model_id IN ( SELECT model_id FROM "user_to_model" WHERE user_id=( SELECT id FROM "user" WHERE email=$1)) OR type=1`,
        [email]
    );

    modelData = modelData.rows;
    for (let i=0; i<modelData.length; i++) {
        delete modelData[i]["model_id"];
        delete modelData[i]["description"];
        delete modelData[i]["is_group_level"];
    }
    
    return modelData;
}

async function getStandardModelData() {
    var modelData = await pool.query(
        `SELECT * FROM "model" WHERE type=1`
    );

    return modelData.rows;
}

async function addStandardModelData() {
    logging.info("Standard model push", "Pushing new standard models.");

    var data = require("../data/standardModelData.json");
    Object.keys(data).forEach(async (model: any) => {
        try {
            // check if the model id already exists
            const checkIdDuplicates = await pool.query(
                `SELECT EXISTS(SELECT 1 FROM "model" WHERE model_id=$1)`,
                [model]
            );
            if (!checkIdDuplicates.rows[0].exists) {

                var currentdate = new Date(); 
                var creationTime = `${currentdate.getDate()}/${currentdate.getMonth() + 1}/${currentdate.getFullYear()} ${currentdate.getHours()}:${currentdate.getMinutes()}`

                const newModel = await pool.query(
                    `INSERT INTO "model" (model_id, name, accuracy, description, nationalities, scores, creation_time, mode, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, 
                    [model, data[model].name, data[model].accuracy, data[model].description, data[model].nationalities, 
                    data[model].scores, creationTime, data[model].mode, data[model].type]
                );
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}


async function sendVerificationEmail(userEmail: string) {
    console.log("\n" + config.mail.jwt_key + "\n");
    const emailToken = jwt.sign(
        {
            email: userEmail,
        },
        config.mail.jwt_key,
        {
            expiresIn: `${config.mail.jwt_key_exp}`
        },
    );
    /*const oAuth2Client = new google.auth.OAuth2(config.mail.client_id, config.mail.client_secret, config.mail.redirect_uri);
    oAuth2Client.setCredentials({ refresh_token: config.mail.refresh_token });*/

    try {
        //const accessToken = await oAuth2Client.getAccessToken();

        /*const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: config.mail.user,
                clientId: config.mail.client_id,
                clientSecret: config.mail.client_secret,
                refreshToken: config.mail.refresh_token,
                accessToken: accessToken.toLocaleString()
            }
        });*/

        //var transporter = nodemailer.createTransport(mg(auth));
        var transporter = nodemailer.createTransport({
            host: "smtp.sendgrid.net",
            port: 465,
            secure: true,
            auth: {
                user: "apikey",
                pass: config.mail.sendgrid_api_key
            },
        });

        const confirmationUrl = `http://${config.server.api_domain}/confirmation/${emailToken}`;

        const emailMessage = {
            from: "name-to-ethnicity <necweb.noreply@gmail.com>",
            to: userEmail,
            subject: "name-to-ethnicity account confirmation.",
            html: `<b>Hey there!</b><br/><br/>Did you just create an account for the "name-to-ethnicity" webapp? If so, please confirm it by clicking on the link below:<br/><br/><a style="color:#3F7CF7" href="${confirmationUrl}"><b>Confirm account.</b></a><br/><br/>Please do not reply to this email. Thanks!`
        }

        transporter.sendMail(emailMessage, (err: any, info: any) => {
            if (err) {
                logging.error("Sign up post", "Couldn't send verification email.", err);
            }
            else {
                logging.info("Sign up post", "Sent confirmation email.");
            }
        });
    }
    catch(err) {
        logging.error("Sign up post", "Couldn't send verification email.", err);
    }
}


// addStandardModelData();


export { getUserIdFromEmail, getUserModelData, getStandardModelData, sendVerificationEmail }




