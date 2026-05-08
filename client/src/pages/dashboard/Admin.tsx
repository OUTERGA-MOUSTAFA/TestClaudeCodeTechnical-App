import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CalendarDays, FileText, Stethoscope, UserRound, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';

interface Stats {
  users: { total: number; admin: number; secretary: number; patient: number };
  doctors: number;
  appointments: { total: number; scheduled: number; completed: number };
  medicalRecords: number;
}

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SECRETARY' | 'PATIENT';
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Stats>('/api/admin/stats'),
      api<{ items: UserRow[] }>('/api/admin/users?take=10'),
    ])
      .then(([s, u]) => {
        setStats(s);
        setUsers(u.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="size-6 text-primary" />
          Dashboard Administrateur
        </h1>
        <p className="text-muted-foreground text-sm">
          Vue d’ensemble de la clinique et gestion des utilisateurs.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Utilisateurs" value={stats?.users.total} />
        <StatCard icon={UserRound} label="Patients" value={stats?.users.patient} />
        <StatCard icon={Stethoscope} label="Médecins" value={stats?.doctors} />
        <StatCard
          icon={CalendarDays}
          label="Rendez-vous"
          value={stats?.appointments.total}
          sub={
            stats
              ? `${stats.appointments.scheduled} programmés · ${stats.appointments.completed} terminés`
              : undefined
          }
        />
      </section>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-4" /> Derniers utilisateurs
              </CardTitle>
              <CardDescription>10 derniers comptes créés.</CardDescription>
            </div>
          </div>
          <div className="overflow-x-auto">
            {!users ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Nom</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Rôle</th>
                    <th className="py-2 pr-4 font-medium">État</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {u.isActive ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Actif</span>
                        ) : (
                          <span className="text-muted-foreground">Inactif</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-start gap-3">
        <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">
            {value ?? <Skeleton className="h-7 w-12 inline-block align-middle" />}
          </p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
