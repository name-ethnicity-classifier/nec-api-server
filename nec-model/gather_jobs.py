
import psycopg2 as pg
import datetime
import os
from utils import connect_to_db, load_json, write_json


def check_entry_existance(prior_open_jobs: dict, model_id: str="") -> bool:
    try:
        prior_open_jobs[model_id]
        return True
    except Exception as e:
        return False


def get_open_jobs(connection: pg.extensions.connection, queue_file: str="") -> list:
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM model WHERE mode = 0")

    rows = cursor.fetchall()
    columns = [column_name[0] for column_name in cursor.description]

    connection.close()

    if os.stat(queue_file).st_size == 0:
        write_json(queue_file, {})

    open_jobs = load_json(queue_file)

    updated_job_entries = open_jobs
    for row in rows:
        if not check_entry_existance(updated_job_entries, row[columns.index("model_id")]):

            updated_job_entries[row[columns.index("model_id")]] =  {
                "time": str(datetime.datetime.now()).split(".")[0],
                "nationalities": row[columns.index("nationalities")],
                "ready": False
            }

    write_json(queue_file, updated_job_entries)



if __name__ == "__main__":
    connection = connect_to_db()
    get_open_jobs(connection, "job_queue.json")