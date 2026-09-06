import { Module } from "@nestjs/common";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import {
  GenericHmacPaymentProvider,
  ManualPaymentProvider,
  PaymentProvider,
} from "./provider/payment-provider";

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PaymentProvider,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): PaymentProvider => {
        switch (config.payments.provider) {
          case "generic":
            return new GenericHmacPaymentProvider(config);
          default:
            return new ManualPaymentProvider();
        }
      },
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
