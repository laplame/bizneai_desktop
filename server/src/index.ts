import { startBizneaiServer } from './bootstrap.js';

startBizneaiServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
