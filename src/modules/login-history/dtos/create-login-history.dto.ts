import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateLoginHistoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ipAddress?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lon: number;

  @ApiProperty()
  @IsString()
  userAgent?: string;

  @ApiProperty()
  @IsString()
  deviceId?: string;
}
