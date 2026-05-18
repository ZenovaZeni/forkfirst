import { ExternalLink } from "lucide-react";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { buildCompareRow } from "@/lib/compare/repo-compare";

type CompareTableProps = {
  repos: ClassifiedRepo[];
};

export function CompareTable({ repos }: CompareTableProps) {
  const rows = repos.slice(0, 3).map(buildCompareRow);
  if (rows.length === 0) return null;

  return (
    <section className="compare-section">
      <div className="section-heading">
        <p className="eyebrow">Compare</p>
        <h3>Top 3 at a glance</h3>
      </div>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Repo</th>
              <th>Type</th>
              <th>Match</th>
              <th>Docs</th>
              <th>Setup</th>
              <th>License</th>
              <th>Best for</th>
              <th>Watch out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>
                  <a href={row.url} target="_blank" rel="noreferrer">
                    {row.name}
                    <ExternalLink size={13} />
                  </a>
                  <span>{row.category}</span>
                </td>
                <td>{row.type}</td>
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
    </section>
  );
}
