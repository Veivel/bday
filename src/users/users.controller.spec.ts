import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'John Doe',
  email: 'john@example.com',
  timezone: { identifier: 'UTC' },
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findByEmail: jest.fn().mockResolvedValue(mockUser),
            findByObjectId: jest.fn().mockResolvedValue(mockUser),
            remove: jest.fn().mockResolvedValue(undefined),
            removeByObjectId: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('POST /users', () => {
    it('should create user', async () => {
      const createDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        birthDate: '1990-01-01',
        timezone: 'UTC',
      };
      const result = await controller.create(createDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user', async () => {
      const result = await controller.update('id', { name: 'New Name' });
      expect(result).toEqual(mockUser);
    });
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('DELETE /users/email/:email', () => {
    it('should return 204', async () => {
      const result = await controller.remove('john@example.com');
      expect(result).toBeUndefined();
    });
  });
});
