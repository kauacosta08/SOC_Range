import { useEffect, useRef, useState } from "react";
import { Bot, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SocCase } from "@/lib/soc-case";

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Quais linhas de log são mais suspeitas?",
  "Como identificar o vetor de ataque aqui?",
  "Que campos revelam a exfiltração?",
];

function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-matrix">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded bg-terminal px-1 font-mono text-[0.72rem] text-info">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function MentorChat({ socCase }: { socCase: SocCase }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Sou o **SOC Assistant**. Posso orientar sua leitura dos logs com dicas — mas a conclusão é sua. O que está te travando?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          caseContext: `Caso #${socCase.id} — ${socCase.title}. Resumo: ${socCase.summary}\nLogs:\n${socCase.logs.map((l) => l.raw).join("\n")}`,
        }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok || !data.content) {
        setError(data.error ?? "Não foi possível contatar o mentor.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: data.content! }]);
    } catch {
      setError("Falha de rede ao contatar o mentor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel flex h-full min-h-[32rem] flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex size-7 items-center justify-center rounded-sm bg-matrix/15 text-matrix">
          <Bot className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="label-mono">Mentor de IA</h2>
          <p className="font-mono text-[0.65rem] text-matrix">SOC Assistant · online</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-md rounded-br-none bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[95%] whitespace-pre-wrap text-sm leading-relaxed text-foreground"
              }
            >
              {m.role === "user" ? m.content : renderRich(m.content)}
            </div>
          </div>
        ))}
        {loading && (
          <p className="font-mono text-xs text-matrix">
            <span className="live-dot">▍</span> analisando logs...
          </p>
        )}
        {error && (
          <p role="alert" className="font-mono text-xs text-critical">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-4 pt-3">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="rounded-full border border-border px-2.5 py-1 font-mono text-[0.62rem] text-muted-foreground transition-colors hover:border-matrix hover:text-matrix"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 px-4 py-3"
      >
        <Textarea
          ref={inputRef}
          value={input}
          rows={2}
          autoFocus
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Pedir uma dica sobre os logs..."
          aria-label="Mensagem para o mentor de IA"
          className="min-h-0 resize-none font-mono text-xs"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
          aria-label="Enviar pergunta"
        >
          <CornerDownLeft className="size-4" />
        </Button>
      </form>
    </section>
  );
}
