import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Search, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api';

interface PatientRow {
  id: string;
  bloodType: string | null;
  user: { firstName: string; lastName: string; email: string };
}

interface AppointmentRow {
  id: string;
  scheduledAt: string;
  status: string;
  reason: string | null;
  patient: { user: { firstName: string; lastName: string } };
  doctor: { specialty: string };
}

export default function SecretaryDashboard() {
  const [patients, setPatients] = useState<PatientRow[] | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = search
      ? `/api/secretary/patients?search=${encodeURIComponent(search)}`
      : '/api/secretary/patients?take=10';
    api<{ items: PatientRow[] }>(url)
      .then((d) => setPatients(d.items))
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, [search]);

  useEffect(() => {
    api<{ items: AppointmentRow[] }>('/api/secretary/appointments?take=10')
      .then((d) => setAppointments(d.items))
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
        <h1 className="text-2xl font-bold">Dashboard Secrétaire</h1>
        <p className="text-muted-foreground text-sm">Patients et rendez-vous de la clinique.</p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserRound className="size-4" /> Patients
            </CardTitle>
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {!patients ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : patients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucun patient.</p>
          ) : (
            <ul className="divide-y">
              {patients.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {p.user.firstName} {p.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.user.email}</p>
                  </div>
                  {p.bloodType && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {p.bloodType}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="size-4" /> Prochains rendez-vous
            </CardTitle>
            <CardDescription>10 derniers ajoutés.</CardDescription>
          </div>
          {!appointments ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucun rendez-vous.</p>
          ) : (
            <ul className="divide-y">
              {appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {a.patient.user.firstName} {a.patient.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.scheduledAt).toLocaleString('fr-FR')} · {a.doctor.specialty}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
