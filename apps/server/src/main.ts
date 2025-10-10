import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (!process.env.CLIENT_BASE_URL || !process.env.SERVER_BASE_URL) {
    throw new Error('CLIENT_BASE_URL and SERVER_BASE_URL must be defined');
  }
  app.enableCors({
    origin: [process.env.CLIENT_BASE_URL, process.env.SERVER_BASE_URL],
    credentials: true,
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true, // 경로 파라미터나 쿼리 파라미터를 DTO에 명시된 타입으로 암묵적 변환 시도
      },
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector')),
  );

  const config = new DocumentBuilder()
    .setTitle('Project Daepa API')
    .setDescription('Project Daepa API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory, {
    raw: ['json'],
    jsonDocumentUrl: '/api-docs/json',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

void bootstrap();
