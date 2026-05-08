import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { usersRouter } from './routes/users.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/users', usersRouter);

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
