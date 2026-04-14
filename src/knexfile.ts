import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// Determine database type from environment
const dbType = process.env.DB_TYPE || 'postgresql'; // 'postgresql' or 'mysql2'

// Base configuration
const baseConfig = {
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './database/migrations',
  },
  seeds: {
    directory: './database/seeds',
  },
};

// PostgreSQL configuration
const postgresConfig: Knex.Config = {
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

// MariaDB/MySQL configuration
const mysqlConfig: Knex.Config = {
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

const selectedConfig = dbType === 'mysql2' ? mysqlConfig : postgresConfig;

const config: { [key: string]: Knex.Config } = {
  development: selectedConfig,

  staging: {
    ...selectedConfig,
    connection: {
      ...(selectedConfig.connection as any),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
  },

  production: {
    ...selectedConfig,
    connection: {
      ...(selectedConfig.connection as any),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    acquireConnectionTimeout: 60000,
  },
};

export default config;
