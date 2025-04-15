import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { realtimeBTCWebsoketService } from './realtimeBTC-websoket.service';
import { paramGetEmaCrossHistoryDto } from './dto/param-ema-cross-history.dto';


@Controller('mesenger')
export class emaCrossHistoryController {
  constructor(private readonly realtimeBTCWebsoketService: realtimeBTCWebsoketService) { }

  @Get()
  async getEmaCrossHistory() {
    return this.realtimeBTCWebsoketService.getMessenger();
  }

}
