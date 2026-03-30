import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import helmet from 'helmet';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logLevels: LogLevel[] =
    process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['debug', 'log', 'warn', 'error'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  app.use(cookieParser());
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'data:', 'https:'],
      },
    }),
  );

  const corsOrigins =
    process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGIN || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
          'http://localhost:3300',
          'http://localhost:3100',
        ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
    optionsSuccessStatus: 200,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPass = process.env.SWAGGER_PASSWORD;

  app.use('/api-docs', (req: Request, res: Response, next: () => void) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs"');
      res.status(401).send('Authentication required');
      return;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'ascii',
    );
    const [user, pass] = credentials.split(':');

    if (user !== swaggerUser || pass !== swaggerPass) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs"');
      res.status(401).send('Invalid credentials');
      return;
    }

    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Smart Home Management System API')
    .setDescription(' REST API for Smart Home Management System')
    .setVersion('1.0')
    .addTag('Authentication')
    .addTag('Devices')
    .addTag('Sensors')
    .addTag('Users')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  console.log(` Swagger Docs: /api-docs (Protected by Basic Auth)`);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════╗
║   Server is running                      ║
║   http://localhost:${port}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}         ║
║   CORS Origins: ${corsOrigins.length} domains            ║
╚════════════════════════════════════════════╝
  `);
}

bootstrap();
