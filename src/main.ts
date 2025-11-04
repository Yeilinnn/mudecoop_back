import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // ✅ servir imágenes estáticas
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

  console.log(`App corriendo en http://localhost:${port}`);
  console.log(`Swagger docs en http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error('Error al iniciar la app:', err);
  process.exit(1);
});
