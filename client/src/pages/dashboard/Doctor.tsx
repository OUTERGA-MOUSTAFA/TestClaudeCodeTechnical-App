import { motion } from 'framer-motion';
import { Stethoscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function DoctorDashboard() {
  const { user } = useAuth();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="size-6 text-primary" />
          Espace Docteur
        </h1>
        <p className="text-muted-foreground text-sm">
          Bienvenue Dr {user?.firstName} {user?.lastName}.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-2">
          <CardTitle className="text-lg">Bientôt disponible</CardTitle>
          <CardDescription>
            Les vues consacrées aux docteurs (planning, patients suivis, dossiers à compléter)
            arrivent prochainement.
          </CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
}
