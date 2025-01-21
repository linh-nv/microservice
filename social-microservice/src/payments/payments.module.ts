import { Module } from '@nestjs/common';
import { PaymentsMicroserviceController } from './payments.controller';
import { NatsClientModule } from 'src/nats-client/nats-client.module';
import { PaymentsService } from './payments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/typeorm/entities/Payment';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), NatsClientModule],
  controllers: [PaymentsMicroserviceController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
