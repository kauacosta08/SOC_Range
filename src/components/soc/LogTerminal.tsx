import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Terminal } from "lucide-react";
import type { LogLine } from "@/lib/soc-case";

const IP_RE = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;

function tokenize(line: LogLine) {
  const parts: Array<{ text: string; cls: string }> = [];
  const base =
    line.level === "crit"
      ? "text-critical"
      : line.level === "warn"
        ? "text-alert"
        : "text-terminal-foreground";

  let last = 0;
  for (const match of line.raw.matchAll(IP_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push({ text: line.raw.slice(last, idx), cls: base });
    parts.push({ text: match[0], cls: "text-info font-semibold underline decoration-dotted" });
    last = idx + match[0].length;
  }
  if (last < line.raw.length) parts.push({ text: line.raw.slice(last), cls: base });
  return parts;
}

export function LogTerminal({ logs, host }: { logs: LogLine[]; host: string }) {
  const [visible, setVisible] = useState(2);
  const [streaming, setStreaming] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!streaming || visible >= logs.length) return;
    const timer = window.setTimeout(() => setVisible((v) => v + 1), 1200);
    return () => window.clearTimeout(timer);
  }, [streaming, visible, logs.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible]);

  const shown = useMemo(() => logs.slice(0, visible), [logs, visible]);

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-matrix" aria-hidden />
          <h2 className="label-mono">Log Stream · {host}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-mono text-[0.68rem] text-muted-foreground">
            <span
              className={`size-2 rounded-full bg-matrix ${streaming ? "live-dot" : "opacity-40"}`}
            />
            {streaming ? "AO VIVO" : "PAUSADO"}
          </span>
          <button
            type="button"
            onClick={() => setStreaming((s) => !s)}
            aria-label={streaming ? "Pausar stream de logs" : "Retomar stream de logs"}
            className="inline-flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-matrix hover:text-matrix"
          >
            {streaming ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="scanlines h-80 overflow-y-auto bg-terminal px-4 py-3 font-mono text-[0.72rem] leading-relaxed"
      >
        {shown.map((line, i) => (
          <p key={`${i}-${line.raw.slice(0, 12)}`} className="log-line flex gap-3 py-0.5">
            <span className="shrink-0 select-none text-muted-foreground/60">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="shrink-0 select-none uppercase text-muted-foreground/70">
              {line.kind}
            </span>
            <span className="break-all">
              {tokenize(line).map((t, j) => (
                <span key={j} className={t.cls}>
                  {t.text}
                </span>
              ))}
            </span>
          </p>
        ))}
        <p className="flex gap-2 py-1 text-matrix">
          <span>analyst@cyberpulse:~$</span>
          <span className="live-dot">_</span>
        </p>
      </div>
    </section>
  );
}
