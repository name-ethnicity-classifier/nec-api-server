import logging from "./config/logging";

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

    var data = require("./data/standardModelData.json");
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


// addStandardModelData();


export { getUserIdFromEmail, getUserModelData, getStandardModelData}




