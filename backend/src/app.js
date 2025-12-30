import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());
app.disable('x-powered-by');
const allowedOrigins = [config.server.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: false }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', router);
app.use(errorHandler);

export default app;
