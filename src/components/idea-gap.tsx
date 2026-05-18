import { buildIdeaGapInsight } from "@/lib/analysis/builder-insights";
import type { ClassifiedRepo } from "@/lib/analysis/types";

type IdeaGapProps = {
  prompt: string;
  repos: ClassifiedRepo[];
  analystGaps: string[];
};

export function IdeaGap({ prompt, repos, analystGaps }: IdeaGapProps) {
  const insight = buildIdeaGapInsight(prompt, repos);
  const points = [...insight.points, ...analystGaps].slice(0, 6);

  return (
    <section className="idea-gap-panel">
      <div>
        <p className="eyebrow">Builder gap</p>
        <h3>{insight.title}</h3>
        <p>{insight.summary}</p>
      </div>
      <ul>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}
