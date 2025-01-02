import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  BadRequestException,
  UseGuards,
  Put,
  HttpCode,
  Patch,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { handleDataResponse } from '@/utils';
import { Role, RoleAccess } from '@/common/enums';
import { PoliciesWorkspaceGuard, SubscriptionGuard } from '@/guards';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import {
  CheckPolicies,
  CheckSubscriptionType,
  CurrentUser,
} from '@/decorators';
import { User } from '@/modules/user/entities/user.entity';
import { PaginationQueryDto } from '@/modules/account/dto/pagination-query.dto';

import { WorkspaceService } from './workspace.service';
import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@ApiTags('Workspace')
@Controller('workspaces')
@UseGuards(AuthGuard, RolesGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('create')
  @UseGuards(SubscriptionGuard)
  @CheckSubscriptionType('workspaces')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  @ApiCreatedResponse({
    description: 'Create workspace successfully!',
  })
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: User,
  ) {
    try {
      await this.workspaceService.create(user.id, createWorkspaceDto);
      return handleDataResponse('Create workspace successfully', 'OK');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':workspaceId')
  @Roles(Role.User)
  @UseGuards(PoliciesWorkspaceGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.READ, Workspace))
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  async findOne(@Param('workspaceId') workspaceId: string) {
    try {
      return await this.workspaceService.findOne(workspaceId);
    } catch (error) {
      throw error;
    }
  }

  @Get('')
  @Roles(Role.User)
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  async findAll(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
    return this.workspaceService.getWorkspacesByUserId(user.id, query);
  }

  @Put('update/:workspaceId')
  @Roles(Role.User)
  @UseGuards(PoliciesWorkspaceGuard)
  @CheckPolicies((ability) => ability.can(RoleAccess.UPDATE, Workspace))
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceData: UpdateWorkspaceDto,
    @CurrentUser() user: User,
  ) {
    try {
      await this.workspaceService.update(
        workspaceId,
        user,
        updateWorkspaceData,
      );
      return handleDataResponse('Update workspace successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Delete('soft-delete/:workspaceId')
  @Roles(Role.User)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBadRequestResponse({ description: 'Missing input!' })
  async softRemove(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: User,
  ) {
    try {
      await this.workspaceService.softRemove(user.id, workspaceId);
      return handleDataResponse('Delete workspace successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Patch('restore/:workspaceId')
  @Roles(Role.Admin)
  @ApiBadRequestResponse({ description: 'Missing input!' })
  @ApiOkResponse({ description: 'Restore workspace ok' })
  async restoreWorkspace(@Param('workspaceId') workspaceId: string) {
    try {
      await this.workspaceService.restore(workspaceId);
      return handleDataResponse('Restore workspace successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }
}
