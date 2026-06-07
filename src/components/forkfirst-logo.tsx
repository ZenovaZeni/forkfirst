export function ForkFirstLogo({ big = false }: { big?: boolean }) {
  return (
    <span className={`forkfirst-logo ${big ? "is-big" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        <path d="M14 12 L32 36 L32 54" />
        <path className="forkfirst-logo-accent" d="M50 12 L33 35" />
      </svg>
    </span>
  );
}
