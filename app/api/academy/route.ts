import { env } from "cloudflare:workers";
import { getD1 } from "../../../db/runtime";

type Progress = {
  view?: string;
  activeTool?: string;
  activeModule?: string | null;
  activeSandbox?: string | null;
  step?: number;
  completed?: string[];
  quizAnswer?: string;
  quizSubmitted?: boolean;
  checkedGovernance?: boolean[];
  selectedSourceIds?: string[];
  sourceTask?: string;
};

type WorkProduct = {
  kind?: string;
  title?: string;
  content?: unknown;
};

type ModuleProgressInput = {
  moduleId?: string;
  status?: string;
  currentStep?: number;
  bestScore?: number;
  attempts?: number;
  labPassed?: number | boolean;
  artifactSaved?: number | boolean;
  commitmentStatus?: string;
  commitmentDueAt?: string | null;
  completedAt?: string | null;
};

type AttemptInput = {
  moduleId?: string;
  activityId?: string;
  attemptType?: string;
  score?: number | null;
  result?: string;
  response?: unknown;
};

type OutcomeInput = {
  moduleId?: string;
  commitmentText?: string;
  dueAt?: string | null;
  status?: string;
  baselineMinutes?: number | null;
  afterMinutes?: number | null;
  confidenceBefore?: number | null;
  confidenceAfter?: number | null;
  notes?: string;
};

type ActivityInput = {
  eventName?: string;
  moduleId?: string;
  activityId?: string;
  metadata?: unknown;
};

type AcademyPayload = {
  progress?: Progress;
  workProduct?: WorkProduct;
  moduleProgress?: ModuleProgressInput;
  activity?: ActivityInput;
  attempt?: AttemptInput;
  outcome?: OutcomeInput;
  onboarding?: unknown;
};

type Identity = {
  email: string;
  displayName: string;
};

const MAX_TOKEN_LENGTH = 120;
const MODULE_IDS = new Set(["daily", "data", "visuals", "automation", "agents", "governance"]);

function getBindingValue(name: string): string {
  const bindings = env as unknown as Record<string, unknown>;
  return typeof bindings[name] === "string" ? bindings[name].trim() : "";
}

function decodeHeader(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function getIdentity(request: Request): Identity | null {
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (!email) return null;
  const displayName = decodeHeader(
    request.headers.get("oai-authenticated-user-name") ||
    request.headers.get("oai-authenticated-user-full-name")
  ) || email;
  return { email, displayName: displayName.slice(0, 160) };
}

function getAdminEmails(): Set<string> {
  return new Set(
    getBindingValue("GGW_ADMIN_EMAILS")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function cleanToken(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_TOKEN_LENGTH) : fallback;
}

function cleanModuleId(value: unknown): string {
  const moduleId = cleanToken(value);
  return MODULE_IDS.has(moduleId) ? moduleId : "";
}

function clampInteger(value: unknown, minimum: number, maximum: number): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(minimum, Math.min(maximum, Math.round(parsed)));
}

function safeJson(value: unknown, fallback: unknown): unknown {
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function compactMetadata(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
    const normalizedKey = key.toLowerCase();
    if (/(prompt|source|content|notes|message|body|raw|email)/.test(normalizedKey)) continue;
    if (rawValue === null || typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      output[key.slice(0, 60)] = typeof rawValue === "string" ? rawValue.slice(0, 240) : rawValue;
    }
  }
  return output;
}

function compactResponse(value: unknown): string {
  return JSON.stringify(compactMetadata(value)).slice(0, 4_000);
}

function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected backend error.";
  const status = message.includes("D1 binding") || message.includes("D1 binding DB") ? 503 : 500;
  return Response.json({ error: message, backend: "unavailable" }, { status });
}

async function ensureUser(db: D1Database, identity: Identity, timestamp: string, onboarding?: unknown) {
  await db.prepare(
    `INSERT INTO academy_users (user_email, display_name, last_seen_at, updated_at)
     VALUES (?1, ?2, ?3, ?3)
     ON CONFLICT(user_email) DO UPDATE SET
       display_name = CASE WHEN excluded.display_name <> '' THEN excluded.display_name ELSE academy_users.display_name END,
       last_seen_at = excluded.last_seen_at,
       updated_at = excluded.updated_at`
  ).bind(identity.email, identity.displayName, timestamp).run();

  if (onboarding !== undefined) {
    await db.prepare("UPDATE academy_users SET onboarding_json = ?1, updated_at = ?2 WHERE user_email = ?3")
      .bind(JSON.stringify(onboarding).slice(0, 10_000), timestamp, identity.email)
      .run();
  }
}

async function readAdminOverview(db: D1Database, timestamp: string) {
  const sevenDaysAgo = new Date(Date.parse(timestamp) - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.parse(timestamp) - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [summary, modules, events, outcomes] = await Promise.all([
    db.prepare(
      `SELECT
         COUNT(*) AS total_users,
         SUM(CASE WHEN last_seen_at >= ?1 THEN 1 ELSE 0 END) AS active_users_7d,
         (SELECT COUNT(*) FROM academy_module_progress WHERE status = 'completed') AS completed_modules,
         (SELECT COUNT(*) FROM academy_module_progress WHERE lab_passed = 1) AS passed_labs,
         (SELECT AVG(score) FROM academy_attempts WHERE score IS NOT NULL) AS average_attempt_score
       FROM academy_users`
    ).bind(sevenDaysAgo).first<Record<string, number | null>>(),
    db.prepare(
      `SELECT module_id, COUNT(*) AS enrolled,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
         ROUND(AVG(best_score), 1) AS average_score,
         SUM(attempts) AS attempts,
         SUM(CASE WHEN lab_passed = 1 THEN 1 ELSE 0 END) AS labs_passed
       FROM academy_module_progress
       GROUP BY module_id
       ORDER BY module_id`
    ).all<Record<string, string | number | null>>(),
    db.prepare(
      `SELECT event_name, COUNT(*) AS count
       FROM academy_activity_events
       WHERE occurred_at >= ?1
       GROUP BY event_name
       ORDER BY count DESC
       LIMIT 12`
    ).bind(thirtyDaysAgo).all<Record<string, string | number>>(),
    db.prepare(
      `SELECT status, COUNT(*) AS count
       FROM academy_outcomes
       GROUP BY status
       ORDER BY count DESC`
    ).all<Record<string, string | number>>(),
  ]);

  return {
    summary: summary ?? {},
    modules: modules.results ?? [],
    recentEvents: events.results ?? [],
    outcomes: outcomes.results ?? [],
    window: { activeUsers: "7d", events: "30d" },
  };
}

export async function GET(request: Request) {
  try {
    const identity = getIdentity(request);
    if (!identity) {
      return Response.json({
        backend: "not_authenticated",
        authenticated: false,
        tracking: { enabled: false, reason: "Workspace identity was not provided." },
        progress: {},
        workProducts: [],
        moduleProgress: [],
        recentAttempts: [],
        outcomes: [],
      });
    }

    const db = getD1();
    const timestamp = new Date().toISOString();
    await ensureUser(db, identity, timestamp);
    const adminEmails = getAdminEmails();
    const isAdmin = adminEmails.has(identity.email);
    const url = new URL(request.url);

    if (url.searchParams.get("mode") === "admin") {
      if (!isAdmin) {
        return Response.json({ error: "Leadership access is restricted to the configured GGW admin list.", adminConfigured: adminEmails.size > 0 }, { status: 403 });
      }
      return Response.json({
        backend: "connected",
        authenticated: true,
        tracking: { enabled: true, privacy: "activity metadata only; no raw source documents" },
        adminConfigured: true,
        isAdmin: true,
        admin: await readAdminOverview(db, timestamp),
      });
    }

    const progressRow = await db.prepare("SELECT progress_json, updated_at FROM academy_progress WHERE user_email = ?1")
      .bind(identity.email)
      .first<{ progress_json: string; updated_at: string }>();
    const workRows = await db.prepare(
      "SELECT MAX(id) AS id, kind, title, MAX(created_at) AS created_at FROM academy_work_products WHERE user_email = ?1 GROUP BY kind, title ORDER BY id DESC LIMIT 25"
    ).bind(identity.email).all<{ id: number; kind: string; title: string; created_at: string }>();
    const moduleRows = await db.prepare(
      `SELECT module_id, status, current_step, best_score, attempts, lab_passed, artifact_saved,
         commitment_status, commitment_due_at, completed_at, last_activity_at
       FROM academy_module_progress
       WHERE user_email = ?1
       ORDER BY last_activity_at DESC`
    ).bind(identity.email).all<Record<string, string | number | null>>();
    const attemptRows = await db.prepare(
      `SELECT module_id, activity_id, attempt_type, score, result, created_at
       FROM academy_attempts
       WHERE user_email = ?1
       ORDER BY id DESC
       LIMIT 20`
    ).bind(identity.email).all<Record<string, string | number | null>>();
    const outcomeRows = await db.prepare(
      `SELECT module_id, commitment_text, due_at, status, baseline_minutes, after_minutes,
         confidence_before, confidence_after, notes, updated_at
       FROM academy_outcomes
       WHERE user_email = ?1
       ORDER BY updated_at DESC`
    ).bind(identity.email).all<Record<string, string | number | null>>();
    const userRow = await db.prepare(
      "SELECT user_email, display_name, first_seen_at, last_seen_at FROM academy_users WHERE user_email = ?1"
    ).bind(identity.email).first<Record<string, string>>();

    return Response.json({
      backend: "connected",
      authenticated: true,
      tracking: { enabled: true, privacy: "activity metadata only; no raw source documents" },
      adminConfigured: adminEmails.size > 0,
      isAdmin,
      user: userRow ?? { user_email: identity.email, display_name: identity.displayName },
      progress: progressRow ? safeJson(progressRow.progress_json, {}) : {},
      updatedAt: progressRow?.updated_at ?? null,
      workProducts: workRows.results ?? [],
      moduleProgress: moduleRows.results ?? [],
      recentAttempts: attemptRows.results ?? [],
      outcomes: outcomeRows.results ?? [],
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = getIdentity(request);
    if (!identity) {
      return Response.json({ backend: "not_authenticated", saved: false, tracking: { enabled: false } }, { status: 401 });
    }

    let payload: AcademyPayload;
    try {
      payload = await request.json() as AcademyPayload;
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const db = getD1();
    const timestamp = new Date().toISOString();
    await ensureUser(db, identity, timestamp, payload.onboarding);

    if (payload.progress) {
      const progressJson = JSON.stringify(payload.progress).slice(0, 100_000);
      await db.prepare(
        `INSERT INTO academy_progress (user_email, progress_json, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(user_email) DO UPDATE SET progress_json = excluded.progress_json, updated_at = excluded.updated_at`
      ).bind(identity.email, progressJson, timestamp).run();
    }

    const moduleInput = payload.moduleProgress;
    const eventModuleId = cleanModuleId(payload.activity?.moduleId);
    const moduleId = cleanModuleId(moduleInput?.moduleId) || eventModuleId;
    if (moduleInput && moduleId) {
      const status = cleanToken(moduleInput.status, "in_progress");
      const currentStep = clampInteger(moduleInput.currentStep, 0, 5) ?? 0;
      const bestScore = clampInteger(moduleInput.bestScore, 0, 100) ?? 0;
      const attempts = clampInteger(moduleInput.attempts, 0, 999) ?? 0;
      const labPassed = moduleInput.labPassed ? 1 : 0;
      const artifactSaved = moduleInput.artifactSaved ? 1 : 0;
      const commitmentStatus = cleanToken(moduleInput.commitmentStatus, "not_started");
      const completedAt = moduleInput.completedAt ? cleanToken(moduleInput.completedAt, timestamp) : null;
      const dueAt = moduleInput.commitmentDueAt ? cleanToken(moduleInput.commitmentDueAt) : null;
      await db.prepare(
        `INSERT INTO academy_module_progress
          (user_email, module_id, status, current_step, best_score, attempts, lab_passed, artifact_saved,
           commitment_status, commitment_due_at, completed_at, last_activity_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?12)
         ON CONFLICT(user_email, module_id) DO UPDATE SET
           status = excluded.status,
           current_step = excluded.current_step,
           best_score = MAX(academy_module_progress.best_score, excluded.best_score),
           attempts = MAX(academy_module_progress.attempts, excluded.attempts),
           lab_passed = MAX(academy_module_progress.lab_passed, excluded.lab_passed),
           artifact_saved = MAX(academy_module_progress.artifact_saved, excluded.artifact_saved),
           commitment_status = excluded.commitment_status,
           commitment_due_at = COALESCE(excluded.commitment_due_at, academy_module_progress.commitment_due_at),
           completed_at = COALESCE(excluded.completed_at, academy_module_progress.completed_at),
           last_activity_at = excluded.last_activity_at,
           updated_at = excluded.updated_at`
      ).bind(identity.email, moduleId, status, currentStep, bestScore, attempts, labPassed, artifactSaved, commitmentStatus, dueAt, completedAt, timestamp).run();
    } else if (eventModuleId) {
      await db.prepare(
        `INSERT INTO academy_module_progress (user_email, module_id, status, current_step, last_activity_at, updated_at)
         VALUES (?1, ?2, 'in_progress', 1, ?3, ?3)
         ON CONFLICT(user_email, module_id) DO UPDATE SET last_activity_at = excluded.last_activity_at, updated_at = excluded.updated_at`
      ).bind(identity.email, eventModuleId, timestamp).run();
    }

    const activity = payload.activity;
    const eventName = cleanToken(activity?.eventName);
    if (eventName) {
      const metadata = JSON.stringify(compactMetadata(activity?.metadata)).slice(0, 4_000);
      await db.prepare(
        `INSERT INTO academy_activity_events (user_email, event_name, module_id, activity_id, metadata_json, occurred_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      ).bind(identity.email, eventName, eventModuleId || null, cleanToken(activity?.activityId) || null, metadata, timestamp).run();
    }

    const attempt = payload.attempt;
    const attemptModuleId = cleanModuleId(attempt?.moduleId) || eventModuleId;
    if (attempt && attemptModuleId) {
      const score = clampInteger(attempt.score, 0, 100);
      const responseJson = compactResponse(attempt.response);
      await db.prepare(
        `INSERT INTO academy_attempts (user_email, module_id, activity_id, attempt_type, score, result, response_json, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      ).bind(
        identity.email,
        attemptModuleId,
        cleanToken(attempt.activityId, "activity"),
        cleanToken(attempt.attemptType, "practice"),
        score,
        cleanToken(attempt.result, "submitted"),
        responseJson,
        timestamp
      ).run();
    }

    const outcome = payload.outcome;
    const outcomeModuleId = cleanModuleId(outcome?.moduleId) || moduleId;
    if (outcome && outcomeModuleId) {
      await db.prepare(
        `INSERT INTO academy_outcomes
          (user_email, module_id, commitment_text, due_at, status, baseline_minutes, after_minutes,
           confidence_before, confidence_after, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)
         ON CONFLICT(user_email, module_id) DO UPDATE SET
           commitment_text = excluded.commitment_text,
           due_at = COALESCE(excluded.due_at, academy_outcomes.due_at),
           status = excluded.status,
           baseline_minutes = COALESCE(excluded.baseline_minutes, academy_outcomes.baseline_minutes),
           after_minutes = COALESCE(excluded.after_minutes, academy_outcomes.after_minutes),
           confidence_before = COALESCE(excluded.confidence_before, academy_outcomes.confidence_before),
           confidence_after = COALESCE(excluded.confidence_after, academy_outcomes.confidence_after),
           notes = CASE WHEN excluded.notes <> '' THEN excluded.notes ELSE academy_outcomes.notes END,
           updated_at = excluded.updated_at`
      ).bind(
        identity.email,
        outcomeModuleId,
        cleanToken(outcome.commitmentText, "Practice one GGW workflow within 24 hours."),
        outcome.dueAt ? cleanToken(outcome.dueAt) : null,
        cleanToken(outcome.status, "open"),
        clampInteger(outcome.baselineMinutes, 0, 100_000),
        clampInteger(outcome.afterMinutes, 0, 100_000),
        clampInteger(outcome.confidenceBefore, 1, 5),
        clampInteger(outcome.confidenceAfter, 1, 5),
        cleanToken(outcome.notes),
        timestamp
      ).run();
    }

    const workProduct = payload.workProduct;
    if (workProduct?.kind && workProduct.title) {
      const kind = cleanToken(workProduct.kind);
      const title = cleanToken(workProduct.title);
      const content = JSON.stringify(workProduct.content ?? {}).slice(0, 50_000);
      const existing = await db.prepare(
        "SELECT id FROM academy_work_products WHERE user_email = ?1 AND kind = ?2 AND title = ?3 ORDER BY id DESC LIMIT 1"
      ).bind(identity.email, kind, title).first<{ id: number }>();
      if (existing?.id) {
        await db.prepare("UPDATE academy_work_products SET content_json = ?1, created_at = ?2 WHERE id = ?3")
          .bind(content, timestamp, existing.id).run();
      } else {
        await db.prepare(
          "INSERT INTO academy_work_products (user_email, kind, title, content_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
        ).bind(identity.email, kind, title, content, timestamp).run();
      }
    }

    const countRow = await db.prepare(
      "SELECT COUNT(DISTINCT kind || ':' || title) AS count FROM academy_work_products WHERE user_email = ?1"
    ).bind(identity.email).first<{ count: number }>();
    return Response.json({
      backend: "connected",
      authenticated: true,
      saved: true,
      tracking: { enabled: true },
      workProductCount: countRow?.count ?? 0,
      savedAt: timestamp,
    });
  } catch (error) {
    return jsonError(error);
  }
}
