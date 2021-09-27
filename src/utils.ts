import logging from "./config/logging";
import nodemailer from "nodemailer";
import config from "./config/config";

const jwt = require("jsonwebtoken");
const pool = require("./db");


async function getUserIdFromEmail(email: string) {
    var userId = await pool.query(
        `SELECT id from "user" WHERE email='${email}'`
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
        `SELECT * FROM "model" WHERE 
            model_id IN ( SELECT model_id FROM "user_to_model" WHERE user_id=( SELECT id FROM "user" WHERE email='${email}')) OR type=1
        `
    );

    return modelData.rows;
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
                `SELECT EXISTS(SELECT 1 FROM "model" WHERE model_id='${model}')`
            );
            if (!checkIdDuplicates.rows[0].exists) {

                var currentdate = new Date(); 
                var creationTime = `${currentdate.getDate()}/${currentdate.getMonth() + 1}/${currentdate.getFullYear()} ${currentdate.getHours()}:${currentdate.getMinutes()}`

                const newModel = await pool.query(
                    `INSERT INTO "model" (model_id, name, accuracy, description, nationalities, scores, creation_time, mode, type) 
                    VALUES ('${model}', '${data[model].name}', '${data[model].accuracy}', '${data[model].description}', 
                            '${data[model].nationalities}', '${data[model].scores}', '${creationTime}', '${data[model].mode}', '${data[model].type}')`
                );
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}


async function sendVerificationEmail(userEmail: string) {
    const emailToken = jwt.sign(
        {
            email: userEmail,
        },
        process.env.JWT_EMAIL_KEY,
        {
            expiresIn: "1d"
        },
    );

    const transporter = nodemailer.createTransport({
        name: config.mail.host,
        host: config.mail.host,
        port: config.mail.port,
        secure: true,
        auth: {
            user: config.mail.user,
            pass: config.mail.password,
        }
    });
    
    const confirmationUrl = `http://localhost:1337/confirmation/${emailToken}`;

    const emailMessage = {
        from: "name-ethnicity-classifier <necweb.noreply@gmail.com>",
        to: userEmail,
        subject: "Name ethnicity classifier account confirmation.",
        html: `<b>Hey there!</b><br/><br/>Did you just create an account for the "name-ethnicity-classifier"? If so, please confirm it by clicking on the link below:<br/><br/><a style="color:#3F7CF7" href="${confirmationUrl}"><b>Confirm account.</b></a><br/><br/>Please do not reply to this email. Thanks!`
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


// addStandardModelData();


export { getUserIdFromEmail, getUserModelData, getStandardModelData, sendVerificationEmail }




