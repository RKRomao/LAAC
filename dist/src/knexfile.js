"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbType = process.env.DB_TYPE || 'sqlite3';
const baseConfig = {
    pool: {
        min: 2,
        max: 10,
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: '../database/migrations',
    },
    seeds: {
        directory: '../database/seeds',
    },
};
const sqliteConfig = {
    client: 'sqlite3',
    connection: {
        filename: path_1.default.join(__dirname, '../database/laac_dev.sqlite3'),
    },
    useNullAsDefault: true,
    ...baseConfig,
};
const postgresConfig = {
    client: 'postgresql',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'laac_dev',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
    },
    ...baseConfig,
};
const mysqlConfig = {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME || 'laac_dev',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        charset: 'utf8mb4',
    },
    ...baseConfig,
};
const selectedConfig = dbType === 'mysql2' ? mysqlConfig : dbType === 'sqlite3' ? sqliteConfig : postgresConfig;
const config = {
    development: selectedConfig,
    staging: {
        ...selectedConfig,
        connection: {
            ...selectedConfig.connection,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        },
    },
    production: {
        ...selectedConfig,
        connection: {
            ...selectedConfig.connection,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        },
        acquireConnectionTimeout: 60000,
    },
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map