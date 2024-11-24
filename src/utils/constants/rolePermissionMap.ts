import { RoleAccess } from '@/common/enums';

export const rolePermissionsMap: Record<RoleAccess, RoleAccess[]> = {
  [RoleAccess.READ]: [RoleAccess.READ],
  [RoleAccess.CREATE]: [RoleAccess.READ, RoleAccess.CREATE],
  [RoleAccess.UPDATE]: [RoleAccess.READ, RoleAccess.UPDATE],
  [RoleAccess.DELETE]: [RoleAccess.READ, RoleAccess.DELETE],
  [RoleAccess.MANAGE]: [RoleAccess.READ, RoleAccess.UPDATE, RoleAccess.MANAGE],
};
