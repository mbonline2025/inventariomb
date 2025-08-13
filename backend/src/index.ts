import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { prisma } from './utils/database';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import hardwareRoutes from './routes/hardware';
import chatRoutes from './routes/chat';
import vendorRoutes from './routes/vendor';
import userRoutes from './routes/user';

const app = express();

// --- Server config
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// --- Trust proxy (necessário se atrás de proxy/ingress para cookies SameSite=None/secure)
if ((process.env.TRUST_PROXY ?? '0') === '1') {
  app.set('trust proxy', 1);
}

// --- Security headers via helmet (com pequenos ajustes para dev)
app.use(
  helmet({
    crossOriginResourcePolicy: false, // permite servir assets para outros origins quando necessário
  })
);

// --- CORS
const defaultOrigins = 'http://localhost:5173,http://localhost:3000';
const allowedOrigins = (process.env.WEB_ORIGINS ?? process.env.FRONTEND_URL ?? defaultOrigins)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Permitir ferramentas sem origin (curl, Postman) e health checks
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};
app.use(cors(corsOptions));
// Trata preflight de forma abrangente
app.options('*', cors(corsOptions));

// --- Performance
app.use(compression());

// --- Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// --- Health check (coloque primeiro para facilitar monitoramento)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/users', userRoutes);

// --- 404 handler (somente para rotas não encontradas)
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// --- Error handling centralizado (último middleware)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err?.status ?? 500;
  const message = err?.message ?? 'Erro interno do servidor';
  logger.error('Erro não tratado:', { status, message, stack: err?.stack });

  // CORS errors chegam aqui também
  if (message?.toString?.().startsWith('Not allowed by CORS')) {
    return res.status(403).json({ error: 'Origin não autorizado por CORS' });
  }

  return res.status(status).json({ error: message });
});

// --- Graceful shutdown
const shutdown = async (signal: string) => {
  try {
    logger.info(`Recebido ${signal}. Encerrando servidor...`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    logger.error('Erro ao encerrar servidor', e);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { err });
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
});

// --- Start
app.listen(PORT, HOST, () => {
  logger.info(`Servidor rodando em http://${HOST}:${PORT}`);
  logger.info(`Ambiente: ${NODE_ENV}`);
  logger.info(`CORS liberado para: ${allowedOrigins.join(', ')}`);
});

export default app;
