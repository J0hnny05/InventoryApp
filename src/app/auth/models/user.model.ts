import { HelperPermissionsDto } from './helper-permissions.model';
import { UserRole } from './role.model';

export interface AuthUser {
  readonly id: string;
  readonly username: string;
  readonly email?: string | null;
  readonly role: UserRole;
  readonly effectiveOwnerId: string;
  readonly isBlocked: boolean;
  readonly helperPermissions?: HelperPermissionsDto | null;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: string;
  readonly user: AuthUser;
  readonly permissions: readonly string[];
}
