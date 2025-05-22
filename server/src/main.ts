/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels
  });

  // Enable CORS with specific configuration
  app.enableCors();

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Add request logging middleware
  app.use((req, res, next) => {
    logger.log(`Incoming Request: [${req.method}] ${req.url}`);
    logger.debug('Request Headers:', req.headers);

    // Safely check and log request body
    if (req.body && Object.keys(req.body).length > 0) {
      logger.debug('Request Body:', req.body);
    }

    next();
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);
  logger.log(`🚀 Server is running on: http://localhost:${port}/api`);
}

bootstrap();
