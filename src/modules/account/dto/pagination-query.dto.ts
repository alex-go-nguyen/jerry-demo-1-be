import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiProperty()
  @Min(1, { message: 'Page cannot be less than 1' })
  @IsInt({ message: 'Page must be an integer' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Page is required' })
  page: number;

  @ApiProperty()
  @Max(50, { message: 'Limit cannot be more than 50' })
  @Min(1, { message: 'Limit cannot be less than 1' })
  @IsInt({ message: 'Limit must be an integer' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Limit is required' })
  limit: number;

  @IsOptional()
  @IsString({ message: 'Keyword must be a string' })
  @ApiProperty({ description: 'Search keyword', required: false })
  keyword?: string;
}
