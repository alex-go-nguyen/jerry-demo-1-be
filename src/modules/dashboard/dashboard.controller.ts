import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@/modules/auth/auth.guard';
import { RolesGuard } from '@/modules/auth/roles.guard';

import { DashboardService } from './dashboard.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('user-registrations')
  @HttpCode(200)
  async getUserRegistrations() {
    try {
      return await this.dashboardService.getUserRegistrations();
    } catch (error) {
      throw error;
    }
  }

  @Get('accounts-of-users')
  @HttpCode(200)
  async getAccountsByDomain() {
    return await this.dashboardService.getAccountsByDomain();
  }

  @Get('quantity-user')
  @HttpCode(200)
  async getQuantityUser() {
    return await this.dashboardService.getQuantityUser();
  }

  @Get('quantity-account')
  @HttpCode(200)
  async getQuantityAccount() {
    return await this.dashboardService.getQuantityAccount();
  }

  @Get('quantity-workspace')
  @HttpCode(200)
  async getQuantityWorkspace() {
    return await this.dashboardService.getQuantityWorkspace();
  }
}
