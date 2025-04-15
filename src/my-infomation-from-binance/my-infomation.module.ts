import { Global, Module } from '@nestjs/common';
import { MyInfomationService } from './my-infomation.service';
import { MyInfomationController } from './my-infomation.controller';

@Global()
@Module({
  controllers: [MyInfomationController],
  providers: [MyInfomationService],
  exports: [MyInfomationService]
})
export class MyInfomationModule { }
