import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import { Server } from 'http';

const expressApp = express();

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  app.enableCors();
  await app.init();
}

// Call the bootstrap function to initialize the NestJS application
bootstrap();

// Export the handler for Vercel
const server: Server = expressApp.listen(3000); // Port is irrelevant for Vercel
export default server;
