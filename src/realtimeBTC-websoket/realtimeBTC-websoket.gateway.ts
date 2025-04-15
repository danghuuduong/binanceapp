import {
  WebSocketGateway,
  // WebSocketServer,
  // OnGatewayConnection,
  // OnGatewayDisconnect,
  // SubscribeMessage,
} from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
import { startTradingService } from 'src/start-trading/start-trading.service';
import * as WebSocket from 'ws';
import { realtimeBTCWebsoketService } from './realtimeBTC-websoket.service';
import { TimeService } from 'src/common/until/time/time.service';
import * as ccxt from 'ccxt';
import axios from 'axios';
import { Timeframe } from 'src/candle/dto/timeframe.enum';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway() // Không cần config cổng/cors nếu không dùng FE
export class realtimeBTCWebsoketGateway {
  // @WebSocketServer() server: Server;

  private binance: ccxt.binance;
  private binanceWs: WebSocket;
  private currentInterval: string = '1m';
  private isEMA = false;
  private huongEMA = "no";
  private isBuy = false;
  private giaNenOpen: number = 0;
  private timeCrossEma: any = "";
  private symbol = 'BTC/USDT';

  constructor(
    private readonly realtimeBTCWebsoketService: realtimeBTCWebsoketService,
    private readonly timeService: TimeService,
    private readonly startTradingService: startTradingService,
    private readonly usersService: UsersService,
  ) {
    this.connectToBinance(this.currentInterval);

    this.binance = new ccxt.binance({
      enableRateLimit: true,
      timeout: 3000,
      options: {
        defaultType: 'future',
      },
    });
  }

  connectToBinance(interval: string) {
    this.binanceWs = new WebSocket(`wss://stream.binance.com:9443/ws/btcusdt@kline_${interval}`);
    this.binanceWs.on('message', (data: string) => this.handleCandlestickUpdate(JSON.parse(data)));
    this.binanceWs.on('error', (err) => { console.error('WebSocket error: ', err); });
    this.binanceWs.on('close', () => { console.log(' close'); this.reconnectWebSocket(); });
    this.binanceWs.on('ping', (data) => { this.binanceWs.pong(data); });
  }

  reconnectWebSocket() {
    this.connectToBinance(this.currentInterval);
  }

  async getServerTime() {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/time');
      return response.data.serverTime;
    } catch (error) {
      console.error('Không thể lấy thời gian từ máy chủ Binance:', error);
    }
  }

  private calculateEMA(data: number[], period: number): number[] {
    let emaArray: number[] = [];
    let k = 2 / (period + 1);
    emaArray.push(data.slice(0, period).reduce((acc, val) => acc + val) / period);
    for (let i = period; i < data.length; i++) {
      const previousEma = emaArray[emaArray.length - 1];
      const currentPrice = data[i];
      const currentEma = currentPrice * k + previousEma * (1 - k);
      emaArray.push(currentEma);
    }
    return emaArray;
  }

  async getEMACross(symbol: string, timeframe: string, limit: number) {
    try {

      const candles = await this.binance.fetchOHLCV(symbol, timeframe, undefined, limit);

      const closePrices = candles.map((candle) => candle[4]);
      const lastCandle = candles[candles.length - 1];
      const openPrice = lastCandle[1];
      const closePrice = lastCandle[4];
      const ema9 = this.calculateEMA(closePrices.filter((price) => price !== undefined), 9);
      const ema25 = this.calculateEMA(closePrices.filter((price) => price !== undefined), 25);
      const previousEma9 = ema9[ema9.length - 2];
      const previousEma25 = ema25[ema25.length - 2];
      const currentEma9 = ema9[ema9.length - 1];
      const currentEma25 = ema25[ema25.length - 1];

      let crossStatus = 'no';
      if (previousEma9 < previousEma25 && currentEma9 > currentEma25) {
        crossStatus = 'buy';
      } else if (previousEma9 > previousEma25 && currentEma9 < currentEma25) {
        crossStatus = 'sell';
      }

      return {
        crossStatus,
        ema9: currentEma9,
        ema25: currentEma25,
        openPrice,
        closePrice
      };
    } catch (error) {
      console.error('Error fetching candles or calculating EMA:', error);
      return;
    }
  }

  async getCurrentBTCPrice(serverTime) {
    try {
      const ticker = await this.binance.fetchTicker(this.symbol, {
        timestamp: serverTime
      });
      return ticker.last;
    } catch (error) {
      return 0;
    }
  }

  async handleCandlestickUpdate(data: any) {
    const candlestick = data.k;
    const isCandleClose = candlestick.x;
    const serverTime = await this.getServerTime();
    const timeBinance = this.timeService.formatTimestampToDatetime(data.E);

    if (isCandleClose) {
      this.realtimeBTCWebsoketService.handleCheck(serverTime);
    }

    const result1h = await this.getEMACross(this.symbol, Timeframe.FIFTEEN_MINUTES, 50);

    if (result1h?.crossStatus !== "no" || this.isEMA) {

      if (this.timeCrossEma === "" && this.huongEMA === "no") {
        this.timeCrossEma = Date.now();
      }

      if (this.timeCrossEma !== "" && this.isEMA) {
        const currentTime = Date.now();
        const is90phut = currentTime - this.timeCrossEma > 90 * 60 * 1000;
        const is2phut = currentTime - this.timeCrossEma > 4 * 60 * 1000;
        if (is2phut && this.isBuy) {
          this.isBuy = false
        }
        if (is90phut) {
          this.resetEMAState();
        }
      }

      if (this.huongEMA === "no") {
        this.huongEMA = result1h?.crossStatus ?? "no";
      }
      if (!this.isEMA) {
        this.isEMA = true;
      }
      if (this.giaNenOpen === 0) {
        this.giaNenOpen = result1h?.openPrice ?? 0;
      }

      const giabtc = await this.getCurrentBTCPrice(serverTime);
      if (
        this.giaNenOpen !== 0 && giabtc !== undefined &&
        giabtc !== 0 && !this.isBuy &&
        (this.huongEMA === "buy" ? this.giaNenOpen + 200 > giabtc : this.giaNenOpen - 200 < giabtc)) {
        if (this.huongEMA === 'buy' || this.huongEMA === 'sell' && !this.isBuy) {
          const currentTime = Date.now();
          this.realtimeBTCWebsoketService.placeOrders(this.huongEMA, timeBinance, serverTime);
          console.log("Buy", currentTime, giabtc, "result1h", result1h);
          this.isBuy = true
          this.resetEMAState();
        }
      }
    }
  }

  private resetEMAState() {
    this.isEMA = false;
    this.huongEMA = "no";
    this.timeCrossEma = "";
    this.giaNenOpen = 0;
  }
}
