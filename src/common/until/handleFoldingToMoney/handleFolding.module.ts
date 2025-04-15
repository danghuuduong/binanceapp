// src/time/time.module.ts
import { Module } from '@nestjs/common';
import { handleFoldingService } from './handleFolding.service';

@Module({
  providers: [handleFoldingService],
  exports: [handleFoldingService],  // Export TimeService để có thể sử dụng ở các module khác
})
export class HandleFoldingServiceModule {}
