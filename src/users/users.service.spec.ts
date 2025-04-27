import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Timezone } from '../timezones/schemas/timezones.schema';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<User>;
  let tzModel: Model<Timezone>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john@example.com',
    timezone: {
      _id: 'tz123',
      identifier: 'UTC',
      utcOffset: '+00:00',
      abbreviation: 'UTC',
    },
    birthDate: new Date(),
    nextBirthWish: new Date(),
  };

  const mockTz = {
    _id: 'tz123',
    identifier: 'UTC',
    utcOffset: '+00:00',
    abbreviation: 'UTC',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
              populate: jest.fn().mockReturnThis(),
            }),
            findById: jest.fn().mockImplementation((id) => ({
              populate: jest.fn().mockReturnThis(),
              exec: jest.fn().mockResolvedValue({ ...mockUser, _id: id }),
            })),
            deleteOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            }),
            create: jest.fn().mockResolvedValue(mockUser),
            find: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockUser]),
              populate: jest.fn().mockReturnThis(),
            }),
          },
        },
        {
          provide: getModelToken(Timezone.name),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockTz),
          },
        },
        {
          provide: Connection,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    tzModel = module.get<Model<Timezone>>(getModelToken(Timezone.name));
  });

  describe('findByObjectId', () => {
    it('should find by object ID', async () => {
      const result = await service.findByObjectId('507f1f77bcf86cd799439011');
      expect(result).toEqual(
        expect.objectContaining({
          _id: '507f1f77bcf86cd799439011',
          timezone: expect.any(Object),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete by email', async () => {
      await service.remove('john@example.com');
      expect(userModel.deleteOne).toHaveBeenCalledWith({
        email: 'john@example.com',
      });
    });
  });
});
