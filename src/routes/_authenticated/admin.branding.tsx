import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/features/core/components/AdminShell";
import { useBranding, type Branding } from "@/features/core/services/branding";
import { supabase } from "@/features/core/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, Save, ExternalLink, Palette, Sparkles, 
  Smartphone, Monitor, CheckCircle2, MapPin, Clock, Heart, 
  ArrowRight, Landmark, PhoneCall
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  component: BrandingPage,
});

type Field = {
  key: keyof Branding;
  label: string;
  type?: "text" | "textarea" | "color" | "image";
  hint?: string;
};

// Seções agrupadas em 4 abas modernas
const tabSections = {
  identidade: {
    label: "Identidade & Cores",
    icon: Palette,
    title: "Identidade & Cores da Marca",
    description: "Defina o nome da sua marca, sua tagline e a paleta de cores artesanal que guiará todo o seu e-commerce.",
    groups: [
      {
        title: "Marca & Logo",
        fields: [
          { key: "brand_name", label: "Nome da marca" },
          { key: "brand_suffix", label: "Sufixo (ex: vestuário)" },
          { key: "tagline", label: "Tagline curta", hint: "Aparece nos motores de busca e compartilhamentos" },
          { key: "logo_url", label: "Logo (PNG/SVG transparente)", type: "image" },
        ] as Field[]
      },
      {
        title: "Cores da Identidade",
        fields: [
          { key: "primary_color", label: "Cor primária", type: "color", hint: "Usada em botões e destaques" },
          { key: "accent_color", label: "Cor de destaque", type: "color", hint: "Usada em badges e detalhes" },
          { key: "background_color", label: "Fundo", type: "color", hint: "Cor de fundo da loja" },
          { key: "foreground_color", label: "Texto principal", type: "color", hint: "Cor das fontes e títulos" },
        ] as Field[]
      }
    ]
  },
  landing: {
    label: "Página Inicial",
    icon: Sparkles,
    title: "Design da Landing Page",
    description: "Crie uma primeira impressão deslumbrante no topo da sua vitrine e conte a história por trás do seu atelier.",
    groups: [
      {
        title: "Banner Principal (Hero)",
        fields: [
          { key: "hero_title", label: "Título do Banner", type: "textarea" },
          { key: "hero_subtitle", label: "Subtítulo do Banner", type: "textarea" },
          { key: "hero_image_url", label: "Imagem de fundo do Banner", type: "image" },
        ] as Field[]
      },
      {
        title: "História & Atelier (Sobre)",
        fields: [
          { key: "about_title", label: "Título da Seção", type: "textarea" },
          { key: "about_text", label: "Texto da Seção", type: "textarea" },
          { key: "about_image_url", label: "Imagem da Seção", type: "image" },
        ] as Field[]
      },
      {
        title: "Botões de Chamada (CTAs)",
        fields: [
          { key: "cta_shop_label", label: "Texto do botão da loja", hint: "Ex.: Ver Coleção" },
          { key: "cta_shop_url", label: "Link do botão da loja", hint: "Ex.: /loja" },
          { key: "cta_contact_label", label: "Texto do botão de contato", hint: "Dispara o modal Fale Conosco" },
          { key: "cta_footer_shop_label", label: "Texto do link de rodapé" },
          { key: "cta_footer_shop_url", label: "Link de rodapé" },
        ] as Field[]
      }
    ]
  },
  contatos: {
    label: "Canais & Horários",
    icon: PhoneCall,
    title: "Canais, Endereço & Horários",
    description: "Mantenha seus clientes conectados exibindo seus contatos atualizados e a agenda de atendimento do seu atelier.",
    groups: [
      {
        title: "Canais de Atendimento",
        fields: [
          { key: "phone", label: "Telefone de contato" },
          { key: "whatsapp", label: "WhatsApp (somente números com DDI, ex: 5511999999999)" },
          { key: "email", label: "E-mail de suporte" },
        ] as Field[]
      },
      {
        title: "Endereço Físico",
        fields: [
          { key: "address_line1", label: "Linha de endereço 1" },
          { key: "address_line2", label: "Linha de endereço 2 (Bairro, CEP, Cidade)" },
        ] as Field[]
      },
      {
        title: "Redes Sociais",
        fields: [
          { key: "instagram_url", label: "Link do Instagram" },
          { key: "instagram_handle", label: "@ Usuário do Instagram", hint: "Aparece no rodapé da loja" },
          { key: "facebook_url", label: "Link do Facebook" },
        ] as Field[]
      },
      {
        title: "Agenda & Horários",
        fields: [
          { key: "hours_weekday", label: "Segunda a sexta-feira" },
          { key: "hours_saturday", label: "Sábado" },
          { key: "hours_sunday", label: "Domingo e feriados" },
        ] as Field[]
      }
    ]
  },
  recibos: {
    label: "Emissor de Recibos",
    icon: Landmark,
    title: "Emissão de Recibos & Faturamento",
    description: "Configure os dados fiscais e de assinatura digitalizada utilizados no gerador automatizado de faturas e recibos do cliente.",
    groups: [
      {
        title: "Dados Jurídicos",
        fields: [
          { key: "issuer_legal_name", label: "Razão social / Nome completo" },
          { key: "issuer_doc", label: "CNPJ ou CPF" },
          { key: "issuer_city", label: "Cidade (aparece antes da data nos documentos)" },
          { key: "issuer_address", label: "Endereço completo do Emissor", type: "textarea" },
        ] as Field[]
      },
      {
        title: "Chancela & Assinatura",
        fields: [
          { key: "signature_url", label: "Assinatura digitalizada (PNG transparente)", type: "image" },
        ] as Field[]
      }
    ]
  }
};

const fashionPalettes = [
  {
    name: "Terracotta Wabi-Sabi",
    description: "Artesanal e orgânico, ideal para marcas de linho, algodão e peças autorais.",
    primary: "oklch(0.55 0.16 38)",
    accent: "oklch(0.78 0.07 20)",
    background: "oklch(0.972 0.018 80)",
    foreground: "oklch(0.255 0.035 45)",
  },
  {
    name: "Sage Garden",
    description: "Sereno e sofisticado, inspirado na sutileza do eucalipto e tons florais secos.",
    primary: "oklch(0.48 0.10 145)",
    accent: "oklch(0.88 0.04 140)",
    background: "oklch(0.97 0.01 140)",
    foreground: "oklch(0.20 0.03 145)",
  },
  {
    name: "Midnight Silk",
    description: "Aesthetica luxuosa escura, remetendo a alfaiataria premium e detalhes em ouro.",
    primary: "oklch(0.7 0.16 38)",
    accent: "oklch(0.35 0.06 38)",
    background: "oklch(0.18 0.02 45)",
    foreground: "oklch(0.96 0.02 80)",
  },
  {
    name: "Lavender Heather",
    description: "Romântico, delicado e de alta costura contemporânea.",
    primary: "oklch(0.52 0.12 290)",
    accent: "oklch(0.85 0.06 295)",
    background: "oklch(0.97 0.01 290)",
    foreground: "oklch(0.22 0.04 290)",
  }
];

// Campos cruciais para o score de completude
const coreFields: (keyof Branding)[] = [
  "brand_name", "logo_url", "primary_color", "accent_color",
  "hero_title", "hero_image_url", "about_title", "phone",
  "whatsapp", "instagram_handle", "issuer_legal_name", "issuer_doc"
];

function BrandingPage() {
  const { branding, save } = useBranding();
  const [draft, setDraft] = useState<Branding>(branding);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof typeof tabSections>("identidade");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");

  useEffect(() => {
    setDraft(branding);
  }, [branding]);

  const update = (k: keyof Branding, v: string | null) =>
    setDraft((d) => ({ ...d, [k]: v as never }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await save(draft);
    setSaving(false);
    if (error) toast.error(error);
    else toast.success("Branding atualizado!");
  };

  const applyPalette = (p: typeof fashionPalettes[0]) => {
    setDraft(d => ({
      ...d,
      primary_color: p.primary,
      accent_color: p.accent,
      background_color: p.background,
      foreground_color: p.foreground
    }));
    toast.success(`Paleta "${p.name}" aplicada temporariamente! Clique em salvar.`);
  };

  // Cálculo da completude da marca
  const filledCount = coreFields.filter(f => !!draft?.[f]).length;
  const completeness = Math.round((filledCount / coreFields.length) * 100);

  const activeTabContent = tabSections[activeTab];

  return (
    <AdminShell
      title="Branding & Conteúdo"
      actions={
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Ver landing
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-opacity disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar tudo"}
          </button>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Coluna da Esquerda (Formulário & Setup) */}
        <div className="space-y-6 lg:col-span-7">
          
          {/* Completeness Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-medium text-sm">Completo da sua Marca</h3>
                <p className="text-xs text-muted-foreground">Preencha os dados essenciais para um visual profissional completo.</p>
              </div>
              <span className="font-mono text-lg font-bold text-primary">{completeness}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          {/* Abas Superiores */}
          <div className="flex flex-wrap gap-2 border-b border-border pb-px">
            {(Object.keys(tabSections) as Array<keyof typeof tabSections>).map((key) => {
              const tab = tabSections[key];
              const Icon = tab.icon;
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Cabeçalho da Aba Ativa */}
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">{activeTabContent.title}</h2>
            <p className="text-sm text-muted-foreground">{activeTabContent.description}</p>
          </div>

          {/* Grade de Paletas (somente na aba Identidade & Cores) */}
          {activeTab === "identidade" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-medium">Paletas Curadas por Estilistas</h3>
              </div>
              <p className="text-xs text-muted-foreground">Escolha uma estética pronta de alta costura com um único clique. Suas cores de fundo, botões e textos serão atualizados na hora.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {fashionPalettes.map((p) => {
                  const isCurrent = 
                    draft?.primary_color === p.primary &&
                    draft?.background_color === p.background;
                  return (
                    <button
                      key={p.name}
                      onClick={() => applyPalette(p)}
                      className={`flex flex-col text-left p-4 rounded-xl border transition-all hover:bg-muted ${
                        isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-xs font-bold">{p.name}</span>
                        {isCurrent && <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">{p.description}</p>
                      
                      {/* Amostra visual de cores */}
                      <div className="flex items-center gap-1.5 mt-auto">
                        <span className="h-5 w-5 rounded border border-foreground/5 shadow-sm" style={{ background: p.primary }} />
                        <span className="h-5 w-5 rounded border border-foreground/5 shadow-sm" style={{ background: p.accent }} />
                        <span className="h-5 w-5 rounded border border-foreground/5 shadow-sm" style={{ background: p.background }} />
                        <span className="h-5 w-5 rounded border border-foreground/5 shadow-sm" style={{ background: p.foreground }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Renderização Dinâmica dos Grupos de Campos */}
          <div className="space-y-6">
            {activeTabContent.groups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase text-xs">{group.title}</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  {group.fields.map((f) => (
                    <FieldEditor
                      key={f.key as string}
                      field={f}
                      value={(draft?.[f.key] as string | null) ?? ""}
                      onChange={(v) => update(f.key, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Coluna da Direita (Simulador de Landing Page em Tempo Real) */}
        <div className="lg:col-span-5 lg:sticky lg:top-8">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-lg space-y-4">
            
            {/* Controles do Simulador */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Simulador ao Vivo</span>
              </div>
              <div className="flex rounded-lg border border-border bg-background p-1 gap-1">
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-md transition-colors ${
                    previewMode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                  title="Visualização Celular"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-md transition-colors ${
                    previewMode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                  title="Visualização Desktop"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas do Mockup */}
            <div className="flex items-center justify-center bg-secondary/30 rounded-2xl p-4 overflow-hidden border border-border/60">
              
              {previewMode === "mobile" ? (
                /* Celular Premium Chassis */
                <div className="w-[280px] h-[500px] rounded-[36px] border-[6px] border-foreground/15 shadow-2xl bg-black overflow-hidden flex flex-col relative">
                  {/* Câmera Notificação */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                  </div>
                  
                  {/* Tela Interna */}
                  <div className="flex-1 flex flex-col overflow-y-auto scrollbar-none text-[10px] select-none pt-4 bg-background" style={{ background: draft?.background_color, color: draft?.foreground_color }}>
                    <LivePreviewContent draft={draft} />
                  </div>
                </div>
              ) : (
                /* Desktop Browser Frame */
                <div className="w-full h-[500px] rounded-xl border border-border shadow-2xl bg-black overflow-hidden flex flex-col">
                  {/* Browser Bar */}
                  <div className="bg-[#1a1a1a] px-4 py-2 border-b border-zinc-800 flex items-center gap-1.5 z-10 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div className="mx-auto w-3/5 rounded bg-zinc-800 py-0.5 px-3 text-center text-[8px] text-zinc-500 truncate">
                      {draft?.brand_name?.toLowerCase() || "comamor"}.com.br
                    </div>
                  </div>
                  
                  {/* Tela Interna */}
                  <div className="flex-1 flex flex-col overflow-y-auto text-xs select-none bg-background" style={{ background: draft?.background_color, color: draft?.foreground_color }}>
                    <LivePreviewContent draft={draft} />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}

// Subcomponente de Renderização do Mockup em tempo real
function LivePreviewContent({ draft }: { draft: Branding }) {
  const brandTitle = draft?.brand_name || "Com Amor";
  const brandSuffix = draft?.brand_suffix || "vestuário";

  return (
    <div className="w-full flex flex-col flex-1">
      {/* Mini Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-foreground/5 sticky top-0 bg-inherit backdrop-blur-sm z-10">
        {draft?.logo_url ? (
          <img src={draft.logo_url} alt="" className="h-5 w-auto object-contain max-w-[80px]" />
        ) : (
          <div className="flex items-baseline gap-1 text-xs">
            <Heart className="h-3 w-3 fill-primary stroke-primary text-primary" style={{ fill: draft?.primary_color, stroke: draft?.primary_color }} />
            <span className="font-semibold tracking-tight">{brandTitle}</span>
            <span className="text-[7px] opacity-70 uppercase tracking-widest">{brandSuffix}</span>
          </div>
        )}
        <div className="flex gap-2 opacity-80 text-[8px]">
          <span>loja</span>
          <span>atelier</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-8 text-center flex flex-col items-center justify-center relative min-h-[160px] overflow-hidden">
        {draft?.hero_image_url && (
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${draft.hero_image_url})` }} />
        )}
        <div className="relative z-10 space-y-3">
          <h1 className="font-serif text-lg font-medium leading-tight max-w-[90%] mx-auto whitespace-pre-wrap">
            {draft?.hero_title || "Peças atemporais criadas com afeto."}
          </h1>
          <p className="text-[9px] max-w-[80%] mx-auto opacity-80 leading-normal">
            {draft?.hero_subtitle || "Moda lenta inspirada na delicadeza e na alfaiataria fina."}
          </p>
          <button 
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[8px] font-medium shadow-sm transition-all whitespace-nowrap"
            style={{ backgroundColor: draft?.primary_color, color: "#fff" }}
          >
            {draft?.cta_shop_label || "Ver Coleção"} <ArrowRight className="h-2 w-2" />
          </button>
        </div>
      </section>

      {/* Sobre o Atelier Section */}
      <section className="px-4 py-6 border-t border-foreground/5 bg-foreground/[0.01] grid gap-4">
        <h2 className="text-center font-serif font-medium text-sm leading-snug">
          {draft?.about_title || "O Feito à Mão"}
        </h2>
        {draft?.about_image_url && (
          <img src={draft.about_image_url} alt="" className="w-full h-24 object-cover rounded-xl border border-foreground/5" />
        )}
        <p className="text-[8px] leading-relaxed text-justify opacity-80">
          {draft?.about_text || "Cada peça da nossa coleção passa por um processo de modelagem exclusivo. Valorizamos a produção justa e o acabamento meticuloso."}
        </p>
      </section>

      {/* Mini Footer */}
      <footer className="mt-auto px-4 py-6 border-t border-foreground/5 bg-foreground/[0.03] space-y-4">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-1 text-[9px] font-semibold">
            <Heart className="h-2.5 w-2.5 fill-primary stroke-primary text-primary" style={{ fill: draft?.primary_color, stroke: draft?.primary_color }} />
            <span>{brandTitle}</span>
          </div>
          <span className="text-[7px] opacity-60 leading-normal">{draft?.tagline || "Alfaiataria consciente e atemporal"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[7px] border-t border-foreground/5 pt-3 opacity-80">
          <div className="space-y-1">
            <span className="font-semibold block uppercase">Canais</span>
            <span className="block">{draft?.email || "contato@comamor.app"}</span>
            <span className="block">{draft?.phone || "(11) 99999-9999"}</span>
          </div>
          <div className="space-y-1 text-right">
            <span className="font-semibold block uppercase">Instagram</span>
            <span className="block">{draft?.instagram_handle || "@comamor.vestuario"}</span>
          </div>
        </div>

        <div className="text-[6px] text-center opacity-50 border-t border-foreground/5 pt-2">
          © {new Date().getFullYear()} {brandTitle}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

// Editor de Campos Reutilizável
function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${field.key}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("branding").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    onChange(data.publicUrl);
  };

  const isWide = field.type === "image" && (field.key.includes("hero") || field.key.includes("about"));

  if (field.type === "image") {
    return (
      <div className={`space-y-2 ${isWide ? "md:col-span-2" : ""}`}>
        <label className="block text-xs font-semibold text-foreground/80 tracking-wide">{field.label}</label>
        
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-background/50 shadow-inner">
          {value ? (
            <div className="relative group h-14 w-14 rounded-lg overflow-hidden border border-border shadow-sm">
              <img src={value} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="text-[10px] text-white font-medium hover:text-red-400"
                >
                  Remover
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border text-[9px] text-muted-foreground uppercase bg-background">
              Vazio
            </div>
          )}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60"
            >
              <Upload className="h-3 w-3" /> {uploading ? "Carregando..." : "Escolher Arquivo"}
            </button>
            <span className="text-[10px] text-muted-foreground">PNG, JPG ou SVG. Máx 5MB.</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Ou cole uma URL externa direta da imagem..."
          className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-shadow"
        />
        {field.hint && <p className="text-[10px] text-muted-foreground leading-relaxed">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === "color") {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-foreground/80 tracking-wide">{field.label}</label>
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-border/80 shadow-sm">
            <input
              type="color"
              value={value.startsWith("oklch") ? "#8c7263" : value} // Fallback simples para input color nativo
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-[-4px] h-[48px] w-[48px] cursor-pointer"
            />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="HEX, HSL ou OKLCH"
            className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-shadow"
          />
        </div>
        {field.hint && <p className="text-[10px] text-muted-foreground leading-relaxed">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5 md:col-span-2">
        <label className="block text-xs font-semibold text-foreground/80 tracking-wide">{field.label}</label>
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-shadow"
        />
        {field.hint && <p className="text-[10px] text-muted-foreground leading-relaxed">{field.hint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-foreground/80 tracking-wide">{field.label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-shadow"
      />
      {field.hint && <p className="text-[10px] text-muted-foreground leading-relaxed">{field.hint}</p>}
    </div>
  );
}
