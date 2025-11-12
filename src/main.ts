import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as dotenv from 'dotenv';

// ⚠️ Cargar .env ANTES de crear la app
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

console.log(`🔧 Cargando configuración desde: ${envFile}`);
console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔍 SMTP_ADMIN_EMAIL: ${process.env.SMTP_ADMIN_EMAIL}`);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🔒 CORS seguro con opción de testing local
  const allowedOrigins: string[] = [];

  // Desarrollo local
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
  }

  // Dominio de producción
  if (process.env.FRONT_BASE_URL) {
    allowedOrigins.push(process.env.FRONT_BASE_URL);
  }

  // 🧪 Habilitar localhost en producción SOLO para testing
  if (process.env.ALLOW_LOCAL_TESTING === 'true') {
    console.warn('⚠️ MODO TESTING: localhost habilitado en producción');
    allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
  }

  // Validar configuración
  if (allowedOrigins.length === 0) {
    console.error('❌ ERROR: No hay orígenes CORS configurados');
    process.exit(1);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, curl) solo en dev
      if (!origin) {
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_TESTING !== 'true') {
          console.warn('🚫 Request sin origin bloqueado');
          return callback(new Error('Origin required'), false);
        }
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS bloqueado: ${origin}`);
        console.warn(`✅ Permitidos: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads/coop'), {
    prefix: '/coop/',
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads/tourism'), {
    prefix: '/tourism/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('MUDECOOP API - Actividades')
    .setDescription(
      'Módulo de Actividades Cooperativas y Turísticas (Área Administrativa)',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.APP_PORT ?? process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 App corriendo en puerto ${port}`);
  console.log(`📚 Swagger docs en http://localhost:${port}/docs`);
  console.log(`✅ CORS habilitado para: ${allowedOrigins.join(', ')}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((err) => {
  console.error('❌ Error al iniciar la app:', err);
  process.exit(1);
});