import { config } from './config.js';
import app from './app.js';
import { initDatabaseAndSeed } from './init.js';
import { query } from './db.js';

async function start() {
  try {
    await initDatabaseAndSeed();
    // Health endpoint minimal before routes usage
    app.get('/api/health', async (req, res) => {
      try {
        await query('SELECT 1');
        return res.json({ status: 'ok', database: 'connected' });
      } catch (e) {
        return res.status(500).json({ status: 'error', database: 'disconnected' });
      }
    });

    app.listen(config.server.port, () => {
      console.log(`Backend listening on :${config.server.port}`);
    });
  } catch (e) {
    console.error('Startup error:', e);
    process.exit(1);
  }
}

start();
