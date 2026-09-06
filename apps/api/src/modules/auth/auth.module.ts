import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";
import { AuthzModule } from "../authz/authz.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { OtpService } from "./otp.service";

@Module({
  imports: [
    AuthzModule,
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.auth.accessSecret,
        signOptions: { expiresIn: config.auth.accessTtl },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, OtpService],
  exports: [AuthService],
})
export class AuthModule {}
