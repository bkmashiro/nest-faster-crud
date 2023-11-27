import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from "helmet";
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('/fc-api');

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe(
    {
      transform: true,
      // whitelist: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    }
  ))
  app.use(helmet()); // for better security
  // global error handler
  // app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
bootstrap();
