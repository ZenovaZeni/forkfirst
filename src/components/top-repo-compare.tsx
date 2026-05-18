import { ExternalLink } from "lucide-react";
import { buildPlainDecision } from "@/lib/analysis/builder-insights";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { buildCompareRow } from "@/lib/compare/repo-compare";

type TopRepoCompareProps = {
  repos: ClassifiedRepo[];
};

export function TopRepoCompare({ repos }: TopRepoCompareProps) {
  const rows = repos.slice(0, 3).map((repo) => ({ repo, row: buildCompareRow(repo) }));
  if (rows.length === 0) return null;

  return (
    <section className="compare-panel">
      <div className="section-heading">
        <p className="eyebrow">Decision table</p>
        <h3>Compare the top 3</h3>
      </div>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Repo</th>
              <th>Type</th>
              <th>Decision</th>
              <th>Match</th>
              <th>Docs</th>
              <th>Setup</th>
              <th>License</th>
              <th>Best for</th>
              <th>Watch out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ repo, row }) => (
              <tr key={row.name}>
                <td>
                  <a href={row.url} target="_blank" rel="noreferrer">
                    {row.name}
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td>{row.type}</td>
                <td>
                  <span className="decision-pill">{buildPlainDecision(repo)}</span>
                </td>
                <td>{row.match}</td>
                <td>{row.docs}</td>
                <td>{row.setup}</td>
                <td>{row.license}</td>
                <td>{row.bestFor}</td>
                <td>{row.watchOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="compare-cards">
        {rows.map(({ repo, row }) => (
          <article className="compare-card" key={`${row.name}:card`}>
            <div className="compare-card-head">
              <a href={row.url} target="_blank" rel="noreferrer">
                {row.name}
                <ExternalLink size={12} />
              </a>
              <span className="decision-pill">{buildPlainDecision(repo)}</span>
            </div>
            <dl>
              <div>
                <dt>Type</dt>
                <dd>{row.type}</dd>
              </div>
              <div>
                <dt>Match</dt>
                <dd>{row.match}</dd>
              </div>
              <div>
                <dt>Docs</dt>
                <dd>{row.docs}</dd>
              </div>
              <div>
                <dt>Setup</dt>
                <dd>{row.setup}</dd>
              </div>
              <div>
                <dt>License</dt>
                <dd>{row.license}</dd>
              </div>
            </dl>
            <p>
              <strong>Best for</strong>
              {row.bestFor}
            </p>
            <p>
              <strong>Watch out</strong>
              {row.watchOut}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
