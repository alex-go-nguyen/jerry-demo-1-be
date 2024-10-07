import { Controller, Get, UseGuards } from '@nestjs/common';

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
  async getUserRegistrations() {
    return await this.dashboardService.getUserRegistrations();
  }

  @Get('accounts-of-users')
  async getAccountsByDomain() {
    return await this.dashboardService.getAccountsByDomain();
  }
}
