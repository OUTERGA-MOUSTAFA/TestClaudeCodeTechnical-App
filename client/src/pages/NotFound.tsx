import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto py-16 text-center space-y-4"
    >
      <motion.div
        animate={{ rotate: [0, 6, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="size-16 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center"
      >
        <Compass className="size-8" />
      </motion.div>
      <h1 className="text-3xl font-bold">404 — Page introuvable</h1>
      <p className="text-muted-foreground">
        L'adresse demandée n'existe pas. Retournez à un endroit connu.
      </p>
      <Button asChild>
        <Link to="/">Accueil</Link>
      </Button>
    </motion.div>
  );
}
