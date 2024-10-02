import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { JwtService } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { AwsSdkModule } from 'nest-aws-sdk';
import { SharedIniFileCredentials, S3 } from 'aws-sdk';
import { S3ManagerModule } from './modules/s3-manager.module';
import { PrismaService } from './services/prisma.service';
import { CheckInController } from './controllers/check-in.controller';
import { CheckInService } from './services/check-in.service';

@Module({
  imports: [
    S3ManagerModule,
    AwsSdkModule.forRoot({
      defaultServiceOptions: {
        region: 'us-east-1',
        credentials: new SharedIniFileCredentials({
          profile: 'localstack',
        }),
        endpoint: 'http://localhost:4566',
        s3ForcePathStyle: true,
      },
      services: [S3],
    }),
  ],
  controllers: [UserController, CheckInController],
  providers: [
    PrismaService,
    UserService,
    CheckInService,
    JwtService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
