"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, ShieldCheck, Sparkles } from "lucide-react";
import "./data-cleanup.css";

type DataKind = "members" | "events" | "sponsors" | "other";
type Row = Record<string, string>;

type Finding = {
  label: string;
  count: number;
  detail: string;
};

const sampleCsv = `First Name,Last Name,Email,Company,Event Date
JANE,DOE,jane@example.com,global gaming women,9/2/26
Jane,Doe,jane@example.com,Global Gaming Women,2026-09-02
sam,lee,sam @example.com,Example Sponsor,September 3 2026
,Avery,avery@example.com,Example Sponsor,09-03-2026`;

function parseCsv(input: string): { headers: string[]; rows: Row[]; error?: string } {
  const text = input.replace(/^\uFEFF/, "").trim();
  if (!text) return { headers: [], rows: [] };

  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) records.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (quoted) return { headers: [], rows: [], error: "A quoted field appears to be incomplete. Check the source CSV and try again." };
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) records.push(row);
  if (records.length < 2) return { headers: [], rows: [], error: "Add a header row and at least one data row." };

  const rawHeaders = records[0].map((value) => value.trim());
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((header, index) => {
    const base = header || `Column ${index + 1}`;
    const count = seen.get(base.toLowerCase()) || 0;
    seen.set(base.toLowerCase(), count + 1);
    return count ? `${base} (${count + 1})` : base;
  });

  const rows = records.slice(1).map((values) => {
    const out: Row = {};
    headers.forEach((header, index) => { out[header] = (values[index] || "").trim(); });
    return out;
  });

  return { headers, rows };
}

function titleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function cleanEmail(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function looksLikeEmailColumn(header: string) {
  return /email/i.test(header);
}

function looksLikeNameColumn(header: string) {
  return /(^|\s)(first|last|full)?\s*name($|\s)|first name|last name/i.test(header);
}

function looksLikeOrganizationColumn(header: string) {
  return /company|organization|organisation|sponsor/i.test(header);
}

function looksLikeDateColumn(header: string) {
  return /date/i.test(header);
}

function normalizeDate(value: string): string {
  if (!value.trim()) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export default function DataCleanupPage() {
  const [kind, setKind] = useState<DataKind>("members");
  const [input, setInput] = useState("");
  const [hasRun, setHasRun] = useState(false);

  const parsed = useMemo(() => parseCsv(input), [input]);

  const cleanedRows = useMemo(() => parsed.rows.map((source) => {
    const cleaned: Row = {};
    parsed.headers.forEach((header) => {
      const value = source[header] ?? "";
      if (looksLikeEmailColumn(header)) cleaned[header] = cleanEmail(value);
      else if (looksLikeNameColumn(header) || looksLikeOrganizationColumn(header)) cleaned[header] = titleCase(value);
      else if (looksLikeDateColumn(header)) cleaned[header] = normalizeDate(value);
      else cleaned[header] = value.trim();
    });
    return cleaned;
  }), [parsed]);

  const diagnostics = useMemo(() => {
    const blankCells = parsed.rows.reduce((total, row) => total + parsed.headers.filter((header) => !row[header]?.trim()).length, 0);
    const emailHeaders = parsed.headers.filter(looksLikeEmailColumn);
    const badEmails = cleanedRows.reduce((total, row) => total + emailHeaders.filter((header) => row[header] && !isValidEmail(row[header])).length, 0);
    const duplicateKeys = new Set<string>();
    let duplicates = 0;
    const primaryEmail = emailHeaders[0];
    if (primaryEmail) {
      cleanedRows.forEach((row) => {
        const key = row[primaryEmail]?.toLowerCase();
        if (!key) return;
        if (duplicateKeys.has(key)) duplicates += 1;
        else duplicateKeys.add(key);
      });
    }
    let formattingChanges = 0;
    parsed.rows.forEach((row, index) => {
      parsed.headers.forEach((header) => {
        if ((row[header] || "") !== (cleanedRows[index]?.[header] || "")) formattingChanges += 1;
      });
    });

    const findings: Finding[] = [
      { label: "Formatting fixes", count: formattingChanges, detail: "Whitespace, capitalization, email spacing/case, and recognizable dates." },
      { label: "Duplicate records", count: duplicates, detail: primaryEmail ? "Potential duplicates based on the first email column." : "No email column found, so duplicates were not auto-detected." },
      { label: "Invalid emails", count: badEmails, detail: "Emails that still need human review after safe spacing/case cleanup." },
      { label: "Blank fields", count: blankCells, detail: "Missing values are flagged, never invented." },
    ];
    return findings;
  }, [parsed, cleanedRows]);

  const issueCount = diagnostics.reduce((sum, finding) => sum + finding.count, 0);
  const estimatedMinutes = Math.max(0, Math.round((diagnostics[0]?.count || 0) * 0.35 + (diagnostics[1]?.count || 0) * 1.5 + (diagnostics[2]?.count || 0) * 1 + (diagnostics[3]?.count || 0) * 0.2));

  function runCheck() {
    setHasRun(true);
  }

  function useSample() {
    setInput(sampleCsv);
    setHasRun(true);
  }

  function downloadCsv() {
    if (!parsed.headers.length || !cleanedRows.length) return;
    const body = [
      parsed.headers.map(escapeCsv).join(","),
      ...cleanedRows.map((row) => parsed.headers.map((header) => escapeCsv(row[header] || "")).join(",")),
    ].join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ggw-cleaned-${kind}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="cleanup-page">
      <section className="cleanup-hero">
        <div className="cleanup-eyebrow"><Sparkles size={16} /> GGW Data Cleanup Workbench</div>
        <h1>Turn a messy spreadsheet into something you can trust.</h1>
        <p>Paste CSV data, find common problems instantly, preview safe formatting fixes, and export a cleaned copy. Your original data is never overwritten.</p>
        <div className="cleanup-trust"><ShieldCheck size={18} /><span>This first-pass cleanup runs in your browser. Missing or ambiguous information is flagged instead of guessed.</span></div>
      </section>

      <section className="cleanup-card cleanup-start">
        <div className="cleanup-step"><span>1</span><div><strong>What are you cleaning?</strong><small>This helps staff orient quickly. It does not change or delete source records.</small></div></div>
        <div className="kind-grid" role="group" aria-label="Data type">
          {([
            ["members", "Membership roster", "Names, emails, companies, membership data"],
            ["events", "Event registrations", "Attendees, dates, registration fields"],
            ["sponsors", "Sponsors / donors", "Organizations, contacts, status fields"],
            ["other", "Other spreadsheet", "Any CSV-style operational list"],
          ] as Array<[DataKind, string, string]>).map(([id, title, description]) => (
            <button key={id} className={kind === id ? "kind-card active" : "kind-card"} onClick={() => setKind(id)}>
              <FileSpreadsheet size={21} /><strong>{title}</strong><span>{description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="cleanup-card">
        <div className="cleanup-step"><span>2</span><div><strong>Paste your CSV data</strong><small>Copy from a CSV file or spreadsheet export, including the header row.</small></div></div>
        <textarea aria-label="CSV data" value={input} onChange={(event) => { setInput(event.target.value); setHasRun(false); }} placeholder="First Name,Last Name,Email,Company..." />
        <div className="cleanup-actions">
          <button className="primary-action" onClick={runCheck} disabled={!input.trim()}><ClipboardPaste size={17} /> Find problems</button>
          <button className="secondary-action" onClick={useSample}>Try a messy sample</button>
        </div>
        {hasRun && parsed.error && <div className="error-box"><AlertTriangle size={18} /><div><strong>We couldn’t read this data yet.</strong><span>{parsed.error} Your pasted data is still here and has not been changed.</span></div></div>}
      </section>

      {hasRun && !parsed.error && parsed.rows.length > 0 && (
        <>
          <section className="cleanup-results">
            <div className="result-banner">
              <CheckCircle2 size={26} />
              <div><strong>{parsed.rows.length.toLocaleString()} records checked</strong><span>{issueCount.toLocaleString()} items found across formatting and review checks.</span></div>
              <div className="time-value"><b>~{estimatedMinutes} min</b><span>estimated manual cleanup avoided</span></div>
            </div>
            <div className="finding-grid">
              {diagnostics.map((finding) => <article key={finding.label} className="finding-card"><b>{finding.count}</b><strong>{finding.label}</strong><span>{finding.detail}</span></article>)}
            </div>
          </section>

          <section className="cleanup-card">
            <div className="cleanup-step"><span>3</span><div><strong>Preview before exporting</strong><small>Safe formatting is applied to the preview only. Duplicates, missing fields, and invalid emails remain visible for review.</small></div></div>
            <div className="table-wrap">
              <table>
                <thead><tr>{parsed.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                <tbody>{cleanedRows.slice(0, 12).map((row, index) => <tr key={index}>{parsed.headers.map((header) => {
                  const original = parsed.rows[index]?.[header] || "";
                  const current = row[header] || "";
                  const invalidEmail = looksLikeEmailColumn(header) && current && !isValidEmail(current);
                  return <td key={header} className={invalidEmail ? "needs-review" : original !== current ? "changed" : ""}>{current || <em>Blank</em>}</td>;
                })}</tr>)}</tbody>
              </table>
            </div>
            {cleanedRows.length > 12 && <p className="preview-note">Showing the first 12 of {cleanedRows.length.toLocaleString()} rows. The export includes every row.</p>}
            <div className="legend"><span><i className="legend-change" /> safe formatting change</span><span><i className="legend-review" /> needs review</span></div>
          </section>

          <section className="cleanup-card cleanup-export">
            <div className="cleanup-step"><span>4</span><div><strong>Export a cleaned copy</strong><small>The original stays untouched so staff can compare, reconcile, and roll back safely.</small></div></div>
            <button className="primary-action" onClick={downloadCsv}><Download size={17} /> Download cleaned CSV</button>
            <p><strong>Before replacing a source list:</strong> review duplicate records, blank required fields, and highlighted invalid emails. For sponsor/donor data, keep access limited to staff who need it.</p>
          </section>
        </>
      )}
    </main>
  );
}
