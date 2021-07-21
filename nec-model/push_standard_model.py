
import os
import uuid
import shutil
from datetime import datetime
from run_next_job import create_job_space
from utils import connect_to_db, load_json, write_json


def push_standard_model(model_name: str, model_config: dict, nationalities: dict, accuracy: float, scores: list):
    model_id = str(uuid.uuid4()).split("-")[-1]
    directory = "nec_user_models/" + model_id + "/"

    try:
        connection = connect_to_db()
        cursor = connection.cursor()

        if os.path.exists(directory):
            logger.warn("job directory with id [{}] does already exist! Reinitializing.".format(job_id))
            shutil.rmtree(directory)

        os.mkdir(directory)
        os.mkdir(directory + "dataset/")
        write_json(directory + "results.json", 
            {
                "accuracy": accuracy,
                "precision-scores": [scores[0]],
                "recall-scores": [scores[1]],
                "f1-scores": [scores[2]]
            }
        )
        write_json(directory + "config.json", model_config)
        write_json(directory + "dataset/nationalities.json", nationalities)

        description = "-"
        f1_scores = scores[2]
        nationality_string_list = "{" + ", ".join(nationalities)[:-1] + "}"
        score_string_list = "{" + ", ".join([str(s) for s in f1_scores])[:-1] + "}"
        creation_time = str(datetime.now().strftime("%d/%m/%Y %H:%M"))
        mode = 1        # = already trained
        type_ = 1       # = standard model type

        cursor.execute(
            f"""
            INSERT INTO "model" (model_id, name, accuracy, description, nationalities, scores, creation_time, mode, type) 
            VALUES ('{model_id}', '{model_name}', '{accuracy}', '{description}', '{nationality_string_list}', '{score_string_list}', '{creation_time}', '{mode}', '{type_}')
            """
        )

        connection.commit()
        connection.close()

    except Exception as e:
        print("Couldn't push standard model '{}' to the database. Error message:\n{}".format(model_name, e))

        if os.path.exists(directory):
            shutil.rmtree(directory)


if __name__ == "__main__":
    model_name = "chinese_and_else"

    model_config = {
        "model-name": "chinese_and_else",
        "dataset-name": "chinese_and_else",
        "test-size": 0.2,
        "optimizer": "Adam",
        "loss-function": "NLLLoss",
        "epochs": 4,
        "batch-size": 512,
        "cnn-parameters": [
            1,
            3,
            [
                256
            ]
        ],
        "hidden-size": 200,
        "rnn-layers": 2,
        "lr-schedule": [
            0.001,
            0.95,
            100
        ],
        "dropout-chance": 0.3,
        "embedding-size": 200,
        "augmentation": 0.2,
        "resume": False
    }

    nationalities = {
        "else": 0, "chinese": 1
    }

    accuracy = 98.55
    scores = [ [0.98683, 0.98427], 
               [0.98407, 0.98699], 
               [0.98545, 0.98563] ]
    
    push_standard_model(model_name, model_config, nationalities, accuracy, scores)
