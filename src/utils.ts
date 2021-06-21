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


export { getUserIdFromEmail, getUserModelData}