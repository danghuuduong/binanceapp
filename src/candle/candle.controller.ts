import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CandleService } from './candle.service';
import { paramGetCandleDto } from './dto/param-candle.dto';
import { Public } from 'src/decorate/customize';

@Controller('candles') // Đặt đường dẫn cho controller là /candles
export class CandleController {
  constructor(private readonly candleService: CandleService) { }

  @Public()
  @Get('btc-usdt')
  @UsePipes(ValidationPipe)
  async getBTCOLHCandles(@Query() query: paramGetCandleDto) {
    return this.candleService.getBTCOLHCandles({
      limit: query.limit,
      type: query.type,
    });
  }
}
