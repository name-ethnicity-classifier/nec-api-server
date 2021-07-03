

import datetime


class Logging:
    def __init__(self, log_file: str=""):
        self.log_file = log_file

    def _save_message(self, message: str=""):
        with open(self.log_file, "a+") as f:
            f.write("\n" + message)

    def clear_log(self):
        open(self.log_file, "w").close()

    def log(self, message: str="", show_time: bool=True, tab: int=0, br: bool=False):
        time = str(datetime.datetime.now()).split(".")[0] + " : " if show_time else " "
        message = "{}{}{}".format((tab * 6 * " "), time, message)

        if br: message = "\n" + message

        self._save_message(message)
        print(message)

    def info(self, message: str="", show_time: bool=True, br: bool=False):
        time = str(datetime.datetime.now()).split(".")[0] + " : " if show_time else ""
        message = "[INFO] {}{}".format(time, message)

        if br: message = "\n" + message

        self._save_message(message)
        print(message)

    def error(self, message: str="", show_time: bool=True, br: bool=False):
        time = str(datetime.datetime.now()).split(".")[0] + " : " if show_time else " "
        message = "[ERROR] {}{}".format(time, message)

        if br: message = "\n" + message

        self._save_message(message)
        print(message)

    def warn(self, message: str="", show_time: bool=True, br: bool=False):
        time = str(datetime.datetime.now()).split(".")[0] + " : " if show_time else " "
        message = "[WARN] {}{}".format(time, message)

        if br: message = "\n" + message

        self._save_message(message)
        print(message)

    def debug(self, message: str="", show_time: bool=True, br: bool=False):
        time = str(datetime.datetime.now()).split(".")[0] + " : " if show_time else " "
        message = "[DEBUG] {}{}".format(time, message)

        if br: message = "\n" + message

        self._save_message(message)
        print(message)


"""logger = Logging(log_file="test.log")
logger.info("creating directory for next job [{}]".format("1234567"))
logger.info("creating directory for next job [{}]".format("1234567"))
logger.log("-> created directory", show_time=False, tab=1)
logger.info("creating directory for next job [{}]".format("1234567"))
logger.info("creating directory for next job [{}]".format("1234567"), show_time=False)
logger.info("creating directory for next job [{}]".format("1234567"))
logger.log("-> created directory", show_time=False, tab=1)
logger.info("starting preprocessing next job [{}]".format("1234567"))
logger.error("failed to run job [{}]. \n\n\terror: \n\t{}\n".format(1234567, "Runtime error: \nline 343: ->data.reshape(...)\nnumpy: reshape line 32\nassert shape[0] == shape[1]".replace("\n", "\n\t")))
logger.info("creating directory for next job [{}]".format("1234567"))
logger.info("creating directory for next job [{}]".format("1234567"))
logger.log("-> finished running job", show_time=False, tab=1)
logger.info("creating directory for next job [{}]".format("1234567"), show_time=False)
logger.info("creating directory for next job [{}]".format("1234567"), show_time=False)
logger.log("-> finished running job", show_time=False, tab=1)"""


import torch

v = torch.rand(3).unsqueeze(0)
print(v.shape)
m = torch.rand(3, 1080, 1080).transpose(0, 1)
r = torch.matmul(v, m).transpose(0, 1)

print(r.shape)