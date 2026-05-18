import { useEffect, useState } from "react";
import { Clock, Gift, Ticket, Truck } from "lucide-react";
import type { RewardItem } from "@/features/fidelidade/services/rewards";
import { kindLabel, rewardSummary } from "@/features/fidelidade/services/rewards";

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function KindIcon({ k }: { k: RewardItem["kind"] }) {
  if (k === "voucher_frete") return <Truck className="h-3.5 w-3.5" />;
  if (k === "voucher_valor" || k === "voucher_percent") return <Ticket className="h-3.5 w-3.5" />;
  return <Gift className="h-3.5 w-3.5" />;
}

export function RewardCard({
  reward, balance, onRedeem,
}: {
  reward: RewardItem;
  balance: number | null;
  onRedeem: (r: RewardItem) => void;
}) {
  const [left, setLeft] = useState(() => (reward.expires_at ? timeLeft(reward.expires_at) : null));
  useEffect(() => {
    if (!reward.expires_at) return;
    const t = setInterval(() => setLeft(timeLeft(reward.expires_at as string)), 60000);
    return () => clearInterval(t);
  }, [reward.expires_at]);

  const img = reward.images[0];
  const outOfStock = reward.stock <= 0;
  const insufficient = balance !== null && balance < reward.points_cost;
  const disabled = outOfStock || insufficient;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/5] bg-secondary">
        {img ? (
          <img src={img} alt={reward.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <KindIcon k={reward.kind} />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur">
          <KindIcon k={reward.kind} /> {kindLabel(reward.kind)}
        </span>
        {left && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-medium text-destructive-foreground backdrop-blur">
            <Clock className="h-3 w-3" /> {left}
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-medium leading-tight">{reward.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{rewardSummary(reward)}</p>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-2xl text-primary">{reward.points_cost}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">pontos</div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {outOfStock ? "Esgotado" : `${reward.stock} disponíveis`}
          </div>
        </div>
        <button
          disabled={disabled}
          onClick={() => onRedeem(reward)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock ? "Esgotado" : insufficient ? "Pontos insuficientes" : "Resgatar"}
        </button>
      </div>
    </article>
  );
}

