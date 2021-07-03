
import psycopg2 as pg
import json


def connect_to_db() -> pg.extensions.connection:
    connection = pg.connect(
        host="localhost",
        database="nec-user-db",
        user="tedmin",
        password="#nec!#2345!#caktus!#420!#",
        port=5432
    )

    return connection


def load_json(file_path: str) -> dict:
    with open(file_path, "r") as f:
        return json.load(f)


def write_json(file_path: str, content: dict) -> None:
    with open(file_path, "w") as f:
            json.dump(content, f, indent=4)


