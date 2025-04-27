import { IsString, Matches } from 'class-validator';

export class CreateTimezoneDto {
  @IsString()
  identifier: string;

  @IsString()
  @Matches(/^[+-]?\d{1,2}(:\d{2})?$/, {
    message: 'utcOffset must be a string like "+05:30" or "-04"',
  })
  utcOffset: string;

  @IsString()
  abbreviation: string;
}
