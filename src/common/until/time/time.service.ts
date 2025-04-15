// src/time/time.service.ts
import { Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()


export class TimeService {

  formatTimestampToDatetime(data): string {
    const timeBinance = new Date(data);
    const year = timeBinance.getUTCFullYear();
    const month = String(timeBinance.getUTCMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const day = String(timeBinance.getUTCDate()).padStart(2, '0');
    const hours = String(timeBinance.getUTCHours()).padStart(2, '0');
    const minutes = String(timeBinance.getUTCMinutes()).padStart(2, '0');
    const seconds = String(timeBinance.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(timeBinance.getUTCMilliseconds()).padStart(3, '0');

    // Tạo chuỗi ISO 8601
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

    return isoString;
  }
}
