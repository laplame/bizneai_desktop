/**
 * Reexporta el motor de sincronización por lotes (`mcpBatchSync.ts`).
 */

export {
  KEYS,
  runFullBackupSync,
  runMcpFullBackupBatched,
  syncMcpBatch,
  isBatchDue,
  readFullBackupMeta,
  sleep,
  MCP_BATCH_INTERVAL_MS,
  DEFAULT_INTER_BATCH_GAP_MS,
  DEFAULT_INTER_PAGE_DELAY_MS,
  FULL_BACKUP_ORDER,
  type McpBatchId,
  type FullBackupResult,
  type BackupSection,
  type SectionResult,
  type RunMcpFullBackupBatchedOptions,
  type SyncMcpBatchOptions,
} from './mcpBatchSync';
