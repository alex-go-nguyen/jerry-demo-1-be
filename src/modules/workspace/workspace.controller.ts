import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
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

import { WorkspaceService } from './workspace.service';

import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

import { AuthGuard } from '@/modules/auth/auth.guard';

import { RolesGuard } from '@/modules/auth/roles.guard';

import { Roles } from '@/modules/auth/roles.decorator';
import { handleDataResponse } from '@/utils';

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
    @Req() request: Request,
  ) {
    const user = request['user'];

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
  async findAll(@Req() request: Request) {
    const user = request['user'];
    return this.workspaceService.getWorkspacesByUserId(user.id);
  }

  @Put('update/:workspaceId')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];

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
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];
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
