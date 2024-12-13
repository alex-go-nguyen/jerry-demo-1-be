import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLoginHistoryDto {
  @ApiProperty()
  @IsOptional()
  @IsString({ message: 'ipAddress must be a string' })
  ipAddress?: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Address is required' })
  @IsString({ message: 'Address must be a string' })
  address: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'lat is required' })
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'lon is required' })
  @IsNumber()
  lon: number;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: 'userAgent must be a string' })
  userAgent?: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: 'deviceId must be a string' })
  deviceId?: string;
}
