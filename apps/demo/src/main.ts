import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Optional: enable Swagger if @nestjs/swagger is installed
  try {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('@faster-crud Demo')
      .setDescription(
        'Auto-generated CRUD API. @ApiProperty decorators are applied ' +
        'automatically from @Col / @Rule metadata — zero manual Swagger config.',
      )
      .setVersion('0.2.0')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, doc);
    console.log('Swagger UI available at http://localhost:3000/api');
  } catch {
    // @nestjs/swagger not installed — Swagger UI disabled
  }

  await app.listen(3000);
  console.log('Demo app running at http://localhost:3000');
  console.log('Try: curl http://localhost:3000/users');
}

bootstrap();
