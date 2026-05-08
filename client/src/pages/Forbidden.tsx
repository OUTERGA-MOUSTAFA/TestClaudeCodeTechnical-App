import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Forbidden() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="max-w-md mx-auto py-16 text-center space-y-4"
    >
      <div className="size-16 mx-auto rounded-full bg-destructive/10 text-destructive grid place-items-center">
        <ShieldAlert className="size-8" />
      </div>
      <h1 className="text-3xl font-bold">403 — Accès refusé</h1>
      <p className="text-muted-foreground">
        Vous n’avez pas l’autorisation de consulter cette page.
      </p>
      <Button asChild>
        <Link to="/">Retour à l’accueil</Link>
      </Button>
    </motion.div>
  );
}
