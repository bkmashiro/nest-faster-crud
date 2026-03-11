import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  try {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('@faster-crud Demo Full')
      .setDescription('Comprehensive demo showcasing all @faster-crud features')
      .setVersion('1.0.0')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc);
    console.log('Swagger UI available at http://localhost:3001/docs');
  } catch {
    console.log('Swagger not available — install @nestjs/swagger to enable');
  }

  await app.listen(3001);
  console.log('Demo-full app running at http://localhost:3001');
}

bootstrap();
