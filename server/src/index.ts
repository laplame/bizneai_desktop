import { startBizneaiServer } from './bootstrap';

startBizneaiServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
