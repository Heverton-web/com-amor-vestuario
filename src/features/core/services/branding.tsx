import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/features/core/integrations/supabase/client";

export type Branding = {
  brand_name: string;
  brand_suffix: string;
  tagline: string;
  logo_url: string | null;
  logo_landing_url: string | null;
  logo_loja_url: string | null;
  logo_recompensas_url: string | null;
  logo_recibos_url: string | null;
  primary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  about_title: string;
  about_text: string;
  about_image_url: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address_line1: string;
  address_line2: string;
  instagram_url: string;
  facebook_url: string;
  instagram_handle: string;
  hours_weekday: string;
  hours_saturday: string;
  hours_sunday: string;
  cta_shop_label: string;
  cta_shop_url: string;
  cta_contact_label: string;
  cta_footer_shop_label: string;
  cta_footer_shop_url: string;
  issuer_legal_name: string;
  issuer_doc: string;
  issuer_address: string;
  issuer_city: string;
  signature_url: string | null;
  // Loja de Recompensas
  points_per_real: number;          // R$ por ponto (default 10)
  redemption_days_default: number;  // validade do resgate em dias
  rewards_label: string;            // nome da página pública
  n8n_rewards_webhook: string;      // webhook n8n para WhatsApp (mock se vazio)
  custom_palettes?: {
    name: string;
    primary: string;
    accent: string;
    background: string;
    foreground: string;
  }[];
};

export const DEFAULT_BRANDING: Branding = {
  brand_name: "Com Amor",
  brand_suffix: "vestuário",
  tagline: "feito à mão, com afeto",
  logo_url: null,
  logo_landing_url: null,
  logo_loja_url: null,
  logo_recompensas_url: null,
  logo_recibos_url: null,
  primary_color: "oklch(0.55 0.16 38)",
  accent_color: "oklch(0.88 0.06 38)",
  background_color: "oklch(0.972 0.018 80)",
  foreground_color: "oklch(0.255 0.035 45)",
  hero_title: "Roupa que veste história, não só o corpo.",
  hero_subtitle:
    "Peças autorais, coleções de atacado e fardamento corporativo costurados com cuidado de quem ama o ofício.",
  hero_image_url: null,
  about_title:
    "Uma pequena confecção com olhar grande sobre o que veste você.",
  about_text:
    "A Com Amor Vestuário nasceu numa sala pequena, com uma máquina, três cores de linha e muita vontade de fazer roupa que durasse mais que uma estação.",
  about_image_url: null,
  phone: "(00) 0 0000-0000",
  whatsapp: "5599999999999",
  email: "contato@comamor.com",
  address_line1: "Rua das Acácias, 142",
  address_line2: "Centro — Sua Cidade, BR",
  instagram_url: "https://instagram.com",
  facebook_url: "https://facebook.com",
  instagram_handle: "@comamorvestuario",
  hours_weekday: "09:00 — 18:00",
  hours_saturday: "09:00 — 13:00",
  hours_sunday: "Fechado",
  cta_shop_label: "Compre aqui",
  cta_shop_url: "/loja",
  cta_contact_label: "Fale conosco",
  cta_footer_shop_label: "Loja",
  cta_footer_shop_url: "/loja",
  issuer_legal_name: "",
  issuer_doc: "",
  issuer_address: "",
  issuer_city: "",
  signature_url: null,
  points_per_real: 10,
  redemption_days_default: 30,
  rewards_label: "Loja de Recompensas",
  n8n_rewards_webhook: "",
  custom_palettes: [],
};

type Ctx = {
  branding: Branding;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (next: Partial<Branding>) => Promise<{ error: string | null }>;
};

const BrandingCtx = createContext<Ctx | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: number) => {
            maybeSingle: () => Promise<{ data: { data: Partial<Branding> } | null }>;
          };
        };
      };
    })
      .from("site_settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (data?.data) {
      setBranding({ ...DEFAULT_BRANDING, ...data.data });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Apply CSS variables live
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", branding.primary_color);
    root.style.setProperty("--ring", branding.primary_color);
    root.style.setProperty("--accent", branding.accent_color);
    root.style.setProperty("--background", branding.background_color);
    root.style.setProperty("--foreground", branding.foreground_color);
    root.style.setProperty("--ink", branding.foreground_color);
    root.style.setProperty("--cream", branding.background_color);
  }, [
    branding.primary_color,
    branding.accent_color,
    branding.background_color,
    branding.foreground_color,
  ]);

  const value = useMemo<Ctx>(
    () => ({
      branding,
      loading,
      refresh: load,
      save: async (next) => {
        const merged = { ...branding, ...next };
        const { error } = await (supabase as unknown as {
          from: (t: string) => {
            upsert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
          };
        })
          .from("site_settings")
          .upsert({ id: 1, data: merged, updated_at: new Date().toISOString() });
        if (error) return { error: error.message };
        setBranding(merged);
        return { error: null };
      },
    }),
    [branding, loading],
  );

  return (
    <BrandingCtx.Provider value={value}>{children}</BrandingCtx.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingCtx);
  if (!ctx) throw new Error("useBranding must be used inside BrandingProvider");
  return ctx;
}

