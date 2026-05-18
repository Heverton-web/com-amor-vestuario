import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { AdminShell } from "@/features/core/components/AdminShell";
import { useBranding, type Branding } from "@/features/core/services/branding";
import { supabase } from "@/features/core/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, Save, ExternalLink, Palette, Sparkles, 
  Smartphone, Monitor, CheckCircle2, MapPin, Clock, Heart, 
  ArrowRight, Landmark, PhoneCall, Trash2, Gift, ShoppingBag, Eye,
  Plus, X
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

// Seções simplificadas agrupadas em 4 abas curtas
const tabSections = {
  identidade: {
    label: "Identidade & Cores",
    icon: Palette,
    title: "Identidade & Cores",
    description: "Defina o nome da sua marca, slogan, logotipos transparentes específicos para cada ambiente e personalize sua paleta de cores.",
    groups: [
      {
        title: "Marca & Slogan",
        fields: [
          { key: "brand_name", label: "Nome da marca" },
          { key: "brand_suffix", label: "Sufixo (ex: vestuário)" },
          { key: "tagline", label: "Tagline curta (Slogan)" },
        ] as Field[]
      },
      {
        title: "Logotipos por Ambiente",
        fields: [
          { key: "logo_url", label: "Logo Geral (Fallback)", type: "image", hint: "Usado quando nenhum outro for definido" },
          { key: "logo_landing_url", label: "Logo da Landing Page", type: "image", hint: "Aparece na página institucional de entrada" },
          { key: "logo_loja_url", label: "Logo da Loja Virtual", type: "image", hint: "Aparece no e-commerce e catálogo" },
          { key: "logo_recompensas_url", label: "Logo do Clube de Recompensas", type: "image", hint: "Aparece na central de pontos e fidelidade" },
          { key: "logo_recibos_url", label: "Logo de Recibos & Faturamento", type: "image", hint: "Aparece no topo de faturas e PDFs" },
        ] as Field[]
      },
      {
        title: "Cores da Identidade",
        fields: [
          { key: "primary_color", label: "Cor primária (Destaque principal)", type: "color" },
          { key: "accent_color", label: "Cor secundária (Apoio)", type: "color" },
          { key: "background_color", label: "Cor de fundo (Background)", type: "color" },
          { key: "foreground_color", label: "Cor do texto principal", type: "color" },
        ] as Field[]
      }
    ]
  },
  landing: {
    label: "Página Inicial",
    icon: Sparkles,
    title: "Página Inicial",
    description: "Personalize os banners de impacto, textos editoriais do Atelier e configure as principais chamadas para ação (CTAs).",
    groups: [
      {
        title: "Banner de Destaque (Hero)",
        fields: [
          { key: "hero_title", label: "Título de Impacto", type: "textarea" },
          { key: "hero_subtitle", label: "Subtítulo de Apoio", type: "textarea" },
          { key: "hero_image_url", label: "Imagem de fundo do Banner", type: "image" },
        ] as Field[]
      },
      {
        title: "Seção Sobre o Atelier",
        fields: [
          { key: "about_title", label: "Título da Seção", type: "textarea" },
          { key: "about_text", label: "Texto Editorial", type: "textarea" },
          { key: "about_image_url", label: "Imagem do Atelier / Produção", type: "image" },
        ] as Field[]
      },
      {
        title: "Ações da Página (Botões CTAs)",
        fields: [
          { key: "cta_shop_label", label: "Texto do botão da loja", hint: "Ex.: Ver Coleção" },
          { key: "cta_shop_url", label: "Link do botão da loja", hint: "Ex.: /loja" },
          { key: "cta_contact_label", label: "Texto do botão de contato" },
          { key: "cta_footer_shop_label", label: "Texto do link de rodapé" },
          { key: "cta_footer_shop_url", label: "Link de rodapé" },
        ] as Field[]
      }
    ]
  },
  contatos: {
    label: "Canais & Horários",
    icon: PhoneCall,
    title: "Canais & Horários",
    description: "Mantenha atualizados os dados de contato do suporte, links de mídias sociais e a agenda semanal de funcionamento físico.",
    groups: [
      {
        title: "Canais de Comunicação",
        fields: [
          { key: "phone", label: "Telefone institucional" },
          { key: "whatsapp", label: "WhatsApp (com DDI, ex: 5511999999999)" },
          { key: "email", label: "E-mail de atendimento" },
        ] as Field[]
      },
      {
        title: "Endereço Comercial",
        fields: [
          { key: "address_line1", label: "Endereço (Rua, Número, Sala)" },
          { key: "address_line2", label: "Bairro, Cidade, Estado e CEP" },
        ] as Field[]
      },
      {
        title: "Redes Sociais",
        fields: [
          { key: "instagram_url", label: "URL do Instagram" },
          { key: "instagram_handle", label: "@ Usuário do Instagram" },
          { key: "facebook_url", label: "URL do Facebook" },
        ] as Field[]
      },
      {
        title: "Horários de Funcionamento",
        fields: [
          { key: "hours_weekday", label: "Segunda a sexta" },
          { key: "hours_saturday", label: "Sábado" },
          { key: "hours_sunday", label: "Domingo e Feriados" },
        ] as Field[]
      }
    ]
  },
  recibos: {
    label: "Emissor de Recibos",
    icon: Landmark,
    title: "Emissor de Recibos",
    description: "Informe os dados fiscais e de chancela digital que serão aplicados nas faturas e nos recibos gerados para os clientes.",
    groups: [
      {
        title: "Dados Fiscais & Emissor",
        fields: [
          { key: "issuer_legal_name", label: "Razão Social / Nome do Emissor" },
          { key: "issuer_doc", label: "CNPJ ou CPF" },
          { key: "issuer_city", label: "Cidade de Emissão" },
          { key: "issuer_address", label: "Endereço Completo do Emissor", type: "textarea" },
        ] as Field[]
      },
      {
        title: "Assinatura do Emissor",
        fields: [
          { key: "signature_url", label: "Assinatura digitalizada (PNG transparente)", type: "image" },
        ] as Field[]
      }
    ]
  }
};

// Paletas curadas divididas por sazonalidade
const seasonalPalettes = {
  festividades: [
    {
      name: "Dia das Mães 🌸",
      description: "Suave, materno e delicado. Tons de rosa antigo e linho creme.",
      primary: "oklch(0.68 0.11 20)",      // Rosa antigo
      accent: "oklch(0.85 0.08 40)",       // Pêssego
      background: "oklch(0.975 0.015 50)",  // Creme rosado
      foreground: "oklch(0.28 0.04 20)"     // Walnut escuro
    },
    {
      name: "Natal Mágico 🎄",
      description: "Festivo e sofisticado. Verde pinheiro profundo e vermelho cereja.",
      primary: "oklch(0.48 0.16 27)",       // Vermelho cereja
      accent: "oklch(0.35 0.08 150)",      // Verde pinheiro
      background: "oklch(0.98 0.01 80)",     // Linho off-white
      foreground: "oklch(0.18 0.03 145)"    // Verde escuro
    },
    {
      name: "Ano Novo Real 🌟",
      description: "Ouro champanhe e seda branca. Minimalismo luxuoso e festivo.",
      primary: "oklch(0.72 0.14 80)",       // Champanhe
      accent: "oklch(0.88 0.06 85)",       // Prata
      background: "oklch(0.98 0.005 90)",   // Off-white
      foreground: "oklch(0.25 0.02 80)"     // Bronze
    }
  ],
  estacoes: [
    {
      name: "Primavera/Verão ☀️",
      description: "Fresco, leve e ensolarado. Tons de amarelo sol e rosa hibisco.",
      primary: "oklch(0.78 0.16 75)",       // Amarelo sol
      accent: "oklch(0.68 0.18 15)",       // Hibisco
      background: "oklch(0.97 0.02 85)",    // Areia
      foreground: "oklch(0.25 0.05 45)"     // Argila
    },
    {
      name: "Outono/Inverno 🍂",
      description: "Aconchegante e acolhedor. Tons de argila terracota e cacau profundo.",
      primary: "oklch(0.55 0.16 38)",       // Terracota
      accent: "oklch(0.38 0.08 30)",       // Marrom cacau
      background: "oklch(0.94 0.02 75)",    // Cinza pedra
      foreground: "oklch(0.20 0.03 45)"     // Walnut
    }
  ]
};

// Campos para cálculo da completude
const coreFields: (keyof Branding)[] = [
  "brand_name", "logo_landing_url", "primary_color", "accent_color",
  "hero_title", "hero_image_url", "about_title", "phone",
  "whatsapp", "instagram_handle", "issuer_legal_name", "issuer_doc"
];

function BrandingPage() {
  const { branding, save } = useBranding();
  const [draft, setDraft] = useState<Branding>(branding);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof typeof tabSections>("identidade");
  
  // Controles do Simulador
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [previewPage, setPreviewPage] = useState<"landing" | "loja" | "recompensas">("landing");
  
  // Criador de Paleta Customizada
  const [customPaletteName, setCustomPaletteName] = useState("");

  // Controle de Modais de Cadastro
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);

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

  const applyPalette = (p: { name: string; primary: string; accent: string; background: string; foreground: string }) => {
    setDraft(d => ({
      ...d,
      primary_color: p.primary,
      accent_color: p.accent,
      background_color: p.background,
      foreground_color: p.foreground
    }));
    toast.success(`Paleta "${p.name}" selecionada! Clique em "Salvar tudo" para aplicar definitivamente.`);
  };

  const saveCustomPalette = () => {
    if (!customPaletteName.trim()) {
      toast.error("Por favor, digite um nome para sua paleta personalizada.");
      return;
    }
    const newPalette = {
      name: customPaletteName.trim(),
      primary: draft.primary_color,
      accent: draft.accent_color,
      background: draft.background_color,
      foreground: draft.foreground_color
    };
    const currentCustoms = draft.custom_palettes || [];
    if (currentCustoms.some(c => c.name.toLowerCase() === newPalette.name.toLowerCase())) {
      toast.error("Já existe uma paleta com este nome.");
      return;
    }
    const updated = [...currentCustoms, newPalette];
    setDraft(d => ({ ...d, custom_palettes: updated }));
    setCustomPaletteName("");
    toast.success(`Sua paleta "${newPalette.name}" foi adicionada! Lembre-se de "Salvar Tudo" para persistir no banco.`);
  };

  const deleteCustomPalette = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = (draft.custom_palettes || []).filter(c => c.name !== name);
    setDraft(d => ({ ...d, custom_palettes: updated }));
    toast.success("Paleta excluída!");
  };

  // Cálculo da completude
  const filledCount = coreFields.filter(f => !!draft?.[f]).length;
  const completeness = Math.round((filledCount / coreFields.length) * 100);

  const activeTabContent = tabSections[activeTab];

  return (
    <>
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
                <p className="text-xs text-muted-foreground">Preencha os dados essenciais para obter um visual completo de alta fidelidade.</p>
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

          {/* Abas Horizontais Curtas e Simplificadas */}
          <div className="flex flex-nowrap overflow-x-auto gap-2 border-b border-border pb-px scrollbar-none">
            {(Object.keys(tabSections) as Array<keyof typeof tabSections>).map((key) => {
              const tab = tabSections[key];
              const Icon = tab.icon;
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
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

          {/* Interface de Paletas (Aba Identidade & Cores) */}
          {activeTab === "identidade" && (
            <div className="space-y-6">
              
              {/* Paletas Sazonais */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-medium">Paletas Temáticas e Sazonais</h3>
                </div>
                <p className="text-xs text-muted-foreground">Escolha estéticas prontas de alta costura inspiradas em estações e comemorações importantes para renovar sua loja instantaneamente.</p>
                
                {/* Categoria Festividades */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">🎉 Datas Especiais & Festas</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {seasonalPalettes.festividades.map((p) => {
                      const isCurrent = draft?.primary_color === p.primary && draft?.background_color === p.background;
                      return (
                        <button
                          key={p.name}
                          onClick={() => applyPalette(p)}
                          className={`flex flex-col text-left p-3.5 rounded-xl border transition-all hover:bg-muted ${
                            isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-background"
                          }`}
                        >
                          <span className="text-[11px] font-bold block mb-1">{p.name}</span>
                          <p className="text-[9px] text-muted-foreground leading-normal mb-3 flex-1">{p.description}</p>
                          <div className="flex items-center gap-1 mt-auto">
                            <span className="h-4.5 w-4.5 rounded border border-foreground/5" style={{ background: p.primary }} />
                            <span className="h-4.5 w-4.5 rounded border border-foreground/5" style={{ background: p.accent }} />
                            <span className="h-4.5 w-4.5 rounded border border-foreground/5" style={{ background: p.background }} />
                            <span className="h-4.5 w-4.5 rounded border border-foreground/5" style={{ background: p.foreground }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categoria Estações */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">🍂 Estações do Ano</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {seasonalPalettes.estacoes.map((p) => {
                      const isCurrent = draft?.primary_color === p.primary && draft?.background_color === p.background;
                      return (
                        <button
                          key={p.name}
                          onClick={() => applyPalette(p)}
                          className={`flex flex-col text-left p-3.5 rounded-xl border transition-all hover:bg-muted ${
                            isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-background"
                          }`}
                        >
                          <span className="text-[11px] font-bold block mb-1">{p.name}</span>
                          <p className="text-[9px] text-muted-foreground leading-normal mb-3 flex-1">{p.description}</p>
                          <div className="flex items-center gap-1 mt-auto">
                            <span className="h-4.5 w-4.5 rounded border border-foreground/5" style={{ background: p.primary }} />
                            <span className="h-4.5 w-4.5 rounded border border-foreground/5" style={{ background: p.accent }} />
                            <span className="h-4.5 w-4.5 rounded border border-foreground/5" style={{ background: p.background }} />
                            <span className="h-4.5 w-4.5 rounded border border-foreground/5" style={{ background: p.foreground }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Criador de Paleta Customizada */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-medium">Minhas Paletas</h3>
                </div>
                <p className="text-xs text-muted-foreground">Personalize as cores nos inputs abaixo, escolha um nome exclusivo e salve a sua própria identidade de coleção.</p>
                
                {/* Painel de Criação */}
                <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl border border-dashed border-border bg-background/40 items-center justify-between">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Visual da Paleta Ativa */}
                    <div className="flex -space-x-1 shrink-0">
                      <span className="h-6 w-6 rounded-full border border-background shadow" style={{ background: draft?.primary_color }} />
                      <span className="h-6 w-6 rounded-full border border-background shadow" style={{ background: draft?.accent_color }} />
                      <span className="h-6 w-6 rounded-full border border-background shadow" style={{ background: draft?.background_color }} />
                      <span className="h-6 w-6 rounded-full border border-background shadow" style={{ background: draft?.foreground_color }} />
                    </div>
                    <input
                      type="text"
                      placeholder="Nome da sua paleta..."
                      value={customPaletteName}
                      onChange={(e) => setCustomPaletteName(e.target.value)}
                      className="bg-background border border-input rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary w-full max-w-[180px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveCustomPalette}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" /> Salvar Paleta
                  </button>
                </div>

                {/* Exibição de Paletas Customizadas do Usuário */}
                {draft?.custom_palettes && draft.custom_palettes.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-3 pt-2">
                    {draft.custom_palettes.map((p) => {
                      const isCurrent = draft?.primary_color === p.primary && draft?.background_color === p.background;
                      return (
                        <div
                          key={p.name}
                          onClick={() => applyPalette(p)}
                          className={`group relative flex flex-col text-left p-3 rounded-xl border transition-all hover:bg-muted cursor-pointer ${
                            isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-background"
                          }`}
                        >
                          <button
                            onClick={(e) => deleteCustomPalette(p.name, e)}
                            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir Paleta"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          
                          <span className="text-[10px] font-bold pr-5 truncate block mb-2">{p.name}</span>
                          <div className="flex items-center gap-1 mt-auto">
                            <span className="h-4 w-4 rounded-full border border-foreground/5" style={{ background: p.primary }} />
                            <span className="h-4 w-4 rounded-full border border-foreground/5" style={{ background: p.accent }} />
                            <span className="h-4 w-4 rounded-full border border-foreground/5" style={{ background: p.background }} />
                            <span className="h-4 w-4 rounded-full border border-foreground/5" style={{ background: p.foreground }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic text-center py-2">Você ainda não criou nenhuma paleta própria.</p>
                )}
              </div>

            </div>
          )}

          {/* Renderização Dinâmica dos Grupos de Campos */}
          <div className="space-y-6">
            {activeTabContent.groups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase tracking-widest">{group.title}</h3>
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

            {activeTab === "landing" && (
              <>
                {/* Editor de Galeria de Imagens */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="font-display text-lg font-medium">Galeria de Imagens (Landing Page)</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddImageModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Imagem
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    As imagens da sua galeria aparecem na seção "Quem veste a gente". Você pode fazer upload de fotos dos seus clientes reais, definir legendas e escolher se a foto ocupa 1 espaço simples ou 2 espaços verticais (Grande).
                  </p>

                  {draft.gallery_items && draft.gallery_items.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                      {draft.gallery_items.map((item, idx) => (
                        <GalleryItemEditor
                          key={idx}
                          idx={idx}
                          item={item}
                          onUpdate={(updatedItem) => {
                            const list = [...(draft.gallery_items || [])];
                            list[idx] = updatedItem;
                            setDraft(d => ({ ...d, gallery_items: list }));
                          }}
                          onDelete={() => {
                            const list = (draft.gallery_items || []).filter((_, i) => i !== idx);
                            setDraft(d => ({ ...d, gallery_items: list }));
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-4">Nenhuma imagem na galeria. Clique em "Adicionar Imagem" para começar.</p>
                  )}
                </div>

                {/* Editor de Depoimentos */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      <h3 className="font-display text-lg font-medium">Depoimentos dos Clientes (Landing Page)</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddTestimonialModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Depoimento
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure depoimentos reais que mostram o carinho e cuidado da sua marca com seus clientes. Eles aparecem no rodapé dinâmico da página inicial.
                  </p>

                  {draft.testimonials && draft.testimonials.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                      {draft.testimonials.map((item, idx) => (
                        <TestimonialItemEditor
                          key={idx}
                          item={item}
                          onUpdate={(updatedItem) => {
                            const list = [...(draft.testimonials || [])];
                            list[idx] = updatedItem;
                            setDraft(d => ({ ...d, testimonials: list }));
                          }}
                          onDelete={() => {
                            const list = (draft.testimonials || []).filter((_, i) => i !== idx);
                            setDraft(d => ({ ...d, testimonials: list }));
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum depoimento configurado. Clique em "Adicionar Depoimento" para começar.</p>
                  )}
                </div>
              </>
            )}
          </div>

        </div>

        {/* Coluna da Direita (Simulador Multi-Ambiente Reativo) */}
        <div className="lg:col-span-5 lg:sticky lg:top-8">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-lg space-y-4">
            
            {/* Controles Principais do Simulador */}
            <div className="flex flex-col gap-3 border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estúdio de Design</span>
                </div>
                {/* Seletor Mobile/Desktop */}
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

              {/* Seletor de Ambiente / Página */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/40 rounded-xl border border-border/60">
                <button
                  onClick={() => setPreviewPage("landing")}
                  className={`py-1.5 px-2 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                    previewPage === "landing" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3 w-3" /> Landing
                </button>
                <button
                  onClick={() => setPreviewPage("loja")}
                  className={`py-1.5 px-2 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                    previewPage === "loja" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShoppingBag className="h-3 w-3" /> Loja
                </button>
                <button
                  onClick={() => setPreviewPage("recompensas")}
                  className={`py-1.5 px-2 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                    previewPage === "recompensas" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Gift className="h-3 w-3" /> Fidelidade
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
                    <LivePreviewContent draft={draft} page={previewPage} />
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
                      {draft?.brand_name?.toLowerCase() || "comamor"}.com.br/{previewPage === "landing" ? "" : previewPage}
                    </div>
                  </div>
                  
                  {/* Tela Interna */}
                  <div className="flex-1 flex flex-col overflow-y-auto text-xs select-none bg-background animate-fade-in" style={{ background: draft?.background_color, color: draft?.foreground_color }}>
                    <LivePreviewContent draft={draft} page={previewPage} />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </AdminShell>

    {showAddImageModal && (
      <AddImageModal 
        onClose={() => setShowAddImageModal(false)}
        nextIndex={(draft.gallery_items || []).length}
        onAdd={(item) => setDraft(d => ({
          ...d,
          gallery_items: [...(d.gallery_items || []), item]
        }))}
      />
    )}

    {showAddTestimonialModal && (
      <AddTestimonialModal 
        onClose={() => setShowAddTestimonialModal(false)}
        onAdd={(item) => setDraft(d => ({
          ...d,
          testimonials: [...(d.testimonials || []), item]
        }))}
      />
    )}
  </>
);
}

// Subcomponente de Renderização do Mockup em tempo real com Multi-Ambiente e Multi-Logo
function LivePreviewContent({ draft, page }: { draft: Branding; page: "landing" | "loja" | "recompensas" }) {
  const brandTitle = draft?.brand_name || "Com Amor";
  const brandSuffix = draft?.brand_suffix || "vestuário";

  // Identificação do logotipo correspondente ao ambiente ativo
  const activeLogo = useMemo(() => {
    if (page === "landing") return draft?.logo_landing_url || draft?.logo_url;
    if (page === "loja") return draft?.logo_loja_url || draft?.logo_url;
    if (page === "recompensas") return draft?.logo_recompensas_url || draft?.logo_url;
    return draft?.logo_url;
  }, [page, draft?.logo_url, draft?.logo_landing_url, draft?.logo_loja_url, draft?.logo_recompensas_url]);

  return (
    <div className="w-full flex flex-col flex-1">
      {/* Mini Header com Logo Específico */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-foreground/5 sticky top-0 bg-inherit backdrop-blur-sm z-10 transition-colors">
        {activeLogo ? (
          <img src={activeLogo} alt="" className="h-5 w-auto object-contain max-w-[85px] animate-fade-in" />
        ) : (
          <div className="flex items-baseline gap-1 text-xs">
            <Heart className="h-3 w-3 fill-primary stroke-primary text-primary" style={{ fill: draft?.primary_color, stroke: draft?.primary_color }} />
            <span className="font-semibold tracking-tight">{brandTitle}</span>
            <span className="text-[7px] opacity-70 uppercase tracking-widest">{brandSuffix}</span>
          </div>
        )}
        
        {/* Status de Menu adaptado por Ambiente */}
        <div className="flex gap-2.5 opacity-80 text-[8px] font-medium">
          <span className={page === "landing" ? "text-primary border-b border-primary" : ""} style={page === "landing" ? { color: draft?.primary_color, borderColor: draft?.primary_color } : {}}>Início</span>
          <span className={page === "loja" ? "text-primary border-b border-primary" : ""} style={page === "loja" ? { color: draft?.primary_color, borderColor: draft?.primary_color } : {}}>Coleção</span>
          <span className={page === "recompensas" ? "text-primary border-b border-primary" : ""} style={page === "recompensas" ? { color: draft?.primary_color, borderColor: draft?.primary_color } : {}}>Clube</span>
        </div>
      </header>

      {/* RENDERIZADOR DE PÁGINAS DO SIMULADOR */}

      {page === "landing" && (
        /* PÁGINA 1: LANDING PAGE INSTITUCIONAL */
        <div className="flex-1 flex flex-col">
          {/* Hero Banner */}
          <section className="px-4 py-9 text-center flex flex-col items-center justify-center relative min-h-[170px] overflow-hidden border-b border-foreground/5">
            {draft?.hero_image_url && (
              <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${draft.hero_image_url})` }} />
            )}
            <div className="relative z-10 space-y-3">
              <h1 className="font-serif text-lg font-medium leading-snug max-w-[90%] mx-auto whitespace-pre-wrap">
                {draft?.hero_title || "Peças atemporais criadas com afeto."}
              </h1>
              <p className="text-[9px] max-w-[80%] mx-auto opacity-80 leading-normal">
                {draft?.hero_subtitle || "Moda lenta inspirada na delicadeza e na alfaiataria fina."}
              </p>
              <button 
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[8px] font-semibold shadow-sm transition-all whitespace-nowrap"
                style={{ backgroundColor: draft?.primary_color, color: "#fff" }}
              >
                {draft?.cta_shop_label || "Ver Coleção"} <ArrowRight className="h-2 w-2" />
              </button>
            </div>
          </section>

          {/* Seção Sobre */}
          <section className="px-4 py-6 border-b border-foreground/5 bg-foreground/[0.01] grid gap-3">
            <h2 className="text-center font-serif font-medium text-sm leading-snug">
              {draft?.about_title || "O Nosso Atelier"}
            </h2>
            {draft?.about_image_url && (
              <img src={draft.about_image_url} alt="" className="w-full h-24 object-cover rounded-xl border border-foreground/5" />
            )}
            <p className="text-[8px] leading-relaxed text-justify opacity-80">
              {draft?.about_text || "Cada peça da nossa coleção passa por um processo de modelagem exclusivo. Valorizamos a produção justa e o acabamento meticuloso."}
            </p>
          </section>

          {/* Galeria do Rascunho no Simulador */}
          <section className="px-4 py-6 border-b border-foreground/5 bg-background space-y-3">
            <h2 className="font-serif font-medium text-xs text-center">Quem veste a gente.</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {(draft?.gallery_items?.length ? draft.gallery_items : [
                { src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80", caption: "Mariana · Blusa Linho" },
                { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80", caption: "Equipe Solaris · Fardamento" },
                { src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80", caption: "Carla · Vestido Sage" },
                { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80", caption: "Pedro · Camisa Argila" }
              ]).map((i, idx) => (
                <div key={idx} className="w-[100px] shrink-0">
                  <figure className="relative overflow-hidden rounded-xl border border-foreground/5 aspect-[4/5] bg-muted/20">
                    <img src={i.src || ""} alt="" className="h-full w-full object-cover" />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[6px] text-white truncate text-center font-medium">
                      {i.caption}
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </section>

          {/* Depoimentos do Rascunho no Simulador */}
          <section className="px-4 py-6 border-b border-foreground/5 text-white space-y-3" style={{ backgroundColor: draft?.primary_color || "#3d3028" }}>
            <h2 className="font-serif font-medium text-xs text-center">A gente costura. Elas contam.</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {(draft?.testimonials?.length ? draft.testimonials : [
                { quote: "O acabamento é de outro mundo. Sinto o cuidado em cada costura — comprei uma peça, voltei para mais três.", name: "Beatriz Lima", role: "Cliente varejo" },
                { quote: "Fizemos o fardamento da nossa equipe inteira. Pontualidade impecável e qualidade que valoriza nossa marca.", name: "Ricardo Sales", role: "Solaris Tecnologia" },
                { quote: "Atendimento humano de verdade. Me ajudaram a escolher tamanho pelo WhatsApp e a peça caiu perfeita.", name: "Luana Pires", role: "Cliente varejo" }
              ]).map((t, idx) => (
                <div key={idx} className="w-[150px] shrink-0 bg-white/10 rounded-2xl p-3 border border-white/10 flex flex-col justify-between min-h-[90px]">
                  <p className="text-[7px] italic leading-normal line-clamp-3">“{t.quote}”</p>
                  <div className="text-[6px] border-t border-white/10 pt-1.5 mt-1.5 opacity-90">
                    <span className="font-semibold block">{t.name}</span>
                    <span className="opacity-70">{t.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {page === "loja" && (
        /* PÁGINA 2: LOJA VIRTUAL / CATÁLOGO */
        <div className="flex-1 flex flex-col p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-sm font-medium">Lançamentos de Outono</h2>
            <span className="text-[8px] opacity-60">6 Itens</span>
          </div>
          
          {/* Grid de Roupas */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Camisa de Linho Puro", price: "R$ 290,00", color: "Areia" },
              { name: "Vestido Midi Alfaiataria", price: "R$ 480,00", color: "Terracota" },
            ].map((p, idx) => (
              <div key={idx} className="group rounded-xl border border-foreground/5 bg-foreground/[0.01] overflow-hidden flex flex-col">
                <div className="h-28 w-full bg-foreground/5 flex items-center justify-center text-[8px] text-muted-foreground uppercase tracking-widest font-mono">
                  [Imagem {p.color}]
                </div>
                <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-[8px] truncate">{p.name}</h3>
                    <span className="text-[7px] text-muted-foreground block">{p.color}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 mt-auto">
                    <span className="font-medium text-[8px]" style={{ color: draft?.primary_color }}>{p.price}</span>
                    <button 
                      type="button"
                      className="p-1 rounded-full text-white" 
                      style={{ backgroundColor: draft?.primary_color }}
                    >
                      <ShoppingBag className="h-2 w-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {page === "recompensas" && (
        /* PÁGINA 3: LOJA DE RECOMPENSAS / FIDELIDADE */
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Banner de Boas-Vindas */}
          <div className="rounded-2xl p-4 text-center text-white space-y-2" style={{ backgroundColor: draft?.primary_color }}>
            <h2 className="font-serif text-sm font-medium">Clube Com Amor</h2>
            <p className="text-[8px] opacity-90">Acumule pontos em todas as compras e troque por mimos e descontos no Atelier.</p>
            
            {/* Saldo de Pontos */}
            <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[9px] font-bold border border-white/20">
              Seu Saldo: <span className="font-mono">1.250</span> pontos
            </div>
          </div>

          <h3 className="font-serif text-xs font-medium">Vouchers de Recompensas</h3>
          
          {/* Cupons Mock */}
          <div className="space-y-2">
            {[
              { label: "R$ 50 de Desconto", points: "500" },
              { label: "Frete Grátis Sul/SE", points: "300" }
            ].map((v, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-foreground/5 bg-foreground/[0.01]">
                <div className="flex items-center gap-2">
                  <Gift className="h-3.5 w-3.5 text-primary" style={{ color: draft?.primary_color }} />
                  <div>
                    <h4 className="font-bold text-[8px]">{v.label}</h4>
                    <span className="text-[7px] text-muted-foreground">Resgate imediato</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="px-2 py-1 rounded-full text-[7px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: draft?.primary_color }}
                >
                  {v.points} pts
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

// ==========================================
// MODAIS DE CADASTRO (EXCLUSIVO)
// ==========================================

function AddImageModal({
  onClose,
  onAdd,
  nextIndex
}: {
  onClose: () => void;
  onAdd: (item: { src: string; caption: string; span: string }) => void;
  nextIndex: number;
}) {
  const [caption, setCaption] = useState("");
  const [span, setSpan] = useState("");
  const [src, setSrc] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `gallery-item-${nextIndex}-${Date.now()}.${ext}`;
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
    setSrc(data.publicUrl);
    toast.success("Imagem enviada com sucesso!");
  };

  const handleSave = () => {
    if (!src) {
      toast.error("Por favor, envie uma imagem.");
      return;
    }
    if (!caption.trim()) {
      toast.error("Por favor, insira uma legenda.");
      return;
    }
    onAdd({ src, caption: caption.trim(), span });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-display text-xl">Cadastrar Nova Imagem</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          {/* Dropzone de upload */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Foto do Cliente</span>
            <div 
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
            >
              {src ? (
                <>
                  <img src={src} alt="" className="h-full w-full object-cover animate-fade-in" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white font-bold">Alterar foto</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground/60 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-foreground/80">{uploading ? "Enviando arquivo..." : "Clique para selecionar"}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">Formatos aceitos: JPG, PNG, WEBP</span>
                </>
              )}
            </div>
            <input 
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legenda / Identificação</label>
            <input 
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1.5"
              placeholder="Ex: Mariana · Blusa Linho"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disposição na Grade</label>
            <select
              value={span}
              onChange={(e) => setSpan(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1.5"
            >
              <option value="">Tamanho Padrão (1x1)</option>
              <option value="md:row-span-2">Destaque Vertical Duplo (1x2)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2.5 border-t border-border pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[40px] inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Salvar Imagem
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTestimonialModal({
  onClose,
  onAdd
}: {
  onClose: () => void;
  onAdd: (item: { quote: string; name: string; role: string }) => void;
}) {
  const [quote, setQuote] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const handleSave = () => {
    if (!quote.trim()) {
      toast.error("Por favor, digite o depoimento.");
      return;
    }
    if (!name.trim()) {
      toast.error("Por favor, insira o nome da cliente.");
      return;
    }
    onAdd({ quote: quote.trim(), name: name.trim(), role: role.trim() || "Cliente" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-display text-xl">Cadastrar Novo Depoimento</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Depoimento (Citação do Cliente)</label>
            <textarea
              rows={4}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1.5 resize-none"
              placeholder="Ex: O acabamento é maravilhoso, caimento impecável. Super recomendo!"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome do Cliente</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1.5"
              placeholder="Ex: Beatriz Lima"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ocupação / Cargo (Opcional)</label>
            <input 
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1.5"
              placeholder="Ex: Cliente Varejo ou Sócia da Solaris"
            />
          </div>
        </div>

        <div className="flex gap-2.5 border-t border-border pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[40px] inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Salvar Depoimento
          </button>
        </div>
      </div>
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

  const isWide = field.type === "image" && (
    field.key.includes("hero") || 
    field.key.includes("about") || 
    field.key.includes("logo") ||
    field.key.includes("signature")
  );

  if (field.type === "image") {
    return (
      <div className={`space-y-2 ${isWide ? "md:col-span-2" : ""}`}>
        <label className="block text-xs font-semibold text-foreground/80 tracking-wide">{field.label}</label>
        
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-background/50 shadow-inner">
          {value ? (
            <div className="relative group h-14 w-14 rounded-lg overflow-hidden border border-border shadow-sm bg-zinc-100 flex items-center justify-center">
              <img src={value} alt="" className="h-full w-full object-contain" />
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
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-60"
              >
                <Upload className="h-3 w-3" /> {uploading ? "Carregando..." : "Escolher Arquivo"}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="text-xs text-red-500 hover:text-red-600 font-semibold"
                >
                  Excluir
                </button>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground leading-normal">{field.hint || "PNG ou SVG com fundo transparente recomendado."}</span>
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
          placeholder="Ou cole uma URL direta da imagem..."
          className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-shadow"
        />
      </div>
    );
  }

  if (field.type === "color") {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-foreground/80 tracking-wide">{field.label}</label>
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-border shadow-sm flex items-center justify-center bg-zinc-100">
            <input
              type="color"
              value={value.startsWith("oklch") ? "#8c7263" : value} // Fallback hex para seletor nativo
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-[-4px] h-[48px] w-[48px] cursor-pointer"
            />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="HEX ou OKLCH"
            className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-shadow"
          />
        </div>
        {field.hint && <p className="text-[9px] text-muted-foreground leading-relaxed">{field.hint}</p>}
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
        {field.hint && <p className="text-[9px] text-muted-foreground leading-relaxed">{field.hint}</p>}
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
      {field.hint && <p className="text-[9px] text-muted-foreground leading-relaxed">{field.hint}</p>}
    </div>
  );
}

// Subcomponente de edicao para um item da Galeria
function GalleryItemEditor({
  idx,
  item,
  onUpdate,
  onDelete,
}: {
  idx: number;
  item: { src: string; caption: string; span?: string };
  onUpdate: (updated: { src: string; caption: string; span?: string }) => void;
  onDelete: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `gallery-item-${idx}-${Date.now()}.${ext}`;
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
    onUpdate({ ...item, src: data.publicUrl });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-background/50 shadow-sm relative group items-start sm:items-center">
      {/* Miniatura com Uploader */}
      <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
        {item.src ? (
          <img src={item.src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-muted-foreground">Sem Foto</span>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-[9px] text-white font-bold"
          >
            {uploading ? "Subindo..." : "Trocar"}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <div className="flex-1 w-full grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Legenda / Descrição</label>
          <input
            type="text"
            value={item.caption}
            onChange={(e) => onUpdate({ ...item, caption: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1"
            placeholder="Ex: Mariana · Blusa Linho"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Layout da Grade</label>
          <select
            value={item.span || ""}
            onChange={(e) => onUpdate({ ...item, span: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1"
          >
            <option value="">Retrato Simples (1x1)</option>
            <option value="md:row-span-2">Destaque Vertical Duplo (1x2)</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 sm:self-center self-end shrink-0"
        title="Excluir Imagem"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// Subcomponente de edicao para um depoimento de cliente
function TestimonialItemEditor({
  item,
  onUpdate,
  onDelete,
}: {
  item: { quote: string; name: string; role: string };
  onUpdate: (updated: { quote: string; name: string; role: string }) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background/50 shadow-sm relative group">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Depoimento</span>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50"
          title="Excluir Depoimento"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Depoimento (Citação)</label>
          <textarea
            value={item.quote}
            onChange={(e) => onUpdate({ ...item, quote: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1 min-h-[60px] resize-y"
            placeholder="Ex: O acabamento é maravilhoso, caimento perfeito!"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Nome do Cliente</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdate({ ...item, name: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1"
              placeholder="Ex: Beatriz Lima"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Ocupação / Empresa</label>
            <input
              type="text"
              value={item.role}
              onChange={(e) => onUpdate({ ...item, role: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary mt-1"
              placeholder="Ex: Cliente Varejo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

