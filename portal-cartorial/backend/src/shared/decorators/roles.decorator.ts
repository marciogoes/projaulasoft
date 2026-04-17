import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles('cidadao', 'atendente') — restringe o endpoint a roles especificas.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
