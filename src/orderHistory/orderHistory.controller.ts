import { Controller, Get, Param, } from '@nestjs/common';
import { OrderHistoryService } from './orderHistory.service';

@Controller('order-history')
export class OrderHistoryController {
  constructor(private readonly OrderHistoryService: OrderHistoryService) { }
  // @Get()
  // findAll() {
  //   return this.OrderHistoryService.getOrderHistory();
  // }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.OrderHistoryService.getOrderHistory(id);
  }

}
