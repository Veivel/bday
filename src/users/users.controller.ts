import { Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(): string {
    return 'This action adds a new user';
  }

  @Get()
  findAll(): string {
    return 'This action returns all users';
  }

  @Get('/:id')
  findById(): string {
    return '';
  }
}
