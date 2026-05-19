import { Heart } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";
import logo from "@/assets/logo-com-amor.png";
import { cn } from "@/features/core/utils/utils";

/**
 * Componente reutilizável de identidade visual da marca.
 * Padrão: Logo + "Com Amor" + Ambiente
 *
 * Exemplos:
 *  - ❤️ Com Amor  SITE
 *  - ❤️ Com Amor  LOJA
 *  - ❤️ Com Amor  CLUBE
 *  - ❤️ Com Amor  ADMIN
 *  - ❤️ Com Amor  DEV
 */

export type BrandEnvironment = "site" | "loja" | "clube" | "admin" | "super" | "dev";

interface BrandLogoProps {
  /** Ambiente atual exibido ao lado do nome */
  environment: BrandEnvironment;
  /** Classes extras do container */
  className?: string;
}

export function BrandLogo({ environment, className }: BrandLogoProps) {
  const { branding } = useBranding();

  return (
    <span className={cn("flex items-center gap-2", className)}>
      {branding.logo_url ? (
        <img
          src={branding.logo_url}
          alt={branding.brand_name}
          className="h-7 w-auto shrink-0 object-contain sm:h-8"
        />
      ) : (
        <img
          src={logo}
          alt={branding.brand_name}
          className="h-7 w-auto shrink-0 object-contain sm:h-8"
        />
      )}
      <span className="hidden font-display text-lg font-semibold tracking-tight text-foreground sm:inline sm:text-xl">
        {branding.brand_name}
      </span>
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {environment}
      </span>
    </span>
  );
}
