import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

const Fingerprint = require('express-fingerprint');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix(`/api/v1`);

  app.use(
    Fingerprint({
      parameters: [
        Fingerprint.useragent,
        Fingerprint.acceptHeaders,
        Fingerprint.geoip,
      ],
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      enableImplicitConversion: true,
    }),
  );
  app.useGlobalPipes(new ValidationPipe());

  const documentBuilder = new DocumentBuilder()
    .setTitle('User')
    .addBearerAuth();
  const document = SwaggerModule.createDocument(app, documentBuilder.build());
  SwaggerModule.setup('api/v1', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));

  console.info(`Documentation: http://localhost:${process.env.PORT}/api/v1`);

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.NATS,
  //   options: {
  //     servers: ['nats://localhost:4222'],
  //   },
  // });
  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3001);
  console.log('Users Microservice is Running!');
}
bootstrap();
