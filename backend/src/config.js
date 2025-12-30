import dotenv from 'dotenv';
dotenv.config();

export const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'saas_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_me_to_long_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  server: {
    port: Number(process.env.PORT || 5000),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  seedOnStart: (process.env.SEED_ON_START || 'false').toLowerCase() === 'true',
};
