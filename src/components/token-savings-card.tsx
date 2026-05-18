import { formatTokensShort, type SavingsLog } from "@/lib/usage/savings";

export function TokenSavingsCard({ savings }: { savings: SavingsLog }) {
  if (savings.count === 0) {
    return (
      <section className="token-savings-card" aria-label="Estimated Builder Handoff token count">
        <p className="token-savings-empty">Export your first Builder Handoff to start tracking packet size.</p>
      </section>
    );
  }

  const formattedTokens = formatTokensShort(savings.totalHandoffTokens);

  return (
    <section className="token-savings-card" aria-label="Estimated Builder Handoff token count">
      <div className="token-savings-heading">
        <span>Handoff tokens exported</span>
      </div>
      <div className="token-savings-stats">
        <strong>~{formattedTokens} tokens</strong>
        <span>estimated</span>
      </div>
      <p className="token-savings-detail">{savings.count} handoff{savings.count === 1 ? "" : "s"} exported</p>
    </section>
  );
}
