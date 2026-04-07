import express from 'express';

/** Cuerpo PUT /api/pos/kv leído en crudo (antes de express.json) para aceptar JSON o texto sin ambigüedad. */
export const posKvPutRawParser = express.raw({
  limit: '50mb',
  type: '*/*',
});
