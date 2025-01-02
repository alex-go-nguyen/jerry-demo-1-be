import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Column } from 'typeorm';
import { Type } from 'class-transformer';
import { SubscriptionPlanNames } from '@/common/enums';

export class CreateSubscriptionPlanDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @Column()
  name: SubscriptionPlanNames;

  @ApiProperty()
  @IsNotEmpty({ message: 'MaxAccounts is required' })
  @IsNumber()
  @Type(() => Number)
  @Column({ default: 10 })
  maxAccounts: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Weights is required' })
  @IsNumber()
  @Type(() => Number)
  @Column()
  weights: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber()
  @Type(() => Number)
  @Column()
  price: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  @Column()
  description: SubscriptionPlanNames;

  @ApiProperty()
  @IsNotEmpty({ message: 'MaxAccounts is required' })
  @IsNumber()
  @Type(() => Number)
  @Column({ default: 0 })
  maxWorkspaces: number;
}
