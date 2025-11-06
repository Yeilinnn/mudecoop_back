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
console.log(`🔍 SMTP_ADMIN_EMAIL desde main.ts: ${process.env.SMTP_ADMIN_EMAIL}`);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

// ✅ Configurar CORS según entorno
// ✅ CORS dinámico: permite localhost en dev y tu dominio en producción
app.enableCors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONT_BASE_URL
    : ['http://localhost:5173', 'http://127.0.0.1:5173'], // 👈 habilita ambos en local
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
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

  console.log(`🚀 App corriendo en http://localhost:${port}`);
  console.log(`📚 Swagger docs en http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error('❌ Error al iniciar la app:', err);
  process.exit(1);
});