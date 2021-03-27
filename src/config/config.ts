import dotenv from "dotenv";

dotenv.config();

// server config
const HOST_NAME = process.env.HOST_NAME || "localhost";
const SERVER_PORT = process.env.SERVER_PORT || 1337;

const SERVER = {
  hostname: HOST_NAME,
  port: SERVER_PORT,
};

// DB config
const POSTGRESQL_HOST = process.env.POSTGRESQL_HOST || "localhost";
const POSTGRESQL_DATABASE = process.env.POSTGRESQL_DATABASE || "nec-user-db";
const POSTGRESQL_USER = process.env.POSTGRESQL_USER || "tedmin";
const POSTGRESQL_PASSWORD = process.env.POSTGRESQL_PASSWORD || "#nec!#2345!#caktus!#420!#";
const POSTGRESQL_PORT = process.env.POSTGRESQL_PORT || 5432;

const POSTGRESQL = {
  host: POSTGRESQL_HOST,
  database: POSTGRESQL_DATABASE,
  user: POSTGRESQL_USER,
  password: POSTGRESQL_PASSWORD,
  port: POSTGRESQL_PORT
};


const config = {
  server: SERVER,
  db: POSTGRESQL
};

export default config;
