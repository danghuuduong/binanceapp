import { Injectable } from '@nestjs/common';
import { paramGetCandleDto } from './dto/param-candle.dto';
import * as ccxt from 'ccxt';

@Injectable()
export class CandleService {
  private exchange: ccxt.binance;

  constructor() {
    this.exchange = new ccxt.binance(); // Sử dụng Binance để lấy dữ liệu
  }

  async getBTCOLHCandles(param: paramGetCandleDto) {
    const { limit, type } = param;
    const limitInt = parseInt(limit);

    try {
      const candles = await this.exchange.fetchOHLCV(
        'BTC/USDT',
        type,
        undefined,
        limitInt,
      );
      return candles.map((candle) => ({
        timestamp: candle[0], // Thời gian (timestamp)
        open: candle[1], // Giá mở cửa
        high: candle[2], // Giá cao nhất
        low: candle[3], // Giá thấp nhất
        close: candle[4], // Giá đóng cửa
        volume: candle[5], // Khối lượng
      }));
    } catch (error) {
      console.error('Error fetching candles:', error);
      throw new Error('Unable to fetch OHLC data');
    }
  }
}
