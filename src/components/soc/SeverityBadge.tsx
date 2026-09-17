import { severityStyles, type SeverityTag } from "@/lib/soc-case";

export function SeverityBadge({
  severity,
  className = "",
}: {
  severity: SeverityTag;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-widest ${severityStyles[severity]} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {severity}
    </span>
  );
}
