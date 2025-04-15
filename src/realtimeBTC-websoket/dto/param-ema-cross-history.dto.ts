import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class paramGetEmaCrossHistoryDto {
  @Transform(({ value }) => Number(value)) 
  @IsInt() 
  @Min(0) 
  @Max(30) 
  page: number;

  @Transform(({ value }) => Number(value)) 
  @IsInt() // Kiểm tra giá trị là số nguyên
  @Min(1)
  @IsOptional() // Không bắt buộc
  @Max(30) 
  limit?: number;
}
