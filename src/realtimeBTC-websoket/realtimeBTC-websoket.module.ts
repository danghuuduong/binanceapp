import { Module } from '@nestjs/common';
import { realtimeBTCWebsoketGateway } from './realtimeBTC-websoket.gateway';
import { realtimeBTCWebsoketService } from './realtimeBTC-websoket.service';
import { CandleModule } from 'src/candle/candle.module';
import { TimeModule } from 'src/common/until/time/time.module';
import { emaCrossHistoryController } from './realtimeBTC-websoket.controller';
import { handleFoldingService } from 'src/common/until/handleFoldingToMoney/handleFolding.service';
import { StatusTradingModule } from 'src/start-trading/start-trading.module';
import { UsersModule } from 'src/users/users.module';


@Module({
  imports: [CandleModule, TimeModule, StatusTradingModule, UsersModule],
  controllers: [emaCrossHistoryController],
  providers: [realtimeBTCWebsoketGateway, realtimeBTCWebsoketService, handleFoldingService],
})
export class realtimeBTCWebsoketModule { }
