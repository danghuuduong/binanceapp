// src/time/time.module.ts
import { Module } from '@nestjs/common';
import { TimeService } from './time.service';

@Module({
  providers: [TimeService],
  exports: [TimeService],  // Export TimeService để có thể sử dụng ở các module khác
})
export class TimeModule {}
