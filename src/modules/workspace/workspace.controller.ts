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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Role } from '@/common/enums';
import { CurrentUser } from '@/decorators';
import { handleDataResponse } from '@/utils';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { User } from '@/modules/user/entities/user.entity';

import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@ApiTags('Workspace')
@Controller('workspaces')
@UseGuards(AuthGuard, RolesGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('create')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  @ApiCreatedResponse({
    description: 'Create workspace successfully!',
  })
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: User,
  ) {
    createWorkspaceDto.userId = user.id;

    try {
      await this.workspaceService.create(createWorkspaceDto);
      return handleDataResponse('Create workspace successfully', 'OK');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  async findAll(@CurrentUser() user: User) {
    return this.workspaceService.getWorkspacesByUserId(user.id);
  }

  @Put('update/:workspaceId')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() user: User,
  ) {
    try {
      updateWorkspaceDto.userId = user.id;
      updateWorkspaceDto.workspaceId = workspaceId;

      await this.workspaceService.update(updateWorkspaceDto);
      return handleDataResponse('Update workspace successfully', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Delete('soft-delete/:workspaceId')
  @Roles(Role.User)
  @HttpCode(204)
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
