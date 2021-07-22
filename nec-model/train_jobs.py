from gather_jobs import fetch_jobs
from run_next_job import run_next_job
from logger import Logging
import traceback
import time


logger = Logging(log_file="nec.log")
logger.log("starting train daemon.", tag="DAEMON")

JOBS_TO_TRAIN = 5
SECONDS_TO_WAIT = 21600

while True:
    try:
        logger.log("fetching new jobs.", tag="DAEMON")
        fetch_jobs()
        time.sleep(1)#180

        logger.log("training next {} jobs.".format(JOBS_TO_TRAIN), tag="DAEMON")
        for _ in range(JOBS_TO_TRAIN):
            run_next_job()
            time.sleep(1)#180

        logger.log("fetching next jobs in 6 hours.", tag="DAEMON")
        time.sleep(1)#SECONDS_TO_WAIT

    except Exception as err:
        logger.error("daemon failed. \n\n\terror: \n\t{}\n".format(traceback.format_exc())) # old error message: str(err).replace("\n", "\n\t")


logger.log("stopping train daemon.", tag="DAEMON")





"""
conda activate py37


echo "[DAEMON] train daemon started."

while true
do
    # fetch open jobs from db and write into queue
    python gather_jobs.py
    echo "[DAEMON] new jobs fetched."
    sleep 1m

    # train next 5 jobs
    for i in {1..5}
    do
        python run_next_job.py
        sleep 1m
    done

    # repeat after 5 hours
    echo "[DAEMON] fetching next jobs in 6 hours."
    sleep 1m #6h
done

echo "[DAEMON] train daemon stopped."




"""