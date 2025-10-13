import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// ✅ Cargar el .env correcto según entorno
config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

// ✅ Log de depuración
console.log(`🟢 TypeORM usando entorno: ${process.env.NODE_ENV}`);
console.log(`🟢 Base de datos: ${process.env.DB_HOST || 'no definida'}`);

// ✅ Fuente de datos centralizada (Railway o local)
export const AppDataSource = new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL ?? undefined, // usa la URL de Railway si existe
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'mudecoop',
  synchronize: false,
  logging: false,
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
    migrations: [
    process.env.NODE_ENV === 'production'
      ? join(__dirname, 'migrations', '*.js')
      : join(__dirname, 'migrations', '*.ts'),
  ],
  timezone: 'Z',
  ssl: false, // Railway no necesita SSL
});
