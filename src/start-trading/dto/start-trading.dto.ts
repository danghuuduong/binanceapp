import { Transform } from 'class-transformer';
import { IsString, IsEmail, IsNumber, isString, IsBoolean } from 'class-validator';

export class startTradingDto {
  @IsBoolean()
  isTrading: boolean;

  @Transform(({ value }) => Number(value))
  tradeRate: number;

  @Transform(({ value }) => Number(value))
  largestMoney: number;

}