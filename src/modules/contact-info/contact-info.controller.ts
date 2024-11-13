import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { handleDataResponse } from '@/utils';
import { ErrorCode, Role } from '@/common/enums';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { Roles } from '@/modules/auth/roles.decorator';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { User } from '@/modules/user/entities/user.entity';

import { ContactInfoService } from './contact-info.service';
import { CreateContactInfoDto, UpdateContactInfoDto } from './dtos';

@ApiTags('ContactInfo')
@Controller('contact-info')
@UseGuards(AuthGuard, RolesGuard)
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  @Post('store')
  @Roles(Role.User)
  @ApiBadRequestResponse({ description: 'Missing input!' })
  @ApiOkResponse({
    description: 'Store contact info successfully!',
  })
  async storeAccount(
    @Body() createContactInfoDto: CreateContactInfoDto,
    @Req() request: Request,
  ) {
    try {
      const user = request['user'] as User;
      await this.contactInfoService.create(user, createContactInfoDto);
      return handleDataResponse('Store contact info successfully!', 'OK');
    } catch (error) {
      throw error;
    }
  }

  @Get('')
  @Roles(Role.User)
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Get contact info successfully!',
  })
  async getContactInfoByUserId(@Req() request: Request) {
    try {
      const user = request['user'];
      return this.contactInfoService.getContactInfoByUserId(user.id);
    } catch (error) {
      throw error;
    }
  }

  @Get(':contactInfoId')
  @Roles(Role.User)
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Get contact info by id successfully!',
  })
  async getContactInfoById(
    @Param('contactInfoId') contactInfoId: string,
    @Req() request: Request,
  ) {
    try {
      const user = request['user'];
      return this.contactInfoService.getContactInfoById(user.id, contactInfoId);
    } catch (error) {
      if (error.message === ErrorCode.CONTACT_INFO_NOT_FOUND) {
        throw new NotFoundException('Contact info not found');
      } else {
        throw error;
      }
    }
  }

  @Put('update/:contactInfoId')
  @Roles(Role.User)
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Update contact info successfully!',
  })
  async update(
    @Req() request: Request,
    @Param('contactInfoId') contactInfoId: string,
    @Body() updateContactInfoData: UpdateContactInfoDto,
  ) {
    try {
      const user = request['user'];
      await this.contactInfoService.update(
        user.id,
        contactInfoId,
        updateContactInfoData,
      );
      return handleDataResponse('Update contact info successfully!', 'OK');
    } catch (error) {
      if (error.message === ErrorCode.CONTACT_INFO_NOT_FOUND) {
        throw new NotFoundException('Contact info not found');
      } else {
        throw error;
      }
    }
  }

  @Delete('soft-delete/:contactInfoId')
  @Roles(Role.User)
  @HttpCode(204)
  @ApiOkResponse({
    description: 'Delete contact info successfully!',
  })
  async softRemove(
    @Req() request: Request,
    @Param('contactInfoId') contactInfoId: string,
  ) {
    try {
      const user = request['user'];
      return this.contactInfoService.softRemove(user.id, contactInfoId);
    } catch (error) {
      if (error.message === ErrorCode.CONTACT_INFO_NOT_FOUND) {
        throw new NotFoundException('Contact info not found');
      } else {
        throw error;
      }
    }
  }
}
