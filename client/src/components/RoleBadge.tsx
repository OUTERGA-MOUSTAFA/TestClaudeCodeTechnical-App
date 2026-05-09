import type { Role } from '@/lib/auth';
import { cn } from '@/lib/utils';

const STYLES: Record<Role, string> = {
  ADMIN: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  SECRETARY: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  DOCTOR: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  PATIENT: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
};

const LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  SECRETARY: 'Secrétaire',
  DOCTOR: 'Docteur',
  PATIENT: 'Patient',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium',
        STYLES[role],
      )}
    >
      {LABELS[role]}
    </span>
  );
}
