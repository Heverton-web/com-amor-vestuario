import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl, dateTimeBR } from "@/features/core/utils/format";
import { toast } from "sonner";
import { X, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/kanban")({
  component: KanbanPage,
});

const BOARDS: Record<string, { label: string; stages: { key: string; label: string }[] }> = {
  orcamento: {
    label: "Orçamentos",
    stages: [
      { key: "novo", label: "Novo" },
      { key: "gerado", label: "Gerado" },
      { key: "enviado", label: "Enviado" },
      { key: "aprovado", label: "Aprovado" },
      { key: "perdido", label: "Perdido" },
    ],
  },
  fardamento: {
    label: "Fardamento",
    stages: [
      { key: "novo", label: "Novo" },
      { key: "orcamento", label: "Orçamento" },
      { key: "fechado", label: "Fechado" },
      { key: "aprovado", label: "Aprovado" },
      { key: "perdido", label: "Perdido" },
    ],
  },
  clube: {
    label: "Clube Com Amor",
    stages: [
      { key: "novo", label: "Interessados" },
      { key: "contatado", label: "Contatados" },
      { key: "membro", label: "Membros" },
      { key: "inativo", label: "Inativos" },
    ],
  },
  duvidas: {
    label: "Dúvidas",
    stages: [
      { key: "produto", label: "Produto" },
      { key: "preco", label: "Preço" },
      { key: "pagamento", label: "Pagamento" },
      { key: "entrega", label: "Entrega" },
      { key: "resolvido", label: "Resolvido" },
    ],
  },
};

function KanbanPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<keyof typeof BOARDS>("orcamento");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);

  const { data: cards } = useQuery({
    queryKey: ["kanban", tab],
    queryFn: async () =>
      (await supabase.from("kanban_cards").select("*").eq("board", tab).order("position")).data ??
      [],
  });

  const move = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase.from("kanban_cards").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kanban", tab] });
      toast.success("Card movido");
    },
  });

  const board = BOARDS[tab];

  return (
    <AdminShell title="CRM · Kanbans" noScroll>
      <div className="mb-6 inline-flex rounded-full border border-border bg-card p-1 shrink-0">
        {Object.entries(BOARDS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setTab(k as never)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${tab === k ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 flex-1 overflow-y-hidden flex flex-col min-h-0">
        <div
          className="grid gap-3 md:gap-4 h-full min-h-0"
          style={{ gridTemplateColumns: `repeat(${board.stages.length}, minmax(240px, 1fr))` }}
        >
          {board.stages.map((s) => {
            const stageCards = cards?.filter((c: any) => c.stage === s.key) ?? [];
            return (
              <div
                key={s.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(s.key);
                }}
                onDragLeave={() => setOverStage((cur) => (cur === s.key ? null : cur))}
                onDrop={() => {
                  if (dragId) move.mutate({ id: dragId, stage: s.key });
                  setDragId(null);
                  setOverStage(null);
                }}
                className={`rounded-2xl border bg-card p-3 transition-colors flex flex-col h-[400px] md:h-full min-h-0 ${overStage === s.key ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2 shrink-0">
                  <h3 className="font-display text-sm uppercase tracking-wider">{s.label}</h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums">
                    {stageCards.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {stageCards.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      onClick={() => setDetail(c)}
                      className={`w-full cursor-grab rounded-xl border border-border bg-background p-3 text-left text-sm transition-shadow hover:shadow-sm active:cursor-grabbing ${dragId === c.id ? "opacity-50" : ""}`}
                    >
                      <div className="font-medium">{c.title}</div>
                      {c.contact_whatsapp && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          📱 {c.contact_whatsapp}
                        </div>
                      )}
                      {c.amount && (
                        <div className="mt-1 text-xs font-medium text-primary">
                          {brl(Number(c.amount))}
                        </div>
                      )}
                      {c.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {c.description}
                        </div>
                      )}
                      <select
                        value={c.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => move.mutate({ id: c.id, stage: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-border bg-card px-2 py-1 text-xs"
                      >
                        {board.stages.map((st) => (
                          <option key={st.key} value={st.key}>
                            → {st.label}
                          </option>
                        ))}
                      </select>
                    </button>
                  ))}
                  {!stageCards.length && (
                    <div className="rounded-xl border border-dashed border-border/60 px-2 py-4 text-center text-[11px] text-muted-foreground shrink-0">
                      Solte aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground md:hidden shrink-0">
        Arraste para o lado para ver todas as etapas →
      </p>

      {detail && (
        <CardDetailDialog
          card={detail}
          stages={board.stages}
          onClose={() => setDetail(null)}
          onMove={(stage) => {
            move.mutate({ id: detail.id, stage });
            setDetail({ ...detail, stage });
          }}
        />
      )}
    </AdminShell>
  );
}

export function CardDetailDialog({
  card,
  stages,
  onClose,
  onMove,
}: {
  card: any;
  stages: { key: string; label: string }[];
  onClose: () => void;
  onMove: (stage: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-border bg-background p-5 md:rounded-3xl md:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.board}</p>
            <h3 className="font-display text-xl">{card.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          {card.contact_name && <Row label="Contato" value={card.contact_name} />}
          {card.contact_whatsapp && (
            <div className="flex items-center justify-between">
              <Row label="WhatsApp" value={card.contact_whatsapp} />
              <a
                href={`https://wa.me/${card.contact_whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground"
              >
                <MessageCircle className="h-3 w-3" /> Abrir
              </a>
            </div>
          )}
          {card.amount && <Row label="Valor" value={brl(Number(card.amount))} />}
          {card.description && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</p>
              <p className="mt-1 whitespace-pre-wrap">{card.description}</p>
            </div>
          )}
          <Row label="Criado em" value={dateTimeBR(card.created_at)} />
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
            Etapa
          </label>
          <select
            value={card.stage}
            onChange={(e) => onMove(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          >
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}
