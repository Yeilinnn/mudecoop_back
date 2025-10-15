import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// ✅ Cargar variables desde .env o .env.production
config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

console.log(`🟢 TypeORM usando entorno: ${process.env.NODE_ENV}`);
console.log(`🟢 Base de datos: ${process.env.DB_HOST || 'no definida'}`);

export const AppDataSource = new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [
    process.env.NODE_ENV === 'production'
      ? join(__dirname, '**', '*.entity.js')
      : join(__dirname, '**', '*.entity.ts'),
  ],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? join(__dirname, 'migrations', '*.js')
      : join(__dirname, 'migrations', '*.ts'),
  ],
  ssl: false,
});
