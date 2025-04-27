import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TimezonesService } from './timezones.service';
import { CreateTimezoneDto } from './dto/create-timezone.dto';
import { Timezone } from './schemas/timezones.schema';

@Controller('timezones')
export class TimezonesController {
  constructor(private readonly tzService: TimezonesService) {}

  @Post()
  async create(@Body() createDto: CreateTimezoneDto): Promise<Timezone> {
    return this.tzService.create(createDto);
  }

  @Get()
  async findAll(): Promise<Timezone[]> {
    return this.tzService.findAll();
  }

  @Get(':identifier')
  async findOne(@Param('identifier') id: string): Promise<Timezone> {
    return this.tzService.findOne(id);
  }

  @Delete(':identifier')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('identifier') id: string): Promise<void> {
    return this.tzService.remove(id);
  }
}
