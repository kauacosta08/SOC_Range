import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Body = { messages?: ChatMessage[]; caseContext?: string };

export const Route = createFileRoute("/api/hint")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(JSON.stringify({ error: "Mentor de IA indisponível." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = (await request.json()) as Body;
        const history = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
        if (history.length === 0) {
          return new Response(JSON.stringify({ error: "Mensagem obrigatória." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const system = [
          "Você é o SOC Assistant do CyberPulse SOC Range, um mentor de cibersegurança para analistas em treinamento.",
          "Responda sempre em português do Brasil, de forma curta e técnica (máximo 120 palavras).",
          "Dê DICAS socráticas: aponte quais linhas ou campos de log observar, o que correlacionar e qual raciocínio seguir.",
          "NUNCA revele diretamente o IP do atacante, a porta, o vetor exato, a severidade correta ou a ação de mitigação.",
          "Use markdown leve (listas curtas, `código` para campos de log).",
          "",
          "Contexto do caso ativo:",
          body.caseContext ?? "",
        ].join("\n");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.8-flash",
            messages: [{ role: "system", content: system }, ...history],
          }),
        });

        if (!res.ok) {
          const detail = await res.text();
          const message =
            res.status === 429
              ? "Muitas solicitações ao mentor. Aguarde alguns segundos."
              : res.status === 402
                ? "Os créditos de IA do workspace acabaram."
                : `Falha no mentor de IA (${res.status}).`;
          console.error("AI gateway error", res.status, detail);
          return new Response(JSON.stringify({ error: message }), {
            status: res.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content?.trim();
        return Response.json({
          content: content || "Não consegui formular uma dica agora. Tente reformular a pergunta.",
        });
      },
    },
  },
});
