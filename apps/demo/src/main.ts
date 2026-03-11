import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Demo app running at http://localhost:3000');
  console.log('Try: curl http://localhost:3000/users');
}

bootstrap();
