import { IsEnum, IsString, Matches } from 'class-validator';
import { Timeframe } from './timeframe.enum';

export class paramGetCandleDto {
  @IsString() // Đảm bảo limit là một chuỗi
  @Matches(/^\d+$/, {
    message: 'Limit must be a valid number (only digits allowed)',
  })
  @Matches(/^(?!0$)(\d+)$/, {
    message: 'Limit must be greater than 1',
  })
  limit: string;

  @IsEnum(Timeframe, {
    message: `Invalid type, allowed values are: ${Object.values(Timeframe).join(', ')}`,
  })
  type: Timeframe;
}
