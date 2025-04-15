import { BadRequestException, Body, Controller, Get, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { startTradingService } from './start-trading.service';
import { startTradingDto } from './dto/start-trading.dto';
import { UpdateStartTradingDto } from './dto/update-status-trading.dto';
import { Public } from 'src/decorate/customize';

@Controller('status')
export class StatusTradingController {
  constructor(private readonly startTradingService: startTradingService) { }
  @Get("start-trading-get")
  async getStartTrading() {
    const result = await this.startTradingService.getStartTradingData();
    return result;
  }


  @Get(':id')
  async getTradingById(@Param('id') id: string) {
    return await this.startTradingService.getTradingById(id);
  }

  @Post('create-start-trading')
  async createStartTrading(@Body() payload: { userId: string }) {
    return this.startTradingService.createStartTrading(payload.userId);
  }


  @Put(':id')
  async updateTrading(
    @Param('id') id: string,
    @Body() updateDto: UpdateStartTradingDto,
  ) {
    return this.startTradingService.updateTrading(id, updateDto);
  }

}
