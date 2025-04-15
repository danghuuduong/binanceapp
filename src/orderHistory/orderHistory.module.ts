import { Module } from '@nestjs/common';
import { OrderHistoryService } from './orderHistory.service';
import { OrderHistoryController } from './orderHistory.controller';
import { StatusTradingModule } from 'src/start-trading/start-trading.module';

@Module({
  imports:[StatusTradingModule],
  controllers: [OrderHistoryController],
  providers: [OrderHistoryService],
})
export class OrderHistoryModule { }
