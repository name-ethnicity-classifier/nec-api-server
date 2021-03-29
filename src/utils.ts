const pool = require("./db");


async function getUserIdFromEmail(email: string) {
    var userId = await pool.query(
        `SELECT id from "user" WHERE email='${email}'`
    );
    if (userId.rows.length === 0) {
        return -1;
    }
    else {
        return userId;
    }
}


export = getUserIdFromEmail;