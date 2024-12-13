import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const corsOptions = {
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://yo-crush-repo.vercel.app' // Allow only frontend domain in production
        : true, // Allow all origins during development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies/authentication
  };
  app.enableCors(corsOptions);

  // Start the server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Backend running at port ${port}`);
}

bootstrap();
