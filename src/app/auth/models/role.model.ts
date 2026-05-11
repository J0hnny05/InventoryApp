/** Matches `UserRole` enum on the backend, which is serialised as camelCase via
 *  `JsonStringEnumConverter(JsonNamingPolicy.CamelCase)`. */
export type UserRole = 'owner' | 'helper' | 'admin';

export function roleLabel(role: UserRole | null | undefined): string {
  switch (role) {
    case 'owner': return 'Owner';
    case 'helper': return 'Helper';
    case 'admin': return 'Admin';
    default: return '—';
  }
}
