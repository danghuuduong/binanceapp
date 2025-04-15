import { PartialType } from '@nestjs/mapped-types';
import { paramGetCandleDto } from './param-candle.dto';

export class UpdateCandleDto extends PartialType(paramGetCandleDto) {}
