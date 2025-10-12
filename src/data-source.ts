import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as https from 'https';

const isProd = process.env.NODE_ENV === 'production';
const hasUrl = !!process.env.DATABASE_URL;

const caBundleUrl =
  process.env.DATABASE_SSL_CA ||
  'https://portal.singlestore.com/static/ca/singlestore_bundle.pem';

const sslOptions =
  process.env.DB_SSL === 'true'
    ? {
        rejectUnauthorized: false,
        ca: fs.readFileSync('/tmp/singlestore_bundle.pem', 'utf8'),
      }
    : undefined;

// Descarga automática del bundle al arrancar Render (si no existe)
if (!fs.existsSync('/tmp/singlestore_bundle.pem')) {
  https.get(caBundleUrl, (res) => {
    const file = fs.createWriteStream('/tmp/singlestore_bundle.pem');
    res.pipe(file);
  });
}

export default new DataSource({
  type: 'mysql',
  ...(hasUrl
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: sslOptions,
      }),
  entities: isProd ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations: isProd ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
  synchronize: false,
  timezone: 'Z',
});
