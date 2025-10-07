import 'dotenv/config';
import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';
const hasUrl = !!process.env.DATABASE_URL;

export default new DataSource({
  type: 'mysql',
  ...(hasUrl
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '3333', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
      }),
  entities: isProd ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations: isProd ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
  synchronize: false,
  timezone: 'Z',
});
