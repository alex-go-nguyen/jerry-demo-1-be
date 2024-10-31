export const envKeys = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,

  NODE_ENV: process.env.NODE_ENV,

  CLIENT_URLS: process.env.CLIENT_URLS,
  WEB_CLIENT_URL: process.env.WEB_CLIENT_URL,

  SERVER_API_URL: process.env.SERVER_API_URL,
  PORT: process.env.PORT,

  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_SENDER: process.env.EMAIL_SENDER,

  JWT_SECRET: process.env.JWT_SECRET,

  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  ENCRYPTION_IV: process.env.ENCRYPTION_IV,

  COOKIE_EXPIRE_TIME: process.env.COOKIE_EXPIRE_TIME,
  ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION,

  RATE_LIMIT: process.env.RATE_LIMIT,
  TIME_TO_LIVE: process.env.TIME_TO_LIVE,
};
