"use client";

import { useState } from "react";
import { Cloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GooglePickerData = {
  action?: string;
  docs?: Array<{
    id?: string;
    name?: string;
    mimeType?: string;
  }>;
};

type GooglePickerView = {
  setIncludeFolders: (value: boolean) => GooglePickerView;
  setSelectFolderEnabled: (value: boolean) => GooglePickerView;
  setMimeTypes: (value: string) => GooglePickerView;
};

type GooglePicker = {
  setVisible: (value: boolean) => void;
};

type GooglePickerBuilder = {
  addView: (view: GooglePickerView) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  setCallback: (callback: (data: GooglePickerData) => void | Promise<void>) => GooglePickerBuilder;
  build: () => GooglePicker;
};

type GoogleApi = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (tokenResponse: GoogleTokenResponse) => void | Promise<void>;
      }) => {
        requestAccessToken: (options: { prompt: string }) => void;
      };
    };
  };
  picker: {
    DocsView: new () => GooglePickerView;
    PickerBuilder: new () => GooglePickerBuilder;
    Action: {
      CANCEL: string;
      PICKED: string;
    };
  };
};

type GapiApi = {
  load: (name: string, callback: () => void) => void;
};

declare global {
  interface Window {
    google?: GoogleApi;
    gapi?: GapiApi;
  }
}

type Props = {
  onCsv: (text: string, fileName: string) => void;
  disabled?: boolean;
  label?: string;
};

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID || "";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${id}.`));
    document.head.appendChild(script);
  });
}

export default function GoogleDriveCsvPicker({ onCsv, disabled, label = "Choose from Google Drive" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openPicker() {
    setError("");
    if (!CLIENT_ID || !API_KEY) {
      setError("Google Drive selection needs the site administrator to configure the Google OAuth client and API key.");
      return;
    }

    setBusy(true);
    try {
      await Promise.all([
        loadScript("https://accounts.google.com/gsi/client", "google-identity-services"),
        loadScript("https://apis.google.com/js/api.js", "google-api-loader"),
      ]);

      const google = window.google;
      const gapi = window.gapi;
      if (!google?.accounts?.oauth2 || !gapi) throw new Error("Google Drive could not initialize.");

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: async (tokenResponse: GoogleTokenResponse) => {
          if (!tokenResponse.access_token) {
            setBusy(false);
            setError(tokenResponse.error || "Google Drive authorization was not completed.");
            return;
          }

          gapi.load("picker", () => {
            const view = new google.picker.DocsView()
              .setIncludeFolders(false)
              .setSelectFolderEnabled(false)
              .setMimeTypes("text/csv,application/vnd.google-apps.spreadsheet");

            const picker = new google.picker.PickerBuilder()
              .addView(view)
              .setOAuthToken(tokenResponse.access_token)
              .setDeveloperKey(API_KEY)
              .setTitle("Choose a GGW CSV or Google Sheet")
              .setCallback(async (data: GooglePickerData) => {
                if (data.action === google.picker.Action.CANCEL) {
                  setBusy(false);
                  return;
                }
                if (data.action !== google.picker.Action.PICKED) return;

                const doc = data.docs?.[0];
                if (!doc?.id) {
                  setBusy(false);
                  setError("No file was selected.");
                  return;
                }

                try {
                  const isSheet = doc.mimeType === "application/vnd.google-apps.spreadsheet";
                  const endpoint = isSheet
                    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}/export?mimeType=text%2Fcsv`
                    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}?alt=media`;
                  const response = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  if (!response.ok) throw new Error("Google Drive could not read the selected file.");
                  onCsv(await response.text(), doc.name || "google-drive.csv");
                  setBusy(false);
                } catch (e) {
                  setBusy(false);
                  setError(e instanceof Error ? e.message : "Could not import the selected file.");
                }
              })
              .build();

            picker.setVisible(true);
          });
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Google Drive could not open.");
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="outline" disabled={disabled || busy} onClick={openPicker}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cloud className="mr-2 h-4 w-4" />}
        {busy ? "Opening Google Drive..." : label}
      </Button>
      {error && <p className="max-w-xl text-xs text-amber-800">{error}</p>}
    </div>
  );
}
