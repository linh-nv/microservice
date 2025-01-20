import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: ['nats://nats'],
    },
  });
  await app.startAllMicroservices();

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log('Payments Microservice is Running!');
}
bootstrap();
