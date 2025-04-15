import { Global, Module } from '@nestjs/common';
import { startTradingService } from './start-trading.service';
import { StatusTradingController } from './start-trading.controller';
import { HandleFoldingServiceModule } from 'src/common/until/handleFoldingToMoney/handleFolding.module';
import { MongooseModule } from '@nestjs/mongoose';
import { StartTrading, StartTradingchema } from './schemas/start-trading..schema';
import { MyInfomationModule } from 'src/my-infomation-from-binance/my-infomation.module';

@Global()
@Module({
  imports: [
    HandleFoldingServiceModule,
    MongooseModule.forFeature([{ name: StartTrading.name, schema: StartTradingchema }])],
  controllers: [StatusTradingController],
  providers: [startTradingService],
  exports: [startTradingService],
})
export class StatusTradingModule { }
