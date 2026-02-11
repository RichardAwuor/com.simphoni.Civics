import { pgTable, text, uuid, timestamp, boolean, integer, decimal, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Agents table
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  county: text('county').notNull(),
  constituency: text('constituency').notNull(),
  ward: text('ward').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  nationalIdHash: text('national_id_hash').notNull(), // Encrypted 8-digit national ID
  civicCode: text('civic_code').notNull().unique(), // Format: COUNTYNAME-XXX-XXXX-XX
  biometricEnabled: boolean('biometric_enabled').default(false).notNull(),
  biometricPublicKey: text('biometric_public_key'), // Device's biometric credential identifier
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  userId: text('user_id').notNull(), // Foreign key to auth user (Better Auth)
}, (table) => [
  index('agents_email_idx').on(table.email),
  index('agents_civic_code_idx').on(table.civicCode),
  index('agents_user_id_idx').on(table.userId),
  index('agents_county_idx').on(table.county),
  index('agents_biometric_public_key_idx').on(table.biometricPublicKey),
]);

// OTP codes table for passwordless authentication
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  code: text('code').notNull(), // 6-digit OTP
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  used: boolean('used').default(false).notNull(),
}, (table) => [
  index('otp_email_idx').on(table.email),
  index('otp_used_idx').on(table.used),
  index('otp_expires_idx').on(table.expiresAt),
]);

// Incident videos table
export const incidentVideos = pgTable('incident_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  videoUrl: text('video_url').notNull(),
  videoCode: text('video_code').notNull(), // Format: CIVIC_CODE-A/B/C
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  locationName: text('location_name'),
  duration: integer('duration'), // in seconds, max 60
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('incident_videos_agent_id_idx').on(table.agentId),
  index('incident_videos_video_code_idx').on(table.videoCode),
]);

// Polling stations table
export const pollingStations = pgTable('polling_stations', {
  id: uuid('id').primaryKey().defaultRandom(),
  county: text('county').notNull(),
  constituency: text('constituency').notNull(),
  ward: text('ward').notNull(),
  stationName: text('station_name').notNull(),
  stationCode: text('station_code').notNull().unique(),
  expectedAgents: integer('expected_agents').default(1).notNull(),
}, (table) => [
  index('polling_stations_county_idx').on(table.county),
  index('polling_stations_constituency_idx').on(table.constituency),
  index('polling_stations_ward_idx').on(table.ward),
  index('polling_stations_station_code_idx').on(table.stationCode),
]);

// Form34A submissions table
export const form34aSubmissions = pgTable('form34a_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  serialNumber: text('serial_number').notNull().unique(),
  imageUrl: text('image_url').notNull(),
  imageKey: text('image_key').notNull(), // Storage key for the image
  county: text('county').notNull(),
  constituency: text('constituency').notNull(),
  ward: text('ward').notNull(),
  pollingStation: text('polling_station').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  verified: boolean('verified').default(false).notNull(),
  hasDiscrepancy: boolean('has_discrepancy').default(false).notNull(),
}, (table) => [
  index('form34a_agent_id_idx').on(table.agentId),
  index('form34a_serial_number_idx').on(table.serialNumber),
  index('form34a_county_idx').on(table.county),
  index('form34a_constituency_idx').on(table.constituency),
  index('form34a_ward_idx').on(table.ward),
  index('form34a_polling_station_idx').on(table.pollingStation),
]);

// Candidate results table
export const candidateResults = pgTable('candidate_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  form34aId: uuid('form34a_id').notNull().references(() => form34aSubmissions.id, { onDelete: 'cascade' }),
  candidateFirstName: text('candidate_first_name').notNull(),
  candidateLastName: text('candidate_last_name').notNull(),
  partyName: text('party_name').notNull(),
  votes: integer('votes').notNull(),
  extractedAt: timestamp('extracted_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('candidate_results_form34a_id_idx').on(table.form34aId),
]);

// Relations
export const agentsRelations = relations(agents, ({ many }) => ({
  videos: many(incidentVideos),
  form34aSubmissions: many(form34aSubmissions),
}));

export const incidentVideosRelations = relations(incidentVideos, ({ one }) => ({
  agent: one(agents, {
    fields: [incidentVideos.agentId],
    references: [agents.id],
  }),
}));

export const form34aSubmissionsRelations = relations(form34aSubmissions, ({ one, many }) => ({
  agent: one(agents, {
    fields: [form34aSubmissions.agentId],
    references: [agents.id],
  }),
  candidates: many(candidateResults),
}));

export const candidateResultsRelations = relations(candidateResults, ({ one }) => ({
  form34a: one(form34aSubmissions, {
    fields: [candidateResults.form34aId],
    references: [form34aSubmissions.id],
  }),
}));
