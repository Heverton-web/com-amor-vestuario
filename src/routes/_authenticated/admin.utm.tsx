import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/features/core/components/AdminShell";
import { Copy, Check, Link2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/utm")({
  component: UtmPage,
});

const sourcePresets = ["instagram", "facebook", "google", "whatsapp", "tiktok", "email", "site"];
const mediumPresets = ["social", "cpc", "email", "organic", "referral", "qrcode", "story", "feed", "reels"];

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function UtmPage() {
  const [url, setUrl] = useState("https://comamorvestuario.com.br/loja");
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("social");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");

  let final = "";
  try {
    const u = new URL(url);
    if (source) u.searchParams.set("utm_source", slug(source));
    if (medium) u.searchParams.set("utm_medium", slug(medium));
    if (campaign) u.searchParams.set("utm_campaign", slug(campaign));
    if (content) u.searchParams.set("utm_content", slug(content));
    if (term) u.searchParams.set("utm_term", slug(term));
    final = u.toString();
  } catch {
    final = "URL inválida";
  }

  const copy = () => { navigator.clipboard.writeText(final); toast.success("Copiado!"); };

  return (
    <AdminShell title="Gerador de UTM">
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <Lbl t="URL de destino *"><input value={url} onChange={(e) => setUrl(e.target.value)} className="input" /></Lbl>
          <Lbl t="utm_source * (origem)">
            <input value={source} onChange={(e) => setSource(e.target.value)} className="input mb-2" />
            <div className="flex flex-wrap gap-1">{sourcePresets.map((p) => <button key={p} type="button" onClick={() => setSource(p)} className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary">{p}</button>)}</div>
          </Lbl>
          <Lbl t="utm_medium * (meio)">
            <input value={medium} onChange={(e) => setMedium(e.target.value)} className="input mb-2" />
            <div className="flex flex-wrap gap-1">{mediumPresets.map((p) => <button key={p} type="button" onClick={() => setMedium(p)} className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary">{p}</button>)}</div>
          </Lbl>
          <Lbl t="utm_campaign * (campanha)"><input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="lancamento_inverno_2026" className="input" /></Lbl>
          <Lbl t="utm_content (variação do criativo)"><input value={content} onChange={(e) => setContent(e.target.value)} className="input" /></Lbl>
          <Lbl t="utm_term (palavra-chave)"><input value={term} onChange={(e) => setTerm(e.target.value)} className="input" /></Lbl>
        </div>

        <div className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground">
          <Link2 className="h-5 w-5 opacity-80" />
          <h3 className="mt-3 font-display text-lg opacity-90">URL com UTM gerada</h3>
          <p className="mt-4 break-all rounded-xl bg-primary-foreground/10 p-4 font-mono text-sm">{final}</p>
          <button onClick={copy} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-medium text-primary">
            <Copy className="h-4 w-4" /> Copiar link
          </button>
          <div className="mt-6 space-y-2 text-sm opacity-80">
            <p><Check className="mr-1 inline h-3 w-3" /> Slugs normalizados (lowercase, sem acento)</p>
            <p><Check className="mr-1 inline h-3 w-3" /> Padrão GA4 / Meta / Google Ads</p>
            <p><Check className="mr-1 inline h-3 w-3" /> Tracking automático de leads no formulário</p>
          </div>
        </div>
      </div>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--input);background:var(--background);padding:0.65rem 0.9rem;outline:none}.input:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--primary) 40%,transparent)}`}</style>
    </AdminShell>
  );
}

function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium">{t}</span>{children}</label>;
}

