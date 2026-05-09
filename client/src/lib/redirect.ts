import type { Role } from '@/lib/auth';

export function dashboardForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'SECRETARY':
      return '/dashboard/secretary';
    case 'DOCTOR':
      return '/dashboard/doctor';
    case 'PATIENT':
      return '/dashboard/patient';
  }
}
