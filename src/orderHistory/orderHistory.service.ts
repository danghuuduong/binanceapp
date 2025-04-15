import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as ccxt from 'ccxt';
import { decryptText } from 'src/helper/until';
import { startTradingService } from 'src/start-trading/start-trading.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class OrderHistoryService {
  private exchange: ccxt.binance;
  private symbol = 'BTC/USDT';

  constructor(
    private readonly usersService: UsersService,
    private readonly startTradingService: startTradingService,
  ) {
  }

  private async setExchange(userId: string) {
    const userApiCredentials = await this.usersService.findOne(userId);

    const ivBuffer = userApiCredentials?.iv ? Buffer.from(userApiCredentials.iv, 'hex') : Buffer.alloc(0);
    const saltBuffer = Buffer.from(userApiCredentials?.salt || '', 'hex');
    const encryptedBuffer = Buffer.from(userApiCredentials?.secret || '', 'hex');

    const handleSecret = await decryptText(ivBuffer, saltBuffer, encryptedBuffer);

    this.exchange = new ccxt.binance({
      apiKey: userApiCredentials?.keyApi,
      secret: handleSecret,
      enableRateLimit: true,
      options: { defaultType: 'future' },
    });
  }


  handleTimestamp = (timestamp: any) => {
    const validTimestamp = Number(timestamp);

    if (isNaN(validTimestamp)) {
      return 'Invalid Date';
    }

    const formattedDate = new Date(validTimestamp).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    return formattedDate;
  };

  setsolai = (reversedtrades) => {
    const dailyProfits = reversedtrades.reduce((acc, trade) => {
      const date = this.handleTimestamp(trade.timestamp);
      const pnl = parseFloat(trade.info.realizedPnl);
      const commission = parseFloat(trade.info.commission);
      const net = pnl - commission;

      acc[date] = (acc[date] || 0) + net;
      return acc;
    }, {});

    const result = Object.entries(dailyProfits).map(
      ([date, profit]) => {
        return { idDate:date, profit };
      }
    );
    return result
  }
  async getOrderHistory(userId: string) {
    try {
      await this.setExchange(userId);

      const now = this.exchange.milliseconds();
      const day = 7 * 24
      const since = now - day * 60 * 60 * 1000;
      const trades = await this.exchange.fetchMyTrades(this.symbol, since);
      const reversedtrades = trades.reverse();
      const profit = this.setsolai(reversedtrades)
      this.startTradingService.updateTrading(userId, {}, profit);

      if (!reversedtrades) {
        return;
      }

      return reversedtrades
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Lỗi Key Lịch sử oder',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }


}