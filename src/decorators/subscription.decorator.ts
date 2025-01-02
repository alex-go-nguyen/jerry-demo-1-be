import { SetMetadata } from '@nestjs/common';

export const CheckSubscriptionType = (type: 'accounts' | 'workspaces') =>
  SetMetadata('checkLimitType', type);
