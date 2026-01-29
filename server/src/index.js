import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import logicRoutes from './routes/logic.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'LogicLab API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/logic', logicRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🔌 LogicLab API Server                  ║
║   Running on http://localhost:${PORT}        ║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
