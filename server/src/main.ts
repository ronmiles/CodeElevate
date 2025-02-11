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

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:4200', // Your React app's URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Add request logging middleware
  app.use((req, res, next) => {
    logger.log(`[${req.method}] ${req.url}`);
    
    // Safely check and log request body
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      logger.debug('Request Body:', req.body);
    }
    
    // Safely check and log query parameters
    if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
      logger.debug('Query Params:', req.query);
    }
    
    next();
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

bootstrap();
