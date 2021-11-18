import express from "express";
import logging from "../config/logging";
import { Request, Response } from "express";

var fs = require("fs");
var path = require("path");
const pool = require("../db");
const checkAuthentication = require("../middleware/checkAuthentication");
const spawn = require("child_process").spawn;
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
router.post("/create-model", checkAuthentication, async (req: Request, res: Response) => {
    logging.info("Model post", "Model creation post-request called.");

    try {
        const modelData = req.body;

        var currentdate = new Date(); 
        var requestTime = `${currentdate.getDate()}/${currentdate.getMonth() + 1}/${currentdate.getFullYear()} ${currentdate.getHours()}:${currentdate.getMinutes()}`

        // get user id from email
        const userId = await getUserIdFromEmail(modelData.email);
        if (userId === -1) {
            logging.error("Model post", "User email does not exists.");
    
            return res.status(404).json({
                error: "emailDoesNotExist",
            });
        }

        // detect model creation spam
        var allUserCreationTimes = await pool.query(
            `SELECT creation_time FROM "model" WHERE model_id IN ( SELECT model_id FROM "user_to_model" WHERE user_id='${userId}' )`
        );

        var potentialSpamCreations = 0;            
        const creationTimes = allUserCreationTimes.rows.slice().reverse();
        for (let i=0; i<creationTimes.length; i++) {
            
            // date/time of last ith model creation
            const creationDate = creationTimes[i].creation_time.split(" ")[0];
            const creationDayTime = creationTimes[i].creation_time.split(" ")[1];

            // date/time of current model creation/request
            const requestDate = requestTime.split(" ")[0];
            const requestDayTime = requestTime.split(" ")[1];

            if (creationDate !== requestDate) {
                break;
            }
            else {
                if (creationDayTime.split(":")[0] === requestDayTime.split(":")[0] && (parseInt(requestDayTime.split(":")[1]) - parseInt(creationDayTime.split(":")[1])) <= 2 ) {
                    potentialSpamCreations += 1;
                }
                else {
                    break;
                }
            }

            if (potentialSpamCreations === 3) {
                break;
            }
        }

        if (potentialSpamCreations === 3) {
            logging.error("Model post", "Spam creation detected.");
    
            return res.status(409).json({
                error: "tooManyModelCreations",
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
            `INSERT INTO "model" (model_id, name, accuracy, description, nationalities, scores, creation_time, mode, type) 
            VALUES ('${modelData.modelId}', '${modelData.name}', '${modelData.accuracy}', '${modelData.description}', 
                    '${modelData.nationalities}', '${modelData.scores}', '${requestTime}', '${modelData.mode}', '${modelData.type}')`
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
  
    try {
        const modelData = req.body;

        // check if email exists
        /*const userId = await getUserIdFromEmail(modelData.email);
        if (userId === -1) {
            logging.error("Model post", "User email does not exist.");
    
            return res.status(404).json({
                error: "emailDoesNotExist",
            });
        }*/

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


// create model
router.post("/classify-names", checkAuthentication, async (req: Request, res: Response) => {
    logging.info("Classification post", "Classification post-request called.");

    const email = String(req.headers.email);
    const modelName = String(req.headers.model);

    // check if email exists
    const userId = await getUserIdFromEmail(email);
    if (userId === -1) {
        logging.error("Model post", "User email does not exist.");

        return res.status(404).json({
            error: "emailDoesNotExist",
        });
    }

    // check if the model id exists
    const modelIdObject = await pool.query(
        `SELECT model_id from "model" WHERE name='${modelName}'`
    );
    if (modelIdObject.rows.length === 0) {
        logging.error("Model post", "Model id does not exist.");

        return res.status(409).json({
            error: "modelIdDoesNotExist",
        });
    }

    const modelId = modelIdObject.rows[0].model_id;
    try {
        if(req.busboy) {
            req.busboy.on("file", function(fieldName, file, fileName, encoding, mimeType, ) {                
                if (fileName.split(".").pop() !== "csv") {
                    logging.error("Classification post", "Uploaded file has a wrong file extension (must be '.csv').");

                    return res.status(406).json({
                        error: "wrongFileExtension",
                    });
                }

                var fileStream = fs.createWriteStream("./nec-classification/tmp_data/" + fileName.split(".")[0] + "_in_" + modelId + ".csv");
                file.pipe(fileStream);
                fileStream.on("close", function() {
                    // res.send("uploadSucceeded");
                });

                const classifyingProcess = spawn("python", ["nec-classification/classify.py", "--id", `${modelId}`, "--fileName", `${fileName}`]);

                classifyingProcess.stdout.on("data", function(data: any) {
                    var options = {
                        root: path.join(__dirname + "/../..")
                    };
                    
                    // uncomment for debugging:
                    // console.log(data.toString());

                    const outputFileName = "nec-classification/tmp_data/" + fileName.split(".")[0] + "_out_" + modelId + ".csv";
                    res.sendFile(outputFileName, options, function (err) {
                        if (err) {
                            logging.error("Classification post", "Couldn't send output file to client.", err);
                            return res.status(400).json({
                                error: "classificationFailed",
                            });
                        } 
                        else {
                            logging.info("Classification post", "Sent output file to client.");
                            fs.unlink("nec-classification/tmp_data/" + fileName.split(".")[0] + "_out_" + modelId + ".csv", function(err: any) {
                                if (err) {
                                    logging.error("Classification post", "Couldn't remove output file.", err); 
                                }
                            });            
                        }
                    });
                });
            });
            req.pipe(req.busboy);

            
        }
        
        else {
            logging.error("Classification post", "Wrong content type (has to be form-data).");

            return res.status(406).json({
                error: "wrongContentType",
            });
        }
    }
    catch (err) {
        console.log(err);
    }
});




module.exports = router;