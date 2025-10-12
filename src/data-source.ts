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
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl:
          process.env.DB_SSL === 'true'
            ? {
                rejectUnauthorized: false,
                ca: `-----BEGIN CERTIFICATE-----
MIIDdzCCAl+gAwIBAgIEbT7V0jANBgkqhkiG9w0BAQsFADBoMQswCQYDVQQGEwJV
UzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZyYW5jaXNjbzEZ
MBcGA1UEChMQU2luZ2xlU3RvcmUgSW5jLjEZMBcGA1UEAxMQU2luZ2xlU3RvcmUg
Q0EgUm9vdDAeFw0yMTAzMDEwMDAwMDBaFw0zMTAyMjgxMjAwMDBaMGgxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQHEw1TYW4gRnJhbmNp
c2NvMRkwFwYDVQQKExBTaW5nbGVTdG9yZSBJbmMuMRkwFwYDVQQDExBTaW5nbGVT
dG9yZSBDQSBSb290MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs4Lq
kDPf89tOk5y6d8kJzH7aTnqSxe9e3o+b19n8S7uU0c8dUAVS3RQ2x9kkQWZEDQUb
BdZ8g3FQHDEul+VLN5wRy6+QnSSxFQGOPBP3lBg9+XxDzr3ZCql9q8Itw07N6PB+
x7C42jSLrL4jqDCfR5A9LPZJoAKhR8bT1Vh8ZQyCxCzZMBG/6ZbD7UFMKhE39Rru
xAjgOq81jygvUThZLZvj+w9SwQmPkXW0X6ZbK3+isnF1f5DPRSGW6GICZV4a2UVD
RF5YZpl2X1oPqM0tkPM41Qk7I/4D4Pi3u8ZeO5vRmdnEMiYlkh4ISp+yRfWQeJQ2
apYmZoZ0gkAqlOY8GwIDAQABoyEwHzAdBgNVHQ4EFgQUGYQ5SxHG7MDWBQ4bE2Tz
qv4gApUwDQYJKoZIhvcNAQELBQADggEBAHaB9GmAP+w8xIuY1xBSCeZrLFeZlT4f
E0lp7WKl2B+06pFc2KsoABpOMfJ3xZqk7Biq7ZqDIkIuE7J4qfHzAcAXZL1TnC9h
MmlBoOPXU62JvEl6jJ7IbD0qZbJKmfi7+THGgwKRffpM9EpJ3wDZT3+lLDt7I/Lk
nZP8rVJfIkBlZpEv5hmOTDjYQqVmTQyDMZ2Gr8CM8WmPnoLWtSY0qJdbww0vMEr9
+Pg5v6SRf8XcCUpLbCx9WqTKhGsdSLrfrDUObSOJe1LWR+GYguwY0rO0sAnNEirZ
5a/4WrQDrCtV+5pOrCn6g2lTH1CZQVi2ptppz/4snJP20rK8aPz0xEI=
-----END CERTIFICATE-----`,
              }
            : undefined,
      }),
  entities: isProd ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations: isProd ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
  synchronize: false,
  timezone: 'Z',
});
