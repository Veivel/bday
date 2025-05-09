import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Timezone, TimezoneDocument } from './schemas/timezones.schema';
import { CreateTimezoneDto } from './dto/create-timezone.dto';

@Injectable()
export class TimezonesService {
  constructor(
    @InjectModel(Timezone.name) private tzModel: Model<TimezoneDocument>,
  ) {}

  async create(createDto: CreateTimezoneDto): Promise<Timezone> {
    const created = new this.tzModel(createDto);
    return created.save();
  }

  async findAll(): Promise<Timezone[]> {
    return this.tzModel.find().exec();
  }

  async findAllIdentifiers(): Promise<string[]> {
    const timezones = await this.tzModel
      .find({}, { identifier: 1, utcOffset: 1 })
      .exec();
    const identifiers: string[] = [];
    timezones.forEach((tz) => {
      identifiers.push(tz.identifier);
    });

    return identifiers;
  }

  async findOne(identifier: string): Promise<Timezone> {
    if (identifier === null) {
      throw new BadRequestException(`Timezone identifier cannot be null`);
    }
    const tz = await this.tzModel.findOne({ identifier: identifier }).exec();
    if (!tz) {
      throw new NotFoundException(`Timezone ${identifier} not found`);
    }
    return tz;
  }

  async remove(identifier: string): Promise<void> {
    const res = await this.tzModel.deleteOne({ identifier: identifier }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException(`Timezone ${identifier} not found`);
    }
  }
}
