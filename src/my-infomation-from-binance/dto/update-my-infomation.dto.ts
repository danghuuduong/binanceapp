import { PartialType } from '@nestjs/mapped-types';
import { CreateMyInfomationDto } from './create-my-infomation.dto';

export class UpdateMyInfomationDto extends PartialType(CreateMyInfomationDto) {}
