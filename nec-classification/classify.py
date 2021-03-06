
def log(tag: str, message: str):
    print(f"{27 * ' '}[{tag}] {message}", end="")

try:
    import torch
    import torch.utils.data
    import torch.nn as nn
    from torch.nn.utils.rnn import pad_sequence, pack_padded_sequence
    import argparse
    import numpy as np
    import json
    import csv
    import string
    from typing import Union
    import os
    import time
    import traceback
    import sys
    from dotenv import load_dotenv
    from model import ConvLSTM as Model
    import unicodedata
    import re


    def load_json(file_path: str) -> dict:
        with open(file_path, "r") as f:
            return json.load(f)


    def load_input(file_path: str) -> list:
        with open(file_path, "r") as f:
            names = csv.reader(f)
            return [e[0] for e in list(names)[1:]]


    def save_output(file_path: str, names: list, ethnicities: list) -> None:
        with open(file_path, "w", newline="") as f:
            csv_writer = csv.writer(f)
            csv_writer.writerow(["names", "ethnicities"])
            for i in range(len(ethnicities)):
                csv_writer.writerow([names[i], ethnicities[i]])

        
    def replace_special_chars(name: str) -> str:
        """ replaces all apostrophe letters with their base letters and removes all other special characters incl. numbers
        
        :param str name: name
        :return str: normalized name
        """

        name = u"{}".format(name)
        name = unicodedata.normalize("NFD", name).encode("ascii", "ignore").decode("utf-8")
        name = re.sub("[^A-Za-z -]+", "", name)

        return name


    def preprocess_names(names: list=[str], batch_size: int=128) -> torch.tensor:
        """ create a pytorch-usable input-batch from a list of string-names
        
        :param list names: list of names (strings)
        :param int batch_size: batch-size for the forward pass
        :return torch.tensor: preprocessed names (to tensors, padded, encoded)
        """

        sample_batch = []
        for name in names:
            # normalize name to only latin characters
            name = replace_special_chars(name)

            # create index-representation from string name, ie: "joe" -> [10, 15, 5], indices go from 1 ("a") to 28 ("-")
            alphabet = list(string.ascii_lowercase.strip()) + [" ", "-"]
            int_name = []
            for char in name:
                int_name.append(alphabet.index(char.lower()) + 1)
            
            name = torch.tensor(int_name)
            sample_batch.append(name)

        padded_batch = pad_sequence(sample_batch, batch_first=True)

        padded_to = list(padded_batch.size())[1]
        padded_batch = padded_batch.reshape(len(sample_batch), padded_to, 1).to(device=device)

        if padded_batch.shape[0] == 1 or batch_size == padded_batch.shape[0]:
            padded_batch = padded_batch.unsqueeze(0)
        else:
            padded_batch = torch.split(padded_batch, batch_size)

        return padded_batch


    def predict(input_batch: torch.tensor, model_config: dict, device: torch.device) -> str:
        """ load model and predict preprocessed name

        :param torch.tensor input_batch: input-batch
        :param str model_path: path to saved model-paramters
        :param dict classes: a dictionary containing all countries with their class-number
        :return str: predicted ethnicities
        """

        # prepare model (map model-file content from gpu to cpu if necessary)
        model = Model(
                    class_amount=model_config["amount-classes"], 
                    embedding_size=model_config["embedding-size"],
                    hidden_size=model_config["hidden-size"],
                    layers=model_config["rnn-layers"],
                    kernel_size=model_config["cnn-parameters"][1],
                    channels=model_config["cnn-parameters"][2]
                ).to(device=device)


        model_path = model_config["model-file"]

        if device != "cuda:0":
            model.load_state_dict(torch.load(model_path, map_location={"cuda:0": "cpu"}))
        else:
            model.load_state_dict(torch.load(model_path))

        model = model.eval()

        # classify names    
        total_predicted_ethncitities = []

        for batch in input_batch:
            predictions = model(batch.float())

            # convert numerics to country name
            predicted_ethnicites = []
            for idx in range(len(predictions)):
                prediction = predictions.cpu().detach().numpy()[idx]
                prediction_idx = list(prediction).index(max(prediction))
                ethnicity = list(classes.keys())[list(classes.values()).index(prediction_idx)]
                predicted_ethnicites.append([ethnicity, round(100 * float(np.exp(max(prediction))), 3)])

            total_predicted_ethncitities += predicted_ethnicites

        return total_predicted_ethncitities
        

    if __name__ == "__main__":
        load_dotenv()

        MAX_NAMES = int(os.getenv("MAX_NAMES"))
        BATCH_SIZE = int(os.getenv("BATCH_SIZE"))

        try:
            parser = argparse.ArgumentParser()
            parser.add_argument("-i", "--id", required=True)
            parser.add_argument("-n", "--names", required=True)
            args = vars(parser.parse_args())

            model_id = args["id"]
            
            # get the train configurations
            model_config = load_json(f"nec-classification/nec_user_models/{model_id}/config.json")
            classes = load_json(f"nec-classification/nec_user_models/{model_id}/dataset/nationalities.json")
            model_file = f"nec-classification/nec_user_models/{model_id}/model.pt"
            names = args["names"].split(",")

            if len(names) > MAX_NAMES:
                print("classificationFailedTooManyNames")
                sys.exit(-1)

            device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

            # preprocess inputs
            input_batch = preprocess_names(names=names, batch_size=BATCH_SIZE)

            model_config = {
                "model-file": model_file,
                "amount-classes": len(classes),
                "embedding-size": model_config["embedding-size"],
                "hidden-size": model_config["hidden-size"],
                "rnn-layers": model_config["rnn-layers"],
                "cnn-parameters": model_config["cnn-parameters"]
            }

            # predict ethnicities
            ethnicities = predict(input_batch, model_config, device)

            # the 'print' statement containing the results that will get flushed to the js parent process
            print(json.dumps(dict(zip(names, ethnicities))))

            #log("SUCCESS", f"classified names using the model with id {model_id}.")

        except Exception as e:
            print(traceback.format_exc())

except Exception as e:
    log("ERROR", f"error:\n{e}")

sys.stdout.flush()

    