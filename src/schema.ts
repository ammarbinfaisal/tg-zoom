// src/schema.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: integer('telegram_id').notNull().unique(),
  username: text('username'),
  canUpload: text('can_upload').default('no'),
  createdAt: text('created_at').default(new Date().toISOString()),
});

export const zoomRecords = sqliteTable('zoom_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  date: text('date').notNull(),
  zoomUrl: text('zoom_url').notNull(),
  passcode: text('passcode').notNull(),
  filePath: text('file_path'),
  fileId: text('file_id'),
  uploadedBy: integer('uploaded_by').notNull(),
  status: text('status').default('pending'), // pending, downloading, completed, failed
  createdAt: text('created_at').default(new Date().toISOString()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  zoomRecords: many(zoomRecords),
}));

export const zoomRecordsRelations = relations(zoomRecords, ({ one }) => ({
  uploader: one(users, {
    fields: [zoomRecords.uploadedBy],
    references: [users.telegramId],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ZoomRecord = typeof zoomRecords.$inferSelect;
export type NewZoomRecord = typeof zoomRecords.$inferInsert;