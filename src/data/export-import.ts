// One-file backup. Export writes every table; import validates, then replaces all local data.
// Merging two devices is out of scope (TRD "Local data model").
import { z } from 'zod';
import { toDay } from '../engine/dates';
import { db, SCHEMA_VERSION, TABLES, type GraphiteDB, type TableName } from './db';

export interface Backup {
  app: 'graphite';
  schemaVersion: number;
  exportedAt: number;
  tables: Record<TableName, unknown[]>;
}

const BackupSchema = z.object({
  app: z.literal('graphite'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.number(),
  tables: z
    .record(z.array(z.record(z.unknown())))
    .refine((tables) => TABLES.every((t) => Array.isArray(tables[t])), 'missing a table'),
});

export async function exportAll(d: GraphiteDB = db, now = Date.now()): Promise<Backup> {
  const tables = {} as Record<TableName, unknown[]>;
  await d.transaction('r', TABLES.map((t) => d.table(t)), async () => {
    for (const t of TABLES) tables[t] = await d.table(t).toArray();
  });
  return { app: 'graphite', schemaVersion: SCHEMA_VERSION, exportedAt: now, tables };
}

export function backupFileName(now = new Date()): string {
  return `graphite-backup-${toDay(now)}.json`;
}

export type ImportResult = { ok: true; rows: number } | { ok: false; error: string };

/** Validates the file, then replaces every table in one transaction (all or nothing). */
export async function importAll(raw: unknown, d: GraphiteDB = db): Promise<ImportResult> {
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'This file is not a Graphite backup.' };
  const backup = parsed.data;
  if (backup.schemaVersion > SCHEMA_VERSION) return { ok: false, error: 'This backup is from a newer version of Graphite. Update the app first.' };
  let rows = 0;
  await d.transaction('rw', TABLES.map((t) => d.table(t)), async () => {
    for (const t of TABLES) {
      await d.table(t).clear();
      const items = backup.tables[t]!;
      if (items.length) await d.table(t).bulkAdd(items);
      rows += items.length;
    }
  });
  return { ok: true, rows };
}

/** Wipes everything (Settings → Reset). */
export async function resetAll(d: GraphiteDB = db): Promise<void> {
  await d.transaction('rw', TABLES.map((t) => d.table(t)), async () => {
    for (const t of TABLES) await d.table(t).clear();
  });
}
