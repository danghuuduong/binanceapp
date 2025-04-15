import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CandleService } from 'src/candle/candle.service';
import { Timeframe } from 'src/candle/dto/timeframe.enum';
import { EMA } from 'technicalindicators';
import { EmaCrossHistory } from './schemas/realtimeBTC-websoket.schema';
import { Model } from 'mongoose';
import { startTradingService } from 'src/start-trading/start-trading.service';
import { handleFoldingService } from 'src/common/until/handleFoldingToMoney/handleFolding.service';
import * as ccxt from 'ccxt';
import { MyInfomationService } from 'src/my-infomation-from-binance/my-infomation.service';
import { UsersService } from 'src/users/users.service';
import { decryptText } from 'src/helper/until';

@Injectable()
export class realtimeBTCWebsoketService {

  constructor(
    private readonly startTradingService: startTradingService,
    private readonly usersService: UsersService,
    private readonly handleFoldingService: handleFoldingService,
    private readonly MyInfomationService: MyInfomationService,
  ) {
  }
  private messenger: {
    [key: string]: {
      name: string;
      messages: { text: string; timestamp: number }[];
    }
  } = {};
  private symbol = 'BTC/USDT';

  calculateAmount(status: any): number {
    const calculateTotalAmount = status?.largestMoney * (status?.tradeRate / 100);
    const moneyFoldingOne = this.handleFoldingService.handleFodingToMoney(calculateTotalAmount, status.foldingCurrent,);
    return moneyFoldingOne / 800;
  }

  async decryptAccountSecret(account: any): Promise<string> {
    const ivBuffer = Buffer.from(account?.iv, 'hex');
    const saltBuffer = Buffer.from(account?.salt, 'hex');
    const encryptedBuffer = Buffer.from(account?.secret, 'hex');
    const handleSecret = await decryptText(ivBuffer, saltBuffer, encryptedBuffer);
    return handleSecret;
  }

  mergeAccountsWithStatus(infomationAccount, statusTradings) {
    return infomationAccount
      .map(acc => {
        const status = statusTradings.find(st => st.id === acc._id.toString());

        if (!status) return null;

        if (!status.isActiveExecuteTrade && status.isTrading) {
          return {
            idUser: acc._id.toString(),
            name: acc.name,
            apiKey: acc.keyApi,
            secret: acc.secret,
            iv: acc.iv,
            salt: acc.salt,
            statusTrading: status
          };
        }
        return null
      }).filter(Boolean);
  }

  mergeAccountsWithStatus2(infomationAccount, statusTradings) {
    return infomationAccount
      .map(acc => {
        const status = statusTradings.find(st => st.id === acc._id.toString());

        if (!status) return null;

        if (status.isActiveExecuteTrade && status.isTrading) {
          return {
            idUser: acc._id.toString(),
            name: acc.name,
            apiKey: acc.keyApi,
            secret: acc.secret,
            iv: acc.iv,
            salt: acc.salt,
            statusTrading: status
          };
        }
        return null
      }).filter(Boolean);
  }

  addMessage(userId: string, name: string, text: string) {
    const timestamp = Date.now();

    if (!this.messenger[userId]) {
      this.messenger[userId] = {
        name,
        messages: [],
      };
    } else {
      this.messenger[userId].name = name;
      this.messenger[userId].messages.push({ text, timestamp });
    }
  }


  async placeOrders(side: 'buy' | 'sell', timeBinance: string, timestamp) {
    const { data: statusTradings } = await this.startTradingService.getStartTradingData();
    const { data: infomationAccount } = await this.usersService.findAllforSever();

    if (statusTradings?.length && infomationAccount?.length) {
      const mergedAccounts = this.mergeAccountsWithStatus(infomationAccount, statusTradings);

      if (mergedAccounts?.length) {
        const promises = mergedAccounts?.map(async (account, index) => {

          const status = account?.statusTrading
          const amount = this.calculateAmount(status);
          const secretCt = await this.decryptAccountSecret(account);
          const exchange = new ccxt.binance({
            apiKey: account.apiKey,
            secret: secretCt,
            enableRateLimit: true,
            timeout: 10000,
            options: {
              defaultType: 'future',
            },
          });
          await exchange.setLeverage(10, this.symbol);

          try {
            const order = await exchange.createOrder(this.symbol, 'market', side, amount, undefined, {
              timestamp,
            });

            if (order) {
              const currentPrice = parseFloat(order?.info?.avgPrice);
              const takeProfitPrice = parseFloat(`${side === "buy" ? currentPrice + 800 : currentPrice - 800}`);
              const stopLossPrice = parseFloat(`${side === "buy" ? currentPrice - 800 : currentPrice + 800}`);

              let stopLossOrder
              try {
                stopLossOrder = await exchange.createOrder(this.symbol, 'market', side === "buy" ? "sell" : "buy", amount, stopLossPrice, { stopLossPrice: stopLossPrice, reduceOnly: true, oco: true, timestamp, });
                // this.addMessage(account?.idUser, account?.name, "SL ok");
              } catch (error) { this.addMessage(account?.idUser, account?.name, "Lỗi SL server"); }

              let takeProfitOrder
              try {
                takeProfitOrder = await exchange.createOrder(this.symbol, 'market', side === "buy" ? "sell" : "buy", amount, takeProfitPrice, { takeProfitPrice: takeProfitPrice, reduceOnly: true, oco: true, timestamp, });
                // this.addMessage(account?.idUser, account?.name, "Tp ok");
              } catch (error) {
                // this.addMessage(account?.idUser, account?.name, "Lỗi Tp server");
              }

              //--------------------------------------------------------------------------------------------------------------------
              if (order?.info?.orderId) {
                const payload = { isActiveExecuteTrade: true, idOrderMain: order?.info?.orderId, idStopLossOrder: stopLossOrder?.info?.orderId, idTakeProfitOrder: takeProfitOrder?.info?.orderId, ActiveExecuteTrade: timeBinance }
                const mesOder = `Đã đặt lệnh : ${amount} - Tại thếp : ${account.statusTrading.foldingCurrent} - Số tiền : ${amount * 800}$ - Với giá : ${currentPrice} `
                // this.addMessage(account?.idUser, account?.name, mesOder);
                account?.idUser && this.startTradingService.updateTrading(account.idUser, payload);
              }
            }
          } catch (error) {
            // this.addMessage(account?.idUser, account?.name, `Lỗi Vào lệnh, ${error.message}`);
            console.log("lỗi oder");

            return
          }
        });
        const results = await Promise.all(promises);

        return results;
      }

    }
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
        return { idDate: date, profit };
      }
    );
    return result
  }

  async handleCheck(timestamp) {

    const { data: statusTradings } = await this.startTradingService.getStartTradingData();
    const { data: infomationAccount } = await this.usersService.findAllforSever();

    if (statusTradings?.length && infomationAccount?.length) {

      const mergedAccounts = this.mergeAccountsWithStatus2(infomationAccount, statusTradings);
      const promises = mergedAccounts?.map(async (account,index) => {

        const status = account?.statusTrading
        const secretCt = await this.decryptAccountSecret(account);

        const exchange = new ccxt.binance({
          apiKey: account.apiKey,
          secret: secretCt,
          enableRateLimit: true,
          timeout: 10000,
          options: {
            defaultType: 'future',
          },
        });


        const now = exchange.milliseconds();
        const dateNow = new Date(now);

        const hour = dateNow.getHours();
        const minute = dateNow.getMinutes();

        console.log("check",index);

        if (minute === 49) {
          console.log("vô update profit");
          
          const day = 7 * 24
          const since = now - day * 60 * 60 * 1000;
          const trades = await exchange.fetchMyTrades(this.symbol, since);
          const profit = this.setsolai(trades)
          this.startTradingService.updateTrading(account?.idUser, {}, profit);
        }
        // ________________________________________________________________________start-------------------------------

        let openOrders
        try { openOrders = await exchange.fetchOpenOrders(this.symbol, undefined, 3, { timestamp }); } catch (error) { console.log("Lỗi openOrders", error.message); }

        let isCheckPosition
        // ____________1.  đóng vị thế
        try {
          const positions = await exchange.fetchPositions([this.symbol], { timestamp });
          isCheckPosition = positions

          if (openOrders?.length < 2 && positions?.length === 1 && status?.isActiveExecuteTrade) {
            const side = positions[0].side === "short" ? 'buy' : 'sell';
            try {
              console.log(`Đã đóng lệnh Vị thế`);
              return await exchange.createMarketOrder(positions[0].symbol, side, Math.abs(parseFloat(positions[0].info.positionAmt)));
            } catch (error) { console.log(account?.idUser, account?.name, `Lỗi đóng lệnh Vị thế `); }
          }
        } catch (error) { console.log(`Lỗi gọi kiểm tra VỊ thế`); }



        // ____________2.  đóng vị TP/SL dư

        if (openOrders?.length === 1 && isCheckPosition?.length === 0) {
          try {
            const result = await exchange.cancelOrder(openOrders[0]?.id, this.symbol);
            console.error('đong length1 :');
            return result;
          } catch (error) {
            console.error('Lỗi length1:', error.message);
          }
        }
        if (openOrders?.length === 2 && isCheckPosition?.length === 0) {
          try {
            openOrders.map(async (value, index) => {
              const closeOder = await exchange.cancelOrder(value?.id, this.symbol, { timestamp });
              console.log("Đóng oder type 2 :", index);
              return closeOder
            })
          } catch (error) {
            console.error('Lỗi length2:', error.message);
          }
        }


        let trade
        try { trade = await exchange.fetchMyTrades(this.symbol, undefined, 9, { timestamp }); } catch (error) { console.log("Lỗi fetchMyTrades", error.message); }

        if (isCheckPosition?.length === 0 && status?.isActiveExecuteTrade && status?.isTrading && openOrders?.length === 0) {

          const mainPNL = trade.find((value => value.info.orderId === status.idOrderMain))
          const stopLossPNL = trade.find((value => value.info.orderId === status.idStopLossOrder))
          const takeProfitPNL = trade.find((value => value.info.orderId === status.idTakeProfitOrder))

          const totalPnl = [mainPNL, stopLossPNL, takeProfitPNL].reduce((total, pnl) => total + (Number(pnl?.info?.realizedPnl) || 0), 0);
          const isWin = totalPnl >= 0

          let sodu
          try { sodu = await this.MyInfomationService.getMyInfomation(account.idUser) }
          catch (error) {
            // this.addMessage(account?.idUser, account?.name, `Lỗi lấy thông tin số dư: ${error.message}`);
            console.log("Lỗi lấy thông tin số dư:", account?.name);
          }

          if (isWin) {
            const mesOder = `Đã win : ${totalPnl} - Tại thếp : ${status.foldingCurrent} `
            console.log(mesOder);
            // this.addMessage(account?.idUser, account?.name, mesOder);

            const payload = {
              isActiveExecuteTrade: false, foldingCurrent: 1, idOrderMain: "null", idStopLossOrder: "null", idTakeProfitOrder: "null",
              ...sodu.USDT.total > status.largestMoney && { largestMoney: `${sodu.USDT.total}` },
              ...status.isWaitingForCompletion && { isTrading: false, isWaitingForCompletion: false }
            }
            status.isWaitingForCompletion && console.log(account?.idUser, account?.name, "Đã dừng Trading");
            account?.idUser && this.startTradingService.updateTrading(account.idUser, payload);

          } else {
            const isFoldingbyMax = status.foldingCurrent === 3
            const foldingCurrent = isFoldingbyMax ? 1 : (status.foldingCurrent + 1);

            const payload = {
              isActiveExecuteTrade: false, foldingCurrent, idOrderMain: "null", idStopLossOrder: "null", idTakeProfitOrder: "null",
              ...(status.isWaitingForCompletion && isFoldingbyMax) && { isTrading: false, isWaitingForCompletion: false }
            }
            const mesOder = `Đã thua : ${totalPnl} - Tại thếp : ${status.foldingCurrent} - Thếp tiếp theo là: ${foldingCurrent} `
            console.log(mesOder);
            // this.addMessage(account?.idUser, account?.name, mesOder);
            if (status.isWaitingForCompletion && isFoldingbyMax) {
              // this.addMessage();
              console.log(account?.idUser, account?.name, "Đã dừng Trading");
            }
            account?.idUser && this.startTradingService.updateTrading(account.idUser, payload);
          }
        }
        // ____________________________________________________________________________end------------------------------------
      });

      const results = await Promise.all(promises);
      return results;
    }
    return
  }

  getMessenger() { return this.messenger }
}
