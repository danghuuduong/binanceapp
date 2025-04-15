import { Global, Module } from '@nestjs/common';
import { CandleService } from './candle.service';
import { CandleController } from './candle.controller';

@Global()
@Module({
  controllers: [CandleController],
  providers: [CandleService],
  exports: [CandleService],
})
export class CandleModule {}
