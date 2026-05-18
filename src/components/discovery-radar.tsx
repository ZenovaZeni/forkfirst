import type { ClassifiedRepo } from "@/lib/analysis/types";

type DiscoveryRadarProps = {
  prompt: string;
  repos: ClassifiedRepo[];
};

type StackNode = {
  label: string;
  detail: string;
  kind: "frontend" | "backend" | "data" | "ai" | "integration" | "deploy";
};

function inferStack(prompt: string, repos: ClassifiedRepo[]): StackNode[] {
  const text = `${prompt} ${repos.map((repo) => `${repo.language ?? ""} ${repo.topics.join(" ")}`).join(" ")}`.toLowerCase();
  const stack: StackNode[] = [
    { label: "Frontend", detail: text.includes("next") ? "Next.js UI" : "Chat-style web UI", kind: "frontend" },
    { label: "GitHub Layer", detail: "Search + repo metadata", kind: "integration" },
    { label: "AI Analyst", detail: "Verdicts + gap summary", kind: "ai" },
    { label: "Persistence", detail: text.includes("supabase") ? "Supabase/Postgres" : "SQLite first", kind: "data" },
    { label: "Deploy", detail: text.includes("vercel") ? "Vercel" : "Vercel-ready", kind: "deploy" }
  ];

  if (text.includes("auth") || text.includes("login")) {
    stack.splice(3, 0, { label: "Auth", detail: "GitHub sign-in later", kind: "backend" });
  }

  if (text.includes("search") || text.includes("semantic") || text.includes("rag")) {
    stack.splice(3, 0, { label: "Indexing", detail: "Search/rerank pipeline", kind: "data" });
  }

  return stack.slice(0, 6);
}

function compactName(name: string): string {
  return name.length > 18 ? `${name.slice(0, 16)}...` : name;
}

export function DiscoveryRadar({ prompt, repos }: DiscoveryRadarProps) {
  const topRepo = repos[0];
  const alternatives = repos.slice(1, 4);
  const stackNodes = inferStack(prompt, repos).slice(0, 6);

  return (
    <div className="research-map">
      <div className="map-header">
        <p className="eyebrow">Research Map</p>
        <h3>What this means</h3>
      </div>

      <section className="map-section primary-path">
        <span>Best current lead</span>
        <strong>{topRepo ? topRepo.fullName : "No clear lead yet"}</strong>
        <p>
          {topRepo
            ? `${topRepo.category.replace("_", " ")} candidate with ${topRepo.score.total}% match. ${topRepo.summary}.`
            : "Try a more specific idea or add provider keys for stronger research."}
        </p>
      </section>

      <section className="map-section">
        <span>Why compare more</span>
        <div className="map-list">
          {alternatives.length > 0 ? (
            alternatives.map((repo) => (
              <div key={repo.fullName}>
                <strong>{compactName(repo.name)}</strong>
                <small>
                  {repo.category.replace("_", " ")} - {repo.score.total}% match
                </small>
              </div>
            ))
          ) : (
            <p>No alternatives found yet.</p>
          )}
        </div>
      </section>

      <section className="map-section">
        <span>Stack needed to build it</span>
        <div className="stack-list">
          {stackNodes.map((node) => (
            <div key={`${node.label}:${node.detail}`} className={node.kind}>
              <strong>{node.label}</strong>
              <small>{node.detail}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
