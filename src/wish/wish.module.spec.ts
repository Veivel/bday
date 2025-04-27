import { WishService } from './wish.service';
import { DateTime } from 'luxon';

describe('WishService', () => {
  let service: WishService;
  let userModel: {
    find: jest.Mock<any, any>;
    populate: jest.Mock<any, any>;
    exec: jest.Mock<Promise<any[]>, any>;
  };
  let configService: { get: jest.Mock<string, [string]> };
  let sendMock: jest.Mock;

  beforeEach(() => {
    // 1) fake out the Mongoose query chain: find().populate().find(filter).exec()
    userModel = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    // 2) fake ConfigService
    configService = { get: jest.fn().mockReturnValue('FAKE_RESEND_KEY') };

    // 3) instantiate the service
    service = new WishService(userModel as any, configService as any);

    // 4) override the private Resend client
    sendMock = jest.fn();
    (service as any).resend = { emails: { send: sendMock } };

    // 5) silence logs
    jest.spyOn((service as any).logger, 'log').mockImplementation();
    jest.spyOn((service as any).logger, 'error').mockImplementation();
    jest.spyOn((service as any).logger, 'debug').mockImplementation();
  });

  describe('sendEmail', () => {
    it('should call resend.emails.send and return data on success', async () => {
      const fakeData = { id: 'email-123' };
      sendMock.mockResolvedValue({ data: fakeData, error: null });

      const user = { email: 'a@b.com', name: 'Alice' } as any;
      const result = await service.sendEmail(user);

      expect(sendMock).toHaveBeenCalledWith({
        from: 'hello@testmail.veivelp.com',
        to: 'a@b.com',
        subject: 'Happy Birthday!',
        html: `<p>Happy birthday <strong>Alice</strong>!</p>`,
      });
      expect(result).toBe(fakeData);
      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Successfully sent email to a@b.com',
      );
    });

    it('should log error and return null on failure', async () => {
      const fakeErr = { message: 'oops' };
      sendMock.mockResolvedValue({ data: null, error: fakeErr });

      const user = { email: 'x@y.com', name: 'X' } as any;
      const result = await service.sendEmail(user);

      expect(result).toBeNull();
      expect((service as any).logger.error).toHaveBeenCalledWith({
        error: fakeErr,
      });
    });
  });

  describe('checkForBirthdays', () => {
    beforeEach(() => {
      // freeze "now" to a known UTC time
      jest
        .spyOn(DateTime, 'now')
        .mockReturnValue(DateTime.fromISO('2025-04-27T12:00:00Z'));
      // stub out sendEmail so it won't throw
      jest.spyOn(service, 'sendEmail').mockResolvedValue(null);
    });

    it('should send email and bump nextBirthWish when diff is between 9 and 10 hours', async () => {
      // nextBirthWish = 02:30Z => diff = 9.5h
      const wishDt = DateTime.fromISO('2025-04-27T02:30:00Z');
      const user: any = {
        nextBirthWish: wishDt.toJSDate(),
        timezone: { identifier: 'TZ', utcOffset: '+02:00' },
        email: 'hi@h.com',
        name: 'Hi',
        $set: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue('SAVED'),
        }),
      };

      userModel.exec.mockResolvedValue([user]);
      await service.checkForBirthdays();

      // should have invoked our stubbed sendEmail
      expect(service.sendEmail).toHaveBeenCalledWith(user);

      // nextBirthWish should be incremented by 1 year
      const expected = wishDt.plus({ years: 1 }).toUTC().toISO();
      expect(user.$set).toHaveBeenCalledWith({ nextBirthWish: expected });
    });

    it('should do nothing if diff is not in the 9–10h window', async () => {
      // nextBirthWish = 04:00Z => diff = 8h
      const wishDt = DateTime.fromISO('2025-04-27T04:00:00Z');
      const user: any = {
        nextBirthWish: wishDt.toJSDate(),
        timezone: { identifier: 'TZ', utcOffset: '+02:00' },
        $set: jest.fn(),
      };

      userModel.exec.mockResolvedValue([user]);
      await service.checkForBirthdays();

      expect(service.sendEmail).not.toHaveBeenCalled();
      expect(user.$set).not.toHaveBeenCalled();
    });

    it('should handle an empty user list gracefully', async () => {
      userModel.exec.mockResolvedValue([]);
      await expect(service.checkForBirthdays()).resolves.toBeUndefined();
      expect(service.sendEmail).not.toHaveBeenCalled();
    });
  });
});
