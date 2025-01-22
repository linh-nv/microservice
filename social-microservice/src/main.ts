import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const documentBuilder = new DocumentBuilder()
    .setTitle('Social')
    .addBearerAuth();
  const document = SwaggerModule.createDocument(app, documentBuilder.build());
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));

  console.info(`Documentation: http://localhost:${process.env.PORT}/api`);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: ['nats://nats:4222'],
    },
  });
  await app.startAllMicroservices();
  await app.listen(process.env.PORT);
  console.log('Social Microservice is Running!');
}
bootstrap();
