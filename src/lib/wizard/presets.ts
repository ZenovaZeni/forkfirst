/**
 * Quickstart Presets for the Idea Refinement Wizard.
 * Each preset maps wizard question IDs to sensible default answers.
 */

export type WizardPresetId =
  | "saas"
  | "ai-tool"
  | "chrome-extension"
  | "cli"
  | "mobile"
  | "marketplace"
  | "custom";

export type WizardPreset = {
  id: WizardPresetId;
  label: string;
  blurb: string;
  defaults: Record<string, string>;
};

export const WIZARD_PRESETS: WizardPreset[] = [
  {
    id: "saas",
    label: "SaaS",
    blurb: "Web app with auth, payments, and a database",
    defaults: {
      backend: "Vercel functions + Supabase Postgres",
      auth: "Clerk",
      payments: "Stripe",
      deploy: "Vercel",
      brand: "#2563eb",
      users: "Indie founders"
    }
  },
  {
    id: "ai-tool",
    label: "AI Tool",
    blurb: "Edge-deployed AI with bring-your-own-key support",
    defaults: {
      backend: "Edge functions, BYOK",
      auth: "None or magic link",
      deploy: "Vercel",
      brand: "#dc5b22",
      users: "Developers"
    }
  },
  {
    id: "chrome-extension",
    label: "Chrome Extension",
    blurb: "Browser-only extension, no backend needed",
    defaults: {
      backend: "None (browser-only)",
      auth: "None",
      deploy: "Chrome Web Store",
      brand: "#10b981",
      users: "Power users"
    }
  },
  {
    id: "cli",
    label: "CLI",
    blurb: "Command-line tool distributed via npm or Homebrew",
    defaults: {
      backend: "None",
      auth: "None",
      deploy: "npm / Homebrew",
      brand: "(no brand colors)",
      users: "Developers"
    }
  },
  {
    id: "mobile",
    label: "Mobile",
    blurb: "Cross-platform mobile app via Expo",
    defaults: {
      backend: "Supabase or Firebase",
      auth: "Email + magic link",
      deploy: "Expo + EAS Submit",
      brand: "#0ea5e9",
      users: "Mobile-first audience"
    }
  },
  {
    id: "marketplace",
    label: "Marketplace",
    blurb: "Two-sided marketplace with Stripe Connect",
    defaults: {
      backend: "Postgres + Vercel functions",
      auth: "Clerk + roles",
      payments: "Stripe Connect",
      deploy: "Vercel",
      brand: "#a855f7",
      users: "Two-sided market"
    }
  },
  {
    id: "custom",
    label: "Custom",
    blurb: "No pre-fills — answer everything yourself",
    defaults: {}
  }
];

/**
 * Apply a preset's defaults to the current answers map.
 * Only fills keys that exist in the preset; keys not present in the preset are untouched.
 * Returns a new answers object (does not mutate the original).
 */
export function applyPreset(
  preset: WizardPreset,
  questionIds: string[]
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const id of questionIds) {
    if (id in preset.defaults) {
      next[id] = preset.defaults[id];
    }
  }
  return next;
}
