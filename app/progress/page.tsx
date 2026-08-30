"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CircleHelp } from "lucide-react";
import Link from "next/link";
import { DashboardView, SiteHeader, type AttemptRow, type ModuleId, type ModuleProgressRow, type OutcomeRow } from "../page";

type WorkProductRow = { kind?: string; title?: string; created_at?: string };

type ProgressPayload = {
  authenticated?: boolean;
  tracking?: { enabled?: boolean };
  user?: { user_email?: string; display_name?: string };
  progress?: { completed?: string[] };
  moduleProgress?: ModuleProgressRow[];
  recentAttempts?: AttemptRow[];
  outcomes?: OutcomeRow[];
  workProducts?: WorkProductRow[];
};

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgressRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([]);
  const [workProducts, setWorkProducts] = useState<WorkProductRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/academy").then(async (response) => {
      const payload = await response.json() as ProgressPayload;
      if (cancelled) return;
      setTrackingEnabled(Boolean(payload.authenticated && payload.tracking?.enabled));
      setUserName(payload.user?.display_name || "");
      setUserEmail(payload.user?.user_email || "");
      setCompleted(Array.isArray(payload.progress?.completed) ? payload.progress.completed : []);
      setModuleProgress(Array.isArray(payload.moduleProgress) ? payload.moduleProgress : []);
      setAttempts(Array.isArray(payload.recentAttempts) ? payload.recentAttempts : []);
      setOutcomes(Array.isArray(payload.outcomes) ? payload.outcomes : []);
      setWorkProducts(Array.isArray(payload.workProducts) ? payload.workProducts : []);
      if (payload.authenticated && payload.tracking?.enabled) {
        void fetch("/api/academy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activity: { eventName: "dashboard_opened", activityId: "progress-page", metadata: { page: "progress" } } }),
        }).catch(() => undefined);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setTrackingEnabled(false);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const openModule = (moduleId: ModuleId) => {
    window.location.href = "/?module=" + encodeURIComponent(moduleId);
  };

  const saveOutcome = (moduleId: ModuleId, data: { afterMinutes: number | null; confidenceAfter: number | null; notes: string }) => {
    const current = outcomes.find((outcome) => outcome.module_id === moduleId);
    const row = moduleProgress.find((item) => item.module_id === moduleId);
    const now = new Date().toISOString();
    setOutcomes((existing) => [{ module_id: moduleId, commitment_text: current?.commitment_text, due_at: current?.due_at, status: "completed", baseline_minutes: current?.baseline_minutes, after_minutes: data.afterMinutes, confidence_before: current?.confidence_before, confidence_after: data.confidenceAfter, notes: data.notes, updated_at: now }, ...existing.filter((outcome) => outcome.module_id !== moduleId)]);
    setModuleProgress((existing) => [{ ...row, module_id: moduleId, status: row?.status || "in_progress", current_step: 3, best_score: row?.best_score || 0, attempts: row?.attempts || 0, lab_passed: row?.lab_passed || 0, artifact_saved: row?.artifact_saved || 0, commitment_status: "completed", commitment_due_at: row?.commitment_due_at || current?.due_at || null, last_activity_at: now }, ...existing.filter((item) => item.module_id !== moduleId)]);
    if (!trackingEnabled) return;
    void fetch("/api/academy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity: { eventName: "commitment_completed", moduleId, activityId: "outcome-checkin", metadata: { page: "progress", hasAfterMinutes: Boolean(data.afterMinutes), hasConfidenceAfter: Boolean(data.confidenceAfter) } },
        outcome: { moduleId, commitmentText: current?.commitment_text, dueAt: current?.due_at || null, status: "completed", afterMinutes: data.afterMinutes, confidenceAfter: data.confidenceAfter, notes: data.notes },
        moduleProgress: { moduleId, status: row?.status || "in_progress", currentStep: 3, bestScore: Number(row?.best_score || 0), attempts: Number(row?.attempts || 0), labPassed: Boolean(Number(row?.lab_passed)), artifactSaved: Boolean(Number(row?.artifact_saved)), commitmentStatus: "completed", commitmentDueAt: row?.commitment_due_at || current?.due_at || null, completedAt: row?.completed_at || null },
      }),
    }).catch(() => undefined);
  };

  return <div className="academy-app"><SiteHeader view="dashboard" onHome={() => { window.location.href = "/"; }} onPrompts={() => { window.location.href = "/prompts"; }} onSandbox={() => { window.location.href = "/?view=sandbox"; }} onDashboard={() => window.scrollTo({ top: 0, behavior: "smooth" })} />{loading ? <main className="page-shell dashboard-page"><section className="simple-hero dashboard-hero"><p className="eyebrow">Your learning record</p><h1>Loading your progress…</h1><p>Connecting to your saved learning record.</p></section></main> : <DashboardView userName={userName} userEmail={userEmail} trackingEnabled={trackingEnabled} completed={completed} moduleProgress={moduleProgress} attempts={attempts} outcomes={outcomes} workProducts={workProducts} isAdmin={false} onOpenModule={openModule} onOpenAdmin={() => undefined} onSaveOutcome={saveOutcome} />}{!loading && !trackingEnabled && <div className="progress-route-note"><CircleHelp size={15} /><span>You can still practice here. To create a durable record, open the private site through an approved authenticated account.</span><Link href="/">Return home <ArrowRight size={14} /></Link></div>}</div>;
}
