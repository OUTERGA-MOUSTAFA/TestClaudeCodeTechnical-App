import { useEffect, useState } from 'react';
import { HealthResponseSchema, type HealthResponse } from '@app/shared';

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(HealthResponseSchema.parse(data)))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-2">TestClaudeCodeTechnical-App</h1>
        <p className="text-slate-400 mb-6">
          React + Vite + Tailwind connected to Express + Prisma backend.
        </p>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 font-mono text-sm">
          <div className="text-slate-400 mb-2">GET /api/health</div>
          {error && <div className="text-red-400">Error: {error}</div>}
          {!error && !health && <div className="text-slate-500">Loading…</div>}
          {health && (
            <pre className="text-emerald-300 whitespace-pre-wrap">
              {JSON.stringify(health, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
