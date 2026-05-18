"use client";

import { track } from "@vercel/analytics";

type AnalyticsEvent =
  | "landing_try_free_clicked"
  | "idea_check_submitted"
  | "results_returned"
  | "repo_details_opened"
  | "starter_repo_selected"
  | "handoff_started"
  | "handoff_zip_downloaded"
  | "handoff_copied"
  | "builder_selected";

type SafeProperties = Record<string, string | number | boolean | null | undefined>;

export function trackForkFirstEvent(name: AnalyticsEvent, properties: SafeProperties = {}) {
  if (process.env.NODE_ENV !== "production") return;
  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>;
  track(name, safeProperties);
}
