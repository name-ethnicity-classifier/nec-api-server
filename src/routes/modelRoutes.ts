import express from "express";
import logging from "../config/logging";
import config from "../config/config";
import utilRoutes from "../routes/utilRoutes";
import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";

const cors = require("cors");
const pool = require("../db");
const checkAuthentication = require("../middleware/checkAuthentication");

const router = express.Router();



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



// create model   
router.post("/create-model", async (req: Request, res: Response) => {
    logging.info("Model post", "Model creation post-request called.");
  
    const modelPlaceholder = {
        "email": "myAcc@mail.com",
        "modelId": uuidv4().split("-").slice(-1)[0],
        "name": "my-thrd-dataset",
        "accuracy": 0.0,
        "description": "-",
        "nationalities": '{"german", "new zealander", "greek", "else"}',
        "scores": '{}', // 90.72, 81.93, 95.04
        "type": 1, // type 1: custom, type 2: standard
        "mode": 0 // mode 1: ready to use, mode 0: waiting for training
    }
  
    try {
        const modelData = req.body;//modelPlaceholder;
        //const modelData = modelPlaceholder;

        // get user id from email
        const userId = await getUserIdFromEmail(modelData.email);
        if (userId === -1) {
            logging.error("Model post", "User email does not exists.");
    
            return res.status(404).json({
                error: "emailDoesNotExist",
            });
        }

        // check if the model id already exists
        const checkIdDuplicates = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM "model" WHERE model_id='${modelData.modelId}')`
        );
        if (checkIdDuplicates.rows[0].exists) {
            logging.error("Model post", "Model id already exists.");
    
            return res.status(409).json({
                error: "modelIdDuplicateExists",
            });
        }   

        // check if user has already a model with the wanted name
        const modelNameDuplicates = await pool.query(
            `SELECT user_id FROM "user_to_model" WHERE model_id IN ( SELECT model_id FROM "model" WHERE name='${modelData.name}' ) AND user_id='${userId}'`
        );

        if (modelNameDuplicates.rows.length > 0) {
            logging.error("Model post", "Model name already exists.");
    
            return res.status(409).json({
                error: "modelNameDuplicateExists"
            });
        }

        // create model entry
        const newModel = await pool.query(
            `INSERT INTO "model" (model_id, name, accuracy, description, nationalities, scores, mode) 
            VALUES ('${modelData.modelId}', '${modelData.name}', '${modelData.accuracy}', '${modelData.description}', 
                    '${modelData.nationalities}', '${modelData.scores}', '${modelData.mode}')`
            );
        res.json(newModel);

        // create user-to-model entry
        const newUserModelRelation = await pool.query(
            `INSERT INTO "user_to_model" (user_id, model_id) 
            VALUES ('${userId}', '${modelData.modelId}')`
            );
        res.json(newUserModelRelation);
  
  
    }
    catch (err) {
        console.log(err);
    }
});


// create model   
router.post("/delete-model", checkAuthentication, async (req: Request, res: Response) => {
    logging.info("Model post", "Model deletion post-request called.");
  
    const modelPlaceholder = {
        "email": "myAcc@mail.com",
        "modelId": "hdgdsgvh37gb",
    }
  
    try {
        const modelData = req.body;
        //const modelData = modelPlaceholder;

        // get user id from email
        const userId = await getUserIdFromEmail(modelData.email);
        if (userId === -1) {
            logging.error("Model post", "User email does not exist.");
    
            return res.status(404).json({
                error: "emailDoesNotExist",
            });
        }

        // check if the model id exists
        const checkId = await pool.query(
            `SELECT EXISTS(SELECT 1 from "model" WHERE model_id='${modelData.modelId}')`
        );
        if (!checkId.rows[0].exists) {
            logging.error("Model post", "Model id does not exist.");
    
            return res.status(409).json({
                error: "modelIdDoesNotExist",
            });
        }

        // delete model entry
        const deletedModel = await pool.query(
            `DELETE FROM "model" WHERE model_id='${modelData.modelId}'`);
        res.json(deletedModel);

        // delete user-to-model entry
        const deletedUserModelRelation = await pool.query(
            `DELETE FROM "user_to_model" WHERE model_id='${modelData.modelId}'`);
        res.json(deletedUserModelRelation);
    }
    catch (err) {
        console.log(err);
    }
});

module.exports = router;