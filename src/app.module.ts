import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CandleModule } from './candle/candle.module';
import { StatusTradingModule } from './start-trading/start-trading.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { MyInfomationModule } from './my-infomation-from-binance/my-infomation.module';
import { realtimeBTCWebsoketModule } from './realtimeBTC-websoket/realtimeBTC-websoket.module';
import { OrderHistoryModule } from './orderHistory/orderHistory.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/passport/jwt-auth.guard';

@Module({
  imports: [
    CandleModule,
    realtimeBTCWebsoketModule,
    StatusTradingModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    MyInfomationModule,
    OrderHistoryModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    }
  ],
})
export class AppModule { }
