import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const academyProgress = sqliteTable("academy_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull().unique(),
  progressJson: text("progress_json").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const academyWorkProducts = sqliteTable("academy_work_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  contentJson: text("content_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const academyUsers = sqliteTable("academy_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull().unique(),
  displayName: text("display_name").notNull().default(""),
  consentStatus: text("consent_status").notNull().default("unknown"),
  onboardingJson: text("onboarding_json").notNull().default("{}"),
  firstSeenAt: text("first_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIndex: uniqueIndex("academy_users_email_idx").on(table.userEmail),
}));

export const academyModuleProgress = sqliteTable("academy_module_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull(),
  moduleId: text("module_id").notNull(),
  status: text("status").notNull().default("not_started"),
  currentStep: integer("current_step").notNull().default(0),
  bestScore: integer("best_score").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  labPassed: integer("lab_passed").notNull().default(0),
  artifactSaved: integer("artifact_saved").notNull().default(0),
  commitmentStatus: text("commitment_status").notNull().default("not_started"),
  commitmentDueAt: text("commitment_due_at"),
  completedAt: text("completed_at"),
  lastActivityAt: text("last_activity_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userModuleIndex: uniqueIndex("academy_module_progress_user_module_idx").on(table.userEmail, table.moduleId),
  userActivityIndex: index("academy_module_progress_user_activity_idx").on(table.userEmail, table.lastActivityAt),
}));

export const academyActivityEvents = sqliteTable("academy_activity_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull(),
  eventName: text("event_name").notNull(),
  moduleId: text("module_id"),
  activityId: text("activity_id"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  occurredAt: text("occurred_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userOccurredIndex: index("academy_activity_events_user_occurred_idx").on(table.userEmail, table.occurredAt),
  eventIndex: index("academy_activity_events_event_idx").on(table.eventName),
}));

export const academyAttempts = sqliteTable("academy_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull(),
  moduleId: text("module_id").notNull(),
  activityId: text("activity_id").notNull(),
  attemptType: text("attempt_type").notNull(),
  score: integer("score"),
  result: text("result").notNull().default("submitted"),
  responseJson: text("response_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userModuleIndex: index("academy_attempts_user_module_idx").on(table.userEmail, table.moduleId, table.createdAt),
}));

export const academyOutcomes = sqliteTable("academy_outcomes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull(),
  moduleId: text("module_id").notNull(),
  commitmentText: text("commitment_text").notNull(),
  dueAt: text("due_at"),
  status: text("status").notNull().default("open"),
  baselineMinutes: integer("baseline_minutes"),
  afterMinutes: integer("after_minutes"),
  confidenceBefore: integer("confidence_before"),
  confidenceAfter: integer("confidence_after"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userModuleIndex: uniqueIndex("academy_outcomes_user_module_idx").on(table.userEmail, table.moduleId),
  dueIndex: index("academy_outcomes_due_idx").on(table.status, table.dueAt),
}));
