import { Controller, Get, Param } from '@nestjs/common';
import { MyInfomationService } from './my-infomation.service';

@Controller('my-infomation')
export class MyInfomationController {
  constructor(private readonly myInfomationService: MyInfomationService) { }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.myInfomationService.getMyInfomation(id);
  }

  @Get('orders/:id')
  async findOrdersOne(@Param('id') id: string) {
    return this.myInfomationService.getMyOrdersAndPositions(id);
  }
}
