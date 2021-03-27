"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var HOST_NAME = process.env.HOST_NAME || "localhost";
var SERVER_PORT = process.env.SERVER_PORT || 1337;
var SERVER = {
    hostname: HOST_NAME,
    port: SERVER_PORT,
};
var config = {
    server: SERVER,
};
exports.default = config;
