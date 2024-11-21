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
  UseGuards,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/decorators';
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
    @CurrentUser() user: User,
  ) {
    try {
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
  async getContactInfoByUserId(@CurrentUser() user: User) {
    try {
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
    @CurrentUser() user: User,
  ) {
    try {
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
    @CurrentUser() user: User,
    @Param('contactInfoId') contactInfoId: string,
    @Body() updateContactInfoData: UpdateContactInfoDto,
  ) {
    try {
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
    @CurrentUser() user: User,
    @Param('contactInfoId') contactInfoId: string,
  ) {
    try {
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
