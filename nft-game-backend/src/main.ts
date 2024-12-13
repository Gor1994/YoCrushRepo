import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'https://yo-crush-repo.vercel.app', // Allow your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // If you need cookies/authentication
  });
  await app.listen(3001);
}

bootstrap();
