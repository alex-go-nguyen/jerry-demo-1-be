import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/src/database/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
  ssl:
    process.env.NODE_ENV !== 'development'
      ? { rejectUnauthorized: false }
      : false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
