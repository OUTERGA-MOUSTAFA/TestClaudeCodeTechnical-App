import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, FileText, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';

interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  patient: {
    dateOfBirth: string;
    gender: string;
    phone: string | null;
    address: string | null;
    bloodType: string | null;
    allergies: string | null;
    medicalHistory: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    insuranceProvider: string | null;
    insuranceNumber: string | null;
  };
}

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  reason: string | null;
  doctor: {
    specialty: string;
    user: { firstName: string; lastName: string };
  };
}

interface MedicalRecord {
  id: string;
  recordedAt: string;
  diagnosis: string;
  treatment: string | null;
  doctor: { specialty: string; user: { firstName: string; lastName: string } };
}

export default function PatientDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [records, setRecords] = useState<MedicalRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Profile>('/api/patient/me'),
      api<{ items: Appointment[] }>('/api/patient/appointments'),
      api<{ items: MedicalRecord[] }>('/api/patient/medical-records'),
    ])
      .then(([p, a, r]) => {
        setProfile(p);
        setAppointments(a.items);
        setRecords(r.items);
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
        <h1 className="text-2xl font-bold">Mon espace patient</h1>
        <p className="text-muted-foreground text-sm">Vos rendez-vous et votre dossier médical.</p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 space-y-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserRound className="size-4" /> Profil
            </CardTitle>
            {!profile ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <dl className="space-y-3 text-sm">
                <Section title="Identité">
                  <Field label="Nom" value={`${profile.firstName} ${profile.lastName}`} />
                  <Field label="Email" value={profile.email} />
                  <Field
                    label="Date de naissance"
                    value={new Date(profile.patient.dateOfBirth).toLocaleDateString('fr-FR')}
                  />
                  <Field label="Genre" value={profile.patient.gender} />
                  <Field label="Téléphone" value={profile.patient.phone ?? '—'} />
                  <Field label="Adresse" value={profile.patient.address ?? '—'} />
                </Section>
                <Section title="Santé">
                  <Field label="Groupe sanguin" value={profile.patient.bloodType ?? '—'} />
                  <Field label="Allergies" value={profile.patient.allergies ?? '—'} />
                  <Field label="Antécédents" value={profile.patient.medicalHistory ?? '—'} />
                </Section>
                <Section title="Contact d’urgence">
                  <Field label="Nom" value={profile.patient.emergencyContactName ?? '—'} />
                  <Field label="Téléphone" value={profile.patient.emergencyContactPhone ?? '—'} />
                </Section>
                <Section title="Assurance">
                  <Field label="Organisme" value={profile.patient.insuranceProvider ?? '—'} />
                  <Field label="N°" value={profile.patient.insuranceNumber ?? '—'} />
                </Section>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="size-4" /> Mes rendez-vous
              </CardTitle>
              <CardDescription>Historique et à venir.</CardDescription>
            </div>
            {!appointments ? (
              <Skeleton className="h-24 w-full" />
            ) : appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Aucun rendez-vous pour le moment.
              </p>
            ) : (
              <ul className="divide-y">
                {appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">
                        Dr {a.doctor.user.firstName} {a.doctor.user.lastName}
                        <span className="text-muted-foreground"> · {a.doctor.specialty}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.scheduledAt).toLocaleString('fr-FR')}
                        {a.reason && ` — ${a.reason}`}
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
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-4" /> Dossier médical
            </CardTitle>
            <CardDescription>Vos consultations passées.</CardDescription>
          </div>
          {!records ? (
            <Skeleton className="h-24 w-full" />
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Pas encore de dossier médical.
            </p>
          ) : (
            <ul className="divide-y">
              {records.map((r) => (
                <li key={r.id} className="py-3 text-sm">
                  <p className="font-medium">{r.diagnosis}</p>
                  {r.treatment && (
                    <p className="text-xs text-muted-foreground mt-0.5">{r.treatment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Dr {r.doctor.user.firstName} {r.doctor.user.lastName} · {r.doctor.specialty} ·{' '}
                    {new Date(r.recordedAt).toLocaleDateString('fr-FR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right break-words">{value}</dd>
    </div>
  );
}
