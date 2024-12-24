import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page cannot be less than 1' })
  page: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit cannot be less than 1' })
  @Max(50, { message: 'Limit cannot be more than 50' })
  limit: number;

  @IsOptional()
  @IsString({ message: 'Keyword must be a string' })
  @ApiProperty({ description: 'Search keyword', required: false })
  keyword?: string;
}
