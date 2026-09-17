import { Award, History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeverityBadge } from "@/components/soc/SeverityBadge";
import { formatDuration, type SolvedCase } from "@/lib/soc-case";

export function HistoryTable({ solved, total }: { solved: SolvedCase[]; total: number }) {
  const avgAccuracy = solved.length
    ? Math.round(solved.reduce((acc, c) => acc + c.accuracy, 0) / solved.length)
    : 0;
  const avgSeconds = solved.length
    ? Math.round(solved.reduce((acc, c) => acc + c.seconds, 0) / solved.length)
    : 0;
  const complete = solved.length === total && total > 0;

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="size-4 text-info" aria-hidden />
          <h2 className="label-mono">Histórico &amp; Certificação</h2>
        </div>
        <div className="flex items-center gap-5 font-mono text-xs">
          <span className="text-muted-foreground">
            Precisão média{" "}
            <span className="text-matrix">{solved.length ? `${avgAccuracy}%` : "--"}</span>
          </span>
          <span className="text-muted-foreground">
            Tempo médio{" "}
            <span className="text-alert">
              {solved.length ? formatDuration(avgSeconds) : "--:--"}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-4 max-h-72 overflow-auto rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="label-mono">Caso</TableHead>
              <TableHead className="label-mono">Vetor</TableHead>
              <TableHead className="label-mono">Severidade</TableHead>
              <TableHead className="label-mono">Precisão</TableHead>
              <TableHead className="label-mono">Tentativas</TableHead>
              <TableHead className="label-mono">Tempo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solved.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum incidente encerrado ainda. Resolva o caso ativo para começar o histórico.
                </TableCell>
              </TableRow>
            ) : (
              solved.map((c) => (
                <TableRow key={c.caseId}>
                  <TableCell className="min-w-56">
                    <span className="font-mono text-xs text-muted-foreground">#{c.caseId}</span>{" "}
                    {c.title}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">{c.vector}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={c.severity} />
                  </TableCell>
                  <TableCell className="font-mono text-matrix">{c.accuracy}%</TableCell>
                  <TableCell className="font-mono text-xs">{c.attempts}</TableCell>
                  <TableCell className="font-mono text-xs">{formatDuration(c.seconds)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div
        className={`mt-5 flex flex-wrap items-center gap-3 rounded-md border p-4 ${
          complete ? "border-matrix/50 bg-matrix/10" : "border-border bg-secondary/30"
        }`}
      >
        <Award
          className={`size-5 ${complete ? "text-matrix" : "text-muted-foreground"}`}
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium">Certificado Blue Team — SOC Range</p>
          <p className="font-mono text-[0.68rem] text-muted-foreground">
            {complete
              ? "Todos os cenários concluídos · certificado liberado"
              : `${solved.length} de ${total} cenários concluídos · resolva todos para liberar`}
          </p>
        </div>
      </div>
    </section>
  );
}
