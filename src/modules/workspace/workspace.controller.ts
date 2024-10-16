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
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Req() request: Request,
  ) {
    const user = request['user'];

    createWorkspaceDto.userId = user.id;

    try {
      return this.workspaceService.create(createWorkspaceDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  findAll(@Req() request: Request) {
    try {
      const user = request['user'];
      return this.workspaceService.getWorkspacesByUserId(user.id);
    } catch (error) {
      throw error;
    }
  }

  @Put('update/:workspaceId')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input! or User not found' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];

      updateWorkspaceDto.userId = user.id;
      updateWorkspaceDto.workspaceId = workspaceId;

      return this.workspaceService.update(updateWorkspaceDto);
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
      return await this.workspaceService.softRemove(user.id, workspaceId);
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
      return await this.workspaceService.restore(workspaceId);
    } catch (error) {
      throw error;
    }
  }
}
