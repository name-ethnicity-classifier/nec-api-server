import dotenv from "dotenv";

dotenv.config();


// server config
const HOST_NAME = process.env.HOST_NAME;
const SERVER_PORT = process.env.SERVER_PORT;
const API_DOMAIN = process.env.API_DOMAIN;
const APP_DOMAIN = process.env.APP_DOMAIN;

const SERVER = {
	hostname: HOST_NAME,
	port: SERVER_PORT,
	api_domain: API_DOMAIN,
	app_domain: APP_DOMAIN
};

// DB config
const POSTGRESQL_HOST = process.env.POSTGRESQL_HOST;
const POSTGRESQL_DATABASE = process.env.POSTGRESQL_DATABASE;
const POSTGRESQL_USER = process.env.POSTGRESQL_USER;
const POSTGRESQL_PASSWORD = process.env.POSTGRESQL_PASSWORD;
const POSTGRESQL_PORT = process.env.POSTGRESQL_PORT;

const POSTGRESQL = {
	host: POSTGRESQL_HOST,
	database: POSTGRESQL_DATABASE,
	user: POSTGRESQL_USER,
	password: POSTGRESQL_PASSWORD,
	port: POSTGRESQL_PORT
};

// mail config
const MAIL = {
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	user: process.env.EMAIL_USER,
	password: process.env.EMAIL_PASSWORD,
	client_id: process.env.GMAIL_CLIENT_ID,
	client_secret: process.env.GMAIL_CLIENT_SECRET,
	redirect_uri: process.env.GMAIL_REDIRECT_URI,
	refresh_token: process.env.GMAIL_REFRESH_TOKEN,
	jwt_key: process.env.JWT_EMAIL_KEY,
	jwt_key_exp: process.env.JWT_EMAIL_KEY_EXP
};

// total config
const config = {
	dev: process.env.DEV || "false",
	server: SERVER,
	db: POSTGRESQL,
	mail: MAIL
};

export default config;
