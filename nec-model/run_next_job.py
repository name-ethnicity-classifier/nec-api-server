import subprocess
import os
import time
from typing import Union
from utils import connect_to_db, load_json, write_json
from preprocessing import preprocess


def get_next_job(queue_file: str="") -> Union[int, tuple]:
    if os.stat(queue_file).st_size == 0:
        return -1

    open_jobs = load_json(queue_file)

    next_job_id = list(open_jobs.keys())[0]
    next_job = open_jobs[next_job_id]
    print("[+] next job: [{}]".format(next_job_id))

    if next_job["ready"] == False:
        return -2

    return (next_job_id, next_job["nationalities"])


def pop_last_job(queue_file: str="", job_id: str="") -> None:
    open_jobs = load_json(queue_file)
    open_jobs.pop(next_job_id, None)
    write_json(queue_file, open_jobs)


def push_next_job(job_id: str) -> None:
    pass


if __name__ == "__main__":
    next_job = get_next_job("job_queue.json")

    if next_job == -1:
        print("[-] queue empty.")

    elif next_job == -2:
        print("[-] next job not ready yet.")

    else:
        job_id, nationalities = next_job[0], next_job[1]
        print("[+] starting preprocessing job [{}].".format(job_id))

        try:
            start = time.time()
            preprocess(dataset_name=job_id, nationalities=nationalities, raw_dataset_path="datasets/raw_datasets/total_names_dataset.pickle")
            print("[+] successfully finished preprocessing job [{}] (took: {} seconds).".format(job_id, round(time.time() - start, 3)))

            # TODO train(model_id=job_id, model_path="...")

        except Exception as err:
            print("[-] failed to run job [{}]. \n\n\terror: \n\t{}\n".format(job_id, err))

        time.sleep(1)

