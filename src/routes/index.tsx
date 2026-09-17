import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Radar, ShieldCheck } from "lucide-react";
import { LogTerminal } from "@/components/soc/LogTerminal";
import { InvestigationPanel } from "@/components/soc/InvestigationPanel";
import { MentorChat } from "@/components/soc/MentorChat";
import { HistoryTable } from "@/components/soc/HistoryTable";
import { CompletionDialog } from "@/components/soc/CompletionDialog";
import { Progress } from "@/components/ui/progress";
import { formatDuration, socCases, type SolvedCase } from "@/lib/soc-case";

const title = "CyberPulse SOC Range — Laboratório de Simulação de Incidentes";
const description =
  "Cyber range progressivo para analistas de SOC: cinco cenários de ataque com logs reais, triagem de incidentes pontuada e mentor de IA.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TOTAL_CASES = socCases.length;

function Index() {
  const [solved, setSolved] = useState<SolvedCase[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caseSeconds, setCaseSeconds] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCase = socCases[activeIndex];
  const finished = solved.length === TOTAL_CASES;

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setCaseSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const handleSolved = useCallback(
    ({ accuracy, attempts }: { accuracy: number; attempts: number }) => {
      if (!activeCase) return;
      const entry: SolvedCase = {
        caseId: activeCase.id,
        title: activeCase.title,
        vector: activeCase.answer.vector,
        severity: activeCase.answer.severity,
        accuracy,
        attempts,
        seconds: caseSeconds,
      };
      const nextSolved = [...solved, entry];
      setSolved(nextSolved);
      setTransitioning(true);

      advanceTimer.current = setTimeout(() => {
        setTransitioning(false);
        if (nextSolved.length === TOTAL_CASES) {
          setShowCompletion(true);
          return;
        }
        const solvedIds = new Set(nextSolved.map((s) => s.caseId));
        const nextIndex = socCases.findIndex((c) => !solvedIds.has(c.id));
        if (nextIndex >= 0) {
          setActiveIndex(nextIndex);
          setCaseSeconds(0);
        }
      }, 1600);
    },
    [activeCase, caseSeconds, solved],
  );

  const restart = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setShowCompletion(false);
    setSolved([]);
    setActiveIndex(0);
    setCaseSeconds(0);
    setTransitioning(false);
  }, []);

  const stats = useMemo(
    () => [
      { icon: Activity, label: "Host afetado", value: activeCase?.host ?? "--" },
      { icon: ShieldCheck, label: "Telemetria", value: activeCase?.telemetry ?? "--" },
      {
        icon: Radar,
        label: "Eventos correlacionados",
        value: String(activeCase?.logs.length ?? 0),
      },
    ],
    [activeCase],
  );

  const progressValue = (solved.length / TOTAL_CASES) * 100;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="glow-matrix flex size-9 items-center justify-center rounded-sm bg-matrix/10 text-matrix">
              <Radar className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-mono text-sm font-bold tracking-[0.18em] text-matrix">
                CYBERPULSE
              </p>
              <p className="label-mono">SOC Cyber Range &amp; Incident Simulation Lab</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-44">
              <div className="flex items-baseline justify-between gap-3">
                <p className="label-mono">Análises concluídas</p>
                <p className="font-mono text-sm font-bold text-matrix">
                  {solved.length}/{TOTAL_CASES}
                </p>
              </div>
              <Progress value={progressValue} className="mt-2 h-1.5" />
            </div>
            <div className="text-right">
              <p className="label-mono">Time elapsed</p>
              <p className="font-mono text-xl font-bold text-alert">
                {formatDuration(caseSeconds)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <h1 className="sr-only">
          CyberPulse SOC Range — treinamento progressivo de resposta a incidentes
        </h1>

        {finished && !showCompletion ? (
          <section className="panel mx-auto max-w-xl p-8 text-center">
            <h2 className="text-lg font-semibold text-matrix">SOC Range concluído</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Todos os {TOTAL_CASES} cenários foram encerrados. Consulte o histórico abaixo ou
              reinicie o laboratório.
            </p>
            <button
              type="button"
              onClick={restart}
              className="mt-5 rounded-md bg-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Reiniciar o cyber range
            </button>
          </section>
        ) : activeCase ? (
          <div
            className={`grid gap-6 transition-all duration-500 lg:grid-cols-[1.55fr_1fr] ${
              transitioning ? "translate-y-1 opacity-40" : "opacity-100"
            }`}
          >
            <div className="space-y-6">
              <section className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="label-mono">
                      Incident Room · Cenário {activeIndex + 1} de {TOTAL_CASES}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      <span className="font-mono text-matrix">#{activeCase.id}</span>{" "}
                      {activeCase.title}
                    </h2>
                  </div>
                  <span className="rounded-full border border-border bg-secondary/40 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">
                    Severidade a classificar
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {activeCase.summary}
                </p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  {stats.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-md border border-border bg-secondary/30 px-3 py-2"
                    >
                      <Icon className="size-4 shrink-0 text-matrix" aria-hidden />
                      <div className="min-w-0">
                        <dt className="label-mono">{label}</dt>
                        <dd className="truncate font-mono text-sm">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </section>

              <LogTerminal
                key={`logs-${activeCase.id}`}
                logs={activeCase.logs}
                host={activeCase.host}
              />
              <InvestigationPanel
                key={`form-${activeCase.id}`}
                socCase={activeCase}
                onSolved={handleSolved}
              />
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <MentorChat key={`mentor-${activeCase.id}`} socCase={activeCase} />
            </aside>
          </div>
        ) : null}

        <div className="mt-6">
          <HistoryTable solved={solved} total={TOTAL_CASES} />
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center font-mono text-[0.68rem] text-muted-foreground">
        CyberPulse SOC Range · ambiente de treinamento simulado — nenhum sistema real é afetado
      </footer>

      <CompletionDialog
        open={showCompletion}
        solved={solved}
        onRestart={restart}
        onOpenChange={setShowCompletion}
      />
    </div>
  );
}
