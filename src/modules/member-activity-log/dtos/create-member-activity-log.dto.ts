import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

import { EntityType, RoleAccess } from '@/common/enums';

export class CreateMemberActivityLogDto {
  @IsOptional()
  @IsString({ message: 'AccountId must be a string' })
  @ApiProperty()
  accountId?: string;

  @IsOptional()
  @IsString({ message: 'WorkspaceId must be a string' })
  @ApiProperty()
  workspaceId?: string;

  @IsString({ message: 'EntityType must be a string' })
  @IsNotEmpty({ message: 'EntityType is required' })
  @ApiProperty()
  entityType: EntityType;

  @IsString({ message: 'Action must be a string' })
  @IsNotEmpty({ message: 'Action is required' })
  @ApiProperty()
  action: RoleAccess;
}
