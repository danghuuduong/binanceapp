import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/decorate/customize';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Public()
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async handlefindOne(@Param('id') id: string) {
    return this.usersService.findOneFE(id);
  }

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  updateUser(@Body() UpdateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(UpdateUserDto);
  }
}
