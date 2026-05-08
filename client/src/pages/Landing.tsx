import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, CalendarCheck, ShieldCheck, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: CalendarCheck,
    title: 'Rendez-vous simplifiés',
    desc: 'Planification rapide avec rappels automatiques pour patients et médecins.',
  },
  {
    icon: ShieldCheck,
    title: 'Données sécurisées',
    desc: 'Authentification JWT, chiffrement bcrypt, contrôle d’accès par rôle.',
  },
  {
    icon: Stethoscope,
    title: 'Dossiers médicaux',
    desc: 'Historique complet, diagnostics et prescriptions accessibles en un clic.',
  },
];

export default function Landing() {
  return (
    <div className="space-y-16 py-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-secondary/40 text-xs font-medium">
          <Activity className="size-3.5 text-primary" />
          Plateforme de gestion clinique
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Soins de santé <span className="text-primary">modernes</span>, organisés.
        </h1>
        <p className="text-lg text-muted-foreground">
          HealthCare connecte administrateurs, secrétaires et patients dans une seule plateforme
          fluide, rapide et sûre.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/register">Commencer</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Se connecter</Link>
          </Button>
        </div>
      </motion.section>

      <section className="grid md:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
          >
            <Card className="h-full">
              <CardContent className="pt-6 space-y-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <f.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
