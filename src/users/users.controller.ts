import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async create(@Body() createDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createDto);
  }

  @Get()
  async findAll(): Promise<User[] | User> {
    return this.usersService.findAll();
  }

  @Get('email/:email')
  async findOneEmail(@Param('email') email: string): Promise<User[] | User> {
    if (email) {
      return this.usersService.findByEmail(email);
    }
  }

  @Get('_id/:id')
  async findOneByObjectId(@Param('id') id: string): Promise<User[] | User> {
    if (id) {
      return this.usersService.findByObjectId(id);
    }
  }

  @Delete('email/:email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('email') email: string): Promise<void> {
    return this.usersService.remove(email);
  }

  @Delete(':objectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByObjectId(@Param('objectId') objectId: string): Promise<void> {
    return this.usersService.removeByObjectId(objectId);
  }
}
