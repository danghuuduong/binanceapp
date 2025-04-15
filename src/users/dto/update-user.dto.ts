import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';


import { IsString, IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
    @IsMongoId({ message: 'Invalid không hợp lệ' })
    @IsNotEmpty({ message: 'ID ckhông được để trống' })
    _id: string
    @IsString()
    keyApi: string;

    @IsString()
    secret: string;
}

