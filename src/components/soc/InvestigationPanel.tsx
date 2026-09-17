import { useState } from "react";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  attackVectors,
  mitigations,
  severityTags,
  type AttackVector,
  type CaseAnswer,
  type Mitigation,
  type SeverityTag,
  type SocCase,
} from "@/lib/soc-case";

type FormState = {
  attackerIp: string;
  port: string;
  vector: AttackVector | "";
  severity: SeverityTag | "";
  mitigation: Mitigation | "";
};

type Check = { key: keyof CaseAnswer; field: string; ok: boolean; hint: string };

const emptyForm: FormState = {
  attackerIp: "",
  port: "",
  vector: "",
  severity: "",
  mitigation: "",
};

export function InvestigationPanel({
  socCase,
  onSolved,
}: {
  socCase: SocCase;
  onSolved: (result: { accuracy: number; attempts: number }) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [solved, setSolved] = useState(false);

  const accuracy = checks
    ? Math.round((checks.filter((c) => c.ok).length / checks.length) * 100)
    : 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (solved) return;

    if (
      !form.attackerIp.trim() ||
      !form.port.trim() ||
      !form.vector ||
      !form.severity ||
      !form.mitigation
    ) {
      setError("Preencha todos os campos da triagem antes de submeter.");
      return;
    }
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(form.attackerIp.trim())) {
      setError("Informe um endereço IPv4 válido (ex.: 203.0.113.10).");
      return;
    }
    setError(null);

    const answer = socCase.answer;
    const nextChecks: Check[] = [
      {
        key: "attackerIp",
        field: "IP de origem",
        ok: form.attackerIp.trim() === answer.attackerIp,
        hint: socCase.hints.attackerIp,
      },
      {
        key: "vector",
        field: "Vetor de ataque",
        ok: form.vector === answer.vector,
        hint: socCase.hints.vector,
      },
      {
        key: "port",
        field: "Porta comprometida",
        ok: Number(form.port) === answer.port,
        hint: socCase.hints.port,
      },
      {
        key: "severity",
        field: "Severidade",
        ok: form.severity === answer.severity,
        hint: socCase.hints.severity,
      },
      {
        key: "mitigation",
        field: "Ação de mitigação",
        ok: form.mitigation === answer.mitigation,
        hint: socCase.hints.mitigation,
      },
    ];

    const nextAttempts = attempts + 1;
    const allCorrect = nextChecks.every((c) => c.ok);
    setAttempts(nextAttempts);
    setChecks(nextChecks);

    if (allCorrect) {
      setSolved(true);
      onSolved({ accuracy: 100, attempts: nextAttempts });
    }
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-alert" aria-hidden />
          <h2 className="label-mono">Triagem de Incidente</h2>
        </div>
        <span className="font-mono text-[0.65rem] text-muted-foreground">
          Tentativas: {attempts}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Correlacione os logs e classifique o Caso #{socCase.id}. Todas as respostas devem estar
        corretas para encerrar o incidente.
      </p>

      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="attackerIp" className="label-mono">
            IP de origem
          </Label>
          <Input
            id="attackerIp"
            value={form.attackerIp}
            onChange={(e) => setForm((f) => ({ ...f, attackerIp: e.target.value }))}
            placeholder="0.0.0.0"
            disabled={solved}
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="port" className="label-mono">
            Porta comprometida
          </Label>
          <Input
            id="port"
            type="number"
            min={1}
            max={65535}
            value={form.port}
            onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
            placeholder="0"
            disabled={solved}
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="label-mono">Vetor de ataque</Label>
          <Select
            value={form.vector}
            disabled={solved}
            onValueChange={(v) => setForm((f) => ({ ...f, vector: v as AttackVector }))}
          >
            <SelectTrigger aria-label="Vetor de ataque">
              <SelectValue placeholder="Selecione o vetor" />
            </SelectTrigger>
            <SelectContent>
              {attackVectors.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="label-mono">Severidade</Label>
          <Select
            value={form.severity}
            disabled={solved}
            onValueChange={(v) => setForm((f) => ({ ...f, severity: v as SeverityTag }))}
          >
            <SelectTrigger aria-label="Severidade">
              <SelectValue placeholder="Classifique a severidade" />
            </SelectTrigger>
            <SelectContent>
              {severityTags.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="label-mono">Ação de mitigação recomendada</Label>
          <Select
            value={form.mitigation}
            disabled={solved}
            onValueChange={(v) => setForm((f) => ({ ...f, mitigation: v as Mitigation }))}
          >
            <SelectTrigger aria-label="Ação de mitigação recomendada">
              <SelectValue placeholder="Selecione a ação" />
            </SelectTrigger>
            <SelectContent>
              {mitigations.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p role="alert" className="font-mono text-xs text-critical sm:col-span-2">
            {error}
          </p>
        )}

        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={solved}
            className="w-full font-mono uppercase tracking-widest"
          >
            {solved ? "Incidente encerrado" : "Submeter análise de incidente"}
          </Button>
        </div>
      </form>

      {checks && (
        <div
          className="mt-5 rounded-md border border-border bg-secondary/40 p-4"
          aria-live="polite"
        >
          <div className="flex items-baseline justify-between">
            <span className="label-mono">
              {solved ? "Incidente encerrado" : "Revise sua triagem"}
            </span>
            <span
              className={`font-mono text-2xl font-bold ${
                accuracy === 100 ? "text-matrix" : accuracy >= 60 ? "text-alert" : "text-critical"
              }`}
            >
              {accuracy}%
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {checks.map((c) => (
              <li key={c.key} className="flex gap-2 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-matrix" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-critical" aria-hidden />
                )}
                <span>
                  <span className="font-medium">{c.field}</span>
                  {!c.ok && <span className="text-muted-foreground"> — {c.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
          {solved && (
            <p className="mt-3 font-mono text-xs text-matrix">
              Carregando o próximo cenário do SOC Range...
            </p>
          )}
        </div>
      )}
    </section>
  );
}
