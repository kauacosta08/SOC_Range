import { Award, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatDuration, type SolvedCase } from "@/lib/soc-case";

export function CompletionDialog({
  open,
  solved,
  onRestart,
  onOpenChange,
}: {
  open: boolean;
  solved: SolvedCase[];
  onRestart: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const totalSeconds = solved.reduce((acc, c) => acc + c.seconds, 0);
  const totalAttempts = solved.reduce((acc, c) => acc + c.attempts, 0);
  const firstTry = solved.filter((c) => c.attempts === 1).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-matrix/15 text-matrix">
          <Award className="size-7" aria-hidden />
        </div>
        <DialogTitle className="mt-2 text-xl">SOC Range concluído</DialogTitle>
        <DialogDescription>
          Você encerrou todos os {solved.length} cenários de incidente com triagem correta.
          Certificado Blue Team liberado.
        </DialogDescription>

        <dl className="mt-2 grid grid-cols-3 gap-3">
          {[
            { label: "Tempo total", value: formatDuration(totalSeconds), tone: "text-alert" },
            { label: "Submissões", value: String(totalAttempts), tone: "text-info" },
            { label: "1ª tentativa", value: `${firstTry}/${solved.length}`, tone: "text-matrix" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md border border-border bg-secondary/40 p-3">
              <dt className="label-mono">{stat.label}</dt>
              <dd className={`mt-1 font-mono text-lg font-bold ${stat.tone}`}>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <Button onClick={onRestart} className="mt-2 w-full font-mono uppercase tracking-widest">
          <RotateCcw className="size-4" aria-hidden />
          Reiniciar o cyber range
        </Button>
      </DialogContent>
    </Dialog>
  );
}
