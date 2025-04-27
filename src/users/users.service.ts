import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import {
  Timezone,
  TimezoneDocument,
} from 'src/timezones/schemas/timezones.schema';
import { validate } from 'class-validator';
import mongoose from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Timezone.name) private tzModel: Model<TimezoneDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const tz = await this.tzModel.findOne({ identifier: dto.timezone }).exec();
    if (!tz) {
      throw new NotFoundException(`Timezone "${tz._id}" not found`);
    }

    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (Boolean(user)) {
      throw new BadRequestException(`User with email already exists`);
    }

    const created = new this.userModel({
      name: dto.name,
      email: dto.email,
      birthday: dto.birthday,
      timezone: tz._id,
    });
    return created.save();
  }

  findAll(): Promise<User[]> {
    return this.userModel
      .find()
      .populate<{ timezone: Timezone }>('timezone')
      .exec();
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email: email }).exec();
    if (!user) {
      throw new NotFoundException(`User ${email} not found`);
    }
    return user;
  }

  async findByObjectId(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User ${id} not found`);
      }
      return user;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async remove(email: string): Promise<void> {
    const res = await this.userModel.deleteOne({ email: email }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
  }

  async removeByObjectId(objectId: string): Promise<void> {
    const res = await this.userModel.deleteOne({ _id: objectId }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException(`User ${objectId} not found`);
    }
  }
}
