import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/features/core/components/AdminShell";
import { useBranding, type Branding } from "@/features/core/services/branding";
import { supabase } from "@/features/core/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Save, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  component: BrandingPage,
});

type Field = {
  key: keyof Branding;
  label: string;
  type?: "text" | "textarea" | "color" | "image";
  hint?: string;
};

const sections: { title: string; fields: Field[] }[] = [
  {
    title: "Marca",
    fields: [
      { key: "brand_name", label: "Nome da marca" },
      { key: "brand_suffix", label: "Sufixo (ex: vestuário)" },
      { key: "tagline", label: "Tagline curta" },
      { key: "logo_url", label: "Logo (PNG/SVG transparente)", type: "image" },
    ],
  },
  {
    title: "Cores",
    fields: [
      { key: "primary_color", label: "Cor primária", type: "color", hint: "OKLCH ou HEX" },
      { key: "accent_color", label: "Cor de destaque", type: "color" },
      { key: "background_color", label: "Fundo", type: "color" },
      { key: "foreground_color", label: "Texto principal", type: "color" },
    ],
  },
  {
    title: "Hero (topo da landing)",
    fields: [
      { key: "hero_title", label: "Título", type: "textarea" },
      { key: "hero_subtitle", label: "Subtítulo", type: "textarea" },
      { key: "hero_image_url", label: "Imagem do hero", type: "image" },
    ],
  },
  {
    title: "Sobre",
    fields: [
      { key: "about_title", label: "Título", type: "textarea" },
      { key: "about_text", label: "Texto", type: "textarea" },
      { key: "about_image_url", label: "Imagem do atelier", type: "image" },
    ],
  },
  {
    title: "Contato",
    fields: [
      { key: "phone", label: "Telefone exibido" },
      { key: "whatsapp", label: "WhatsApp (somente números, com DDI)" },
      { key: "email", label: "E-mail" },
      { key: "address_line1", label: "Endereço — linha 1" },
      { key: "address_line2", label: "Endereço — linha 2" },
    ],
  },
  {
    title: "Redes sociais",
    fields: [
      { key: "instagram_url", label: "URL Instagram" },
      { key: "facebook_url", label: "URL Facebook" },
      { key: "instagram_handle", label: "@ exibido no rodapé" },
    ],
  },
  {
    title: "Horários",
    fields: [
      { key: "hours_weekday", label: "Segunda a sexta" },
      { key: "hours_saturday", label: "Sábado" },
      { key: "hours_sunday", label: "Domingo / feriados" },
    ],
  },
  {
    title: "Emissor de recibos & documentos",
    fields: [
      { key: "issuer_legal_name", label: "Razão social / nome completo do emissor" },
      { key: "issuer_doc", label: "CNPJ ou CPF do emissor" },
      { key: "issuer_address", label: "Endereço completo do emissor", type: "textarea" },
      { key: "issuer_city", label: "Cidade (aparece antes da data nos recibos)" },
      { key: "signature_url", label: "Assinatura digitalizada (PNG transparente, opcional)", type: "image" },
    ],
  },
  {
    title: "Botões da landing (CTAs)",
    fields: [
      { key: "cta_shop_label", label: "Texto do botão principal", hint: "Ex.: Compre aqui" },
      { key: "cta_shop_url", label: "Link do botão principal", hint: "Ex.: /loja  ou  https://..." },
      { key: "cta_contact_label", label: "Texto do botão de contato", hint: "Sempre abre o modal Fale Conosco" },
      { key: "cta_footer_shop_label", label: "Texto do link da loja no rodapé" },
      { key: "cta_footer_shop_url", label: "Link da loja no rodapé" },
    ],
  },
];

function BrandingPage() {
  const { branding, save } = useBranding();
  const [draft, setDraft] = useState<Branding>(branding);
  const [saving, setSaving] = useState(false);

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

  return (
    <AdminShell
      title="Branding & Conteúdo"
      actions={
        <>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" /> Ver landing
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar tudo"}
          </button>
        </>
      }
    >
      <p className="mb-6 text-sm text-muted-foreground">
        Tudo aqui aparece na sua landing page em tempo real. Cores aceitam
        formatos como <code>oklch(0.6 0.15 38)</code> ou <code>#c66</code>.
      </p>

      <div className="space-y-6">
        {sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-5 font-display text-xl">{s.title}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {s.fields.map((f) => (
                <FieldEditor
                  key={f.key as string}
                  field={f}
                  value={(draft[f.key] as string | null) ?? ""}
                  onChange={(v) => update(f.key, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}

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

  if (field.type === "image") {
    return (
      <div className={field.key.includes("hero") || field.key.includes("about") ? "md:col-span-2" : ""}>
        <label className="mb-1.5 block text-sm font-medium">{field.label}</label>
        <div className="flex items-center gap-3">
          {value ? (
            <img src={value} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              vazio
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> {uploading ? "..." : "Enviar"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-sm text-muted-foreground hover:text-destructive"
            >
              Remover
            </button>
          )}
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
          placeholder="Ou cole uma URL"
          className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
        />
      </div>
    );
  }

  if (field.type === "color") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium">{field.label}</label>
        <div className="flex items-center gap-2">
          <div
            className="h-10 w-10 shrink-0 rounded-lg border border-border"
            style={{ background: value }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
          />
        </div>
        {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="md:col-span-2">
        <label className="mb-1.5 block text-sm font-medium">{field.label}</label>
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{field.label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}

