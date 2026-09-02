export type ToolId =
  | "WildApricot"
  | "Gmail"
  | "Google Sheets"
  | "Google Docs"
  | "Google Drive"
  | "Google Calendar"
  | "Google Meet"
  | "Google Slides"
  | "Google Forms"
  | "Google Sites"
  | "Google Keep"
  | "Gemini"
  | "NotebookLM"
  | "Apps Script"
  | "Canva"
  | "Zapier"
  | "Make";

export type ToolLink = {
  label: string;
  url: string;
  learnUrl?: string;
  actionLabel: string;
};

export const toolRegistry: Record<ToolId, ToolLink> = {
  WildApricot: {
    label: "WildApricot",
    url: "https://www.wildapricot.com/",
    learnUrl: "https://gethelp.wildapricot.com/",
    actionLabel: "WildApricot",
  },
  Gmail: {
    label: "Gmail",
    url: "https://mail.google.com/",
    learnUrl: "https://workspace.google.com/products/gmail/ai/",
    actionLabel: "Open Gmail",
  },
  "Google Sheets": {
    label: "Google Sheets",
    url: "https://sheets.google.com/",
    learnUrl: "https://workspace.google.com/resources/spreadsheet-ai/",
    actionLabel: "Open Sheets",
  },
  "Google Docs": {
    label: "Google Docs",
    url: "https://docs.google.com/",
    learnUrl: "https://workspace.google.com/products/docs/ai/",
    actionLabel: "Open Docs",
  },
  "Google Drive": {
    label: "Google Drive",
    url: "https://drive.google.com/",
    learnUrl: "https://workspace.google.com/products/drive/",
    actionLabel: "Open Drive",
  },
  "Google Calendar": {
    label: "Google Calendar",
    url: "https://calendar.google.com/",
    learnUrl: "https://workspace.google.com/products/calendar/",
    actionLabel: "Open Calendar",
  },
  "Google Meet": {
    label: "Google Meet",
    url: "https://meet.google.com/",
    learnUrl: "https://workspace.google.com/resources/ai-for-meetings/",
    actionLabel: "Open Meet",
  },
  "Google Slides": {
    label: "Google Slides",
    url: "https://slides.google.com/",
    learnUrl: "https://workspace.google.com/products/slides/",
    actionLabel: "Open Slides",
  },
  "Google Forms": {
    label: "Google Forms",
    url: "https://forms.google.com/",
    learnUrl: "https://workspace.google.com/products/forms/",
    actionLabel: "Open Forms",
  },
  "Google Sites": {
    label: "Google Sites",
    url: "https://sites.google.com/",
    learnUrl: "https://workspace.google.com/products/sites/",
    actionLabel: "Open Sites",
  },
  "Google Keep": {
    label: "Google Keep",
    url: "https://keep.google.com/",
    learnUrl: "https://workspace.google.com/products/keep/",
    actionLabel: "Open Keep",
  },
  Gemini: {
    label: "Gemini",
    url: "https://gemini.google.com/",
    learnUrl: "https://workspace.google.com/solutions/ai/",
    actionLabel: "Open Gemini",
  },
  NotebookLM: {
    label: "NotebookLM",
    url: "https://notebooklm.google.com/",
    learnUrl: "https://support.google.com/notebooklm/answer/16164461",
    actionLabel: "Open NotebookLM",
  },
  "Apps Script": {
    label: "Apps Script",
    url: "https://script.google.com/",
    learnUrl: "https://developers.google.com/apps-script",
    actionLabel: "Open Apps Script",
  },
  Canva: {
    label: "Canva",
    url: "https://www.canva.com/",
    learnUrl: "https://www.canva.com/help/",
    actionLabel: "Open Canva",
  },
  Zapier: {
    label: "Zapier",
    url: "https://zapier.com/app/zaps",
    learnUrl: "https://zapier.com/help",
    actionLabel: "Open Zapier",
  },
  Make: {
    label: "Make",
    url: "https://www.make.com/en",
    learnUrl: "https://www.make.com/en/help/home",
    actionLabel: "Open Make",
  },
};

export function isToolId(value: string): value is ToolId {
  return Object.prototype.hasOwnProperty.call(toolRegistry, value);
}
