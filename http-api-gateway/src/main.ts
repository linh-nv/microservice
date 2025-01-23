import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
const Fingerprint = require('express-fingerprint');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  app.use(
    Fingerprint({
      parameters: [
        Fingerprint.useragent,
        Fingerprint.acceptHeaders,
        Fingerprint.geoip,
      ],
    }),
  );

  const documentBuilder = new DocumentBuilder()
    .setTitle('User')
    .addBearerAuth();
  const document = SwaggerModule.createDocument(app, documentBuilder.build());
  SwaggerModule.setup('api/doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));

  console.info(`Documentation: http://localhost:${process.env.PORT || 3000}/api/doc`);

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => console.log(`Running on PORT ${PORT}`));
}

bootstrap();
