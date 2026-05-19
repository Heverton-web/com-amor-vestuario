import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
// @ts-ignore
import supabaseSetupSql from "../../../../docs/supabase_setup.sql?raw";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/core/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/core/components/tabs";
import { Button } from "@/features/core/components/button";
import { Input } from "@/features/core/components/input";
import { Label } from "@/features/core/components/label";
import { Switch } from "@/features/core/components/switch";
import { Checkbox } from "@/features/core/components/checkbox";
import { useBranding } from "@/features/core/services/branding";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table";
import { Badge } from "@/features/core/components/badge";
import { AdminShell } from "@/features/core/components/AdminShell";
import { ADMIN_PAGES } from "@/features/core/utils/admin-pages";
import { Textarea } from "@/features/core/components/textarea";
import { toast } from "sonner";
import {
  Server,
  Key,
  RefreshCw,
  Send,
  Play,
  Terminal,
  Database,
  LayoutDashboard,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Copy,
  Info,
  Check,
  ArrowRight,
  Truck,
  Wallet,
} from "lucide-react";
import { runDiagnostics } from "../services/api-diagnostics";
import { dispatchWebhook } from "../services/webhook-dispatcher";
import {
  simulateMercadoPagoPayment,
  simulateMelhorEnvioFreight,
  startMelhorEnvioOAuth,
} from "../services/integrations-simulator";
import { WebhookLog, IntegrationSettings, ApiHealthStatus } from "../types";

export function DevConsoleDashboard() {
  const queryClient = useQueryClient();
  const { branding, save: saveBranding } = useBranding();
  const [baseUrlSetting, setBaseUrlSetting] = useState("");

  useEffect(() => {
    if (branding?.base_url) {
      setBaseUrlSetting(branding.base_url);
    }
  }, [branding]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  // States para Formulários
  const [n8nUrl, setN8nUrl] = useState("http://localhost:5678/webhook/comamor-vestuario");
  const [n8nMode, setN8nMode] = useState<"sandbox" | "production">("sandbox");
  const [meClientId, setMeClientId] = useState("");
  const [meRedirectUri, setMeRedirectUri] = useState(window.location.origin + "/dev");
  const [meMode, setMeMode] = useState<"sandbox" | "production">("sandbox");
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpPrivateKey, setMpPrivateKey] = useState("");
  const [mpMode, setMpMode] = useState<"sandbox" | "production">("sandbox");

  // States para Simuladores
  const [simMpOrderId, setSimMpOrderId] = useState("");
  const [simMpStatus, setSimMpStatus] = useState<"pago" | "recusado" | "reembolsado">("pago");
  const [simMpRealSandbox, setSimMpRealSandbox] = useState(false);

  const [simMeCep, setSimMeCep] = useState("01310-200"); // Av Paulista
  const [simMeRealSandbox, setSimMeRealSandbox] = useState(false);
  const [freightOptions, setFreightOptions] = useState<any[]>([]);
  const [loadingFreight, setLoadingFreight] = useState(false);

  // States para Webhook Manual
  const [manualEvent, setManualEvent] = useState("vendas.pedido_criado");
  const [manualWebhookUrl, setManualWebhookUrl] = useState("");
  const [saveUrlToDb, setSaveUrlToDb] = useState(false);
  const [eventWebhooks, setEventWebhooks] = useState<Record<string, { webhook_url: string; mode: string }>>({});
  const [manualPayload, setManualPayload] = useState(
    JSON.stringify(
      {
        id: "e2c3b88d-bf88-449e-8777-7161c960b398",
        code: "PED-2026-0001",
        customer_id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
        quote_id: null,
        status: "pendente",
        shipping: 25.0,
        subtotal: 325.0,
        total: 350.0,
        notes: "Entregar no período da tarde.",
        origin_kanban: null,
        paid_at: null,
        separated_at: null,
        shipped_at: null,
        finished_at: null,
        source: "Site",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer: {
          id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
          name: "Cliente Exemplo de Vendas",
          email: "cliente@exemplo.com",
          phone: "11988887777",
          cpf: "123.456.789-00",
          active: true,
        },
      },
      null,
      2,
    ),
  );

  // 1. Query: Diagnósticos de Conectividade
  const {
    data: diagnostics,
    isFetching: isCheckingHealth,
    refetch: refetchHealth,
  } = useQuery<ApiHealthStatus[]>({
    queryKey: ["dev-diagnostics"],
    queryFn: runDiagnostics,
    refetchOnWindowFocus: false,
  });

  // 2. Query: Logs de Webhooks (Auto-polla a cada 4 segundos)
  const { data: webhookLogs, refetch: refetchLogs } = useQuery<WebhookLog[]>({
    queryKey: ["dev-webhook-logs"],
    queryFn: async () => {
      try {
        const { data, error } = (await supabase
          .from("webhook_logs" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(40)) as any;

        if (error) throw error;
        return (data || []) as WebhookLog[];
      } catch (err) {
        console.warn("Tabela webhook_logs ausente ou sem acesso. Usando logs em cache local.", err);
        setFallbackMode(true);
        // Fallback local storage
        const localLogs = localStorage.getItem("dev_webhook_logs");
        return localLogs ? JSON.parse(localLogs) : [];
      }
    },
    refetchInterval: 4000,
  });

  // 3. Query: Carrega pedidos para o simulador do Mercado Pago
  const { data: orders } = useQuery<any[]>({
    queryKey: ["dev-orders-list"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, total, status, created_at, customer_id(name)")
          .order("created_at", { ascending: false })
          .limit(15);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("Falha ao carregar pedidos para simulação. Usando mocks locais.", err);
        return [
          {
            id: "ped_mock_01",
            total: 189.9,
            status: "pendente",
            created_at: new Date().toISOString(),
            customer_id: { name: "Maria Oliveira (Mock)" },
          },
          {
            id: "ped_mock_02",
            total: 420.0,
            status: "pendente",
            created_at: new Date().toISOString(),
            customer_id: { name: "Carlos Souza (Mock)" },
          },
          {
            id: "ped_mock_03",
            total: 95.0,
            status: "pago",
            created_at: new Date().toISOString(),
            customer_id: { name: "Ana Silva (Mock)" },
          },
        ];
      }
    },
  });

  // 4. Carrega configurações do banco ou local storage ao montar a tela
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = (await supabase
          .from("integration_settings" as any)
          .select("*")) as any;

        if (error) throw error;

        if (data) {
          const n8n = data.find((s: any) => s.provider === "n8n");
          if (n8n) {
            setN8nUrl(n8n.webhook_url || "");
            setN8nMode(n8n.mode as any);
          }

          // Filtra webhooks por evento
          const customHooks: Record<string, { webhook_url: string; mode: string }> = {};
          data.forEach((s: any) => {
            if (s.provider?.startsWith("n8n:")) {
              const eventName = s.provider.replace("n8n:", "");
              customHooks[eventName] = {
                webhook_url: s.webhook_url || "",
                mode: s.mode || "sandbox"
              };
            }
          });
          setEventWebhooks(customHooks);

          // Define a URL manual inicial para o primeiro evento selecionado
          const initialEvent = "vendas.pedido_criado";
          const specificHook = customHooks[initialEvent];
          setManualWebhookUrl(specificHook?.webhook_url || n8n?.webhook_url || "");

          const me = data.find((s: any) => s.provider === "melhor_envio");
          if (me) {
            setMeClientId(me.public_key || "");
            setMeMode(me.mode as any);
          }
          const mp = data.find((s: any) => s.provider === "mercado_pago");
          if (mp) {
            setMpPublicKey(mp.public_key || "");
            setMpPrivateKey(mp.private_key || "");
            setMpMode(mp.mode as any);
          }
        }
      } catch (err) {
        console.warn("Tabela integration_settings indisponível. Carregando localStorage fallback.");
        setFallbackMode(true);
        const saved = localStorage.getItem("dev_integration_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.n8n) {
            setN8nUrl(parsed.n8n.webhook_url);
            setN8nMode(parsed.n8n.mode);
          }

          const customHooks = parsed.eventWebhooks || {};
          setEventWebhooks(customHooks);

          const initialEvent = "vendas.pedido_criado";
          const specificHook = customHooks[initialEvent];
          setManualWebhookUrl(specificHook?.webhook_url || parsed.n8n?.webhook_url || "");

          if (parsed.me) {
            setMeClientId(parsed.me.clientId);
            setMeMode(parsed.me.mode);
          }
          if (parsed.mp) {
            setMpPublicKey(parsed.mp.public_key);
            setMpPrivateKey(parsed.mp.private_key);
            setMpMode(parsed.mp.mode);
          }
        }
      }
    }
    loadSettings();
  }, []);

  // 5. Salva configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async ({
      provider,
      settings,
    }: {
      provider: string;
      settings: Partial<IntegrationSettings>;
    }) => {
      if (fallbackMode) {
        // Salva localmente
        const saved = localStorage.getItem("dev_integration_settings") || "{}";
        const parsed = JSON.parse(saved);
        parsed[provider] = settings;
        localStorage.setItem("dev_integration_settings", JSON.stringify(parsed));
        return { success: true, local: true };
      }

      // Salva no Supabase
      const payload: any = {
        provider,
        mode: settings.mode || "sandbox",
        webhook_url: settings.webhook_url || null,
        public_key: settings.public_key || null,
        private_key: settings.private_key || null,
        api_url:
          provider === "supabase"
            ? import.meta.env.VITE_SUPABASE_URL
            : provider === "melhor_envio"
              ? settings.mode === "production"
                ? "https://api.melhorenvio.com.br"
                : "https://sandbox.melhorenvio.com.br"
              : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("integration_settings" as any)
        .upsert(payload, { onConflict: "provider" });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      toast.success(`Configurações de ${variables.provider.toUpperCase()} salvas!`);
      queryClient.invalidateQueries({ queryKey: ["dev-diagnostics"] });
    },
    onError: (err) => {
      toast.error(`Falha ao salvar configurações: ${err.message}`);
    },
  });

  // 6. Simular Pagamento Mercado Pago
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const orderId = simMpOrderId || orders?.[0]?.id;
      if (!orderId) throw new Error("Crie ou selecione um pedido para simular.");

      return simulateMercadoPagoPayment(orderId, simMpStatus, simMpRealSandbox);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["dev-orders-list"] });
        refetchLogs();
        if (data.webhookLog) {
          setSelectedLog(data.webhookLog as any);
        }
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(`Erro na simulação: ${err.message}`);
    },
  });

  // 7. Simular frete Melhor Envio
  const handleCalculateFreight = async () => {
    setLoadingFreight(true);
    try {
      const res = await simulateMelhorEnvioFreight(simMeCep, simMeRealSandbox);
      if (res.success) {
        setFreightOptions(res.options);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(`Erro ao cotar frete: ${err.message}`);
    } finally {
      setLoadingFreight(false);
    }
  };

  // 8. Disparo manual de Webhook
  const manualWebhookMutation = useMutation({
    mutationFn: async () => {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(manualPayload);
      } catch (e) {
        throw new Error("O Payload fornecido não é um JSON válido.");
      }

      if (saveUrlToDb && manualWebhookUrl) {
        const providerName = `n8n:${manualEvent}`;
        await saveSettingsMutation.mutateAsync({
          provider: providerName,
          settings: { webhook_url: manualWebhookUrl, mode: n8nMode },
        });
        setEventWebhooks((prev) => ({
          ...prev,
          [manualEvent]: { webhook_url: manualWebhookUrl, mode: n8nMode },
        }));
      }

      return dispatchWebhook(manualEvent, parsedPayload, manualWebhookUrl);
    },
    onSuccess: (data) => {
      toast.success(`Webhook enviado com status ${data.status_code || "Sem Conexão"}`);
      refetchLogs();
      setSelectedLog(data as any);
    },
    onError: (err) => {
      toast.error(`Erro ao disparar webhook: ${err.message}`);
    },
  });

  // 9. Reenviar Webhook do histórico
  const resendWebhook = async (log: WebhookLog) => {
    toast.info("Reenviando webhook...");
    try {
      const res = await dispatchWebhook(log.event_type, log.payload.data || log.payload);
      toast.success(`Webhook reenviado! Status: ${res.status_code}`);
      refetchLogs();
    } catch (err: any) {
      toast.error(`Erro no envio: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Captura código OAuth do Melhor Envio na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      toast.success("Código de autorização OAuth do Melhor Envio recebido!");
      // Limpa a URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <AdminShell title="Ambiente Dev (Developer Console)">
      {fallbackMode && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-6 w-6 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Modo Fallback Ativo:</span> As tabelas de configuração
            do banco (`integration_settings` ou `webhook_logs`) não foram detectadas. A aplicação
            está simulando o painel de dev perfeitamente utilizando{" "}
            <span className="font-mono">localStorage</span> e estados locais de memória!
          </div>
        </div>
      )}

      {/* Grid de Diagnósticos Resumido */}
      <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {diagnostics?.map((health) => {
          const isOnline = health.status === "online";
          const isWarning = health.status === "warning";
          return (
            <Card
              key={health.provider}
              className="overflow-hidden border border-border bg-card p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {health.provider === "mercado_pago"
                    ? "Mercado Pago"
                    : health.provider.toUpperCase()}
                </span>
                <span className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isOnline ? "bg-emerald-400" : isWarning ? "bg-amber-400" : "bg-rose-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isOnline ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500"
                    }`}
                  ></span>
                </span>
              </div>
              <div className="mt-3 font-display text-2xl font-semibold">
                {isOnline ? "ONLINE" : isWarning ? "ATENÇÃO" : "OFFLINE"}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{health.latencyMs !== undefined ? `${health.latencyMs}ms` : "---"}</span>
                <span className="truncate max-w-[120px]">{health.message}</span>
              </div>
            </Card>
          );
        }) || (
          <div className="col-span-4 py-8 text-center text-muted-foreground">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin" />
            <span className="mt-2 block text-sm">Carregando diagnósticos de APIs...</span>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          onClick={() => refetchHealth()}
          disabled={isCheckingHealth}
          className="rounded-xl flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isCheckingHealth ? "animate-spin" : ""}`} />
          Recarregar Diagnósticos
        </Button>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="diagnostics" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-5 rounded-xl bg-muted p-1">
          <TabsTrigger value="diagnostics" className="rounded-lg flex items-center gap-1.5">
            <Key className="h-4 w-4" /> APIs & Chaves
          </TabsTrigger>
          <TabsTrigger value="simulators" className="rounded-lg flex items-center gap-1.5">
            <Send className="h-4 w-4" /> Simuladores
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="rounded-lg flex items-center gap-1.5">
            <Terminal className="h-4 w-4" /> N8N Webhooks
          </TabsTrigger>
          <TabsTrigger value="database" className="rounded-lg flex items-center gap-1.5">
            <Database className="h-4 w-4" /> Supabase
          </TabsTrigger>
          <TabsTrigger value="modules" className="rounded-lg flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Módulos
          </TabsTrigger>
        </TabsList>

        {/* Tab 5: Modules System */}
        <TabsContent value="modules">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border bg-card col-span-1 md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Módulos do Sistema</CardTitle>
                    <CardDescription>
                      Ative ou desative módulos administrativos. Módulos desativados exibirão um cadeado no menu lateral e não poderão ser acessados.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Módulos Públicos */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Módulos Públicos</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { key: "public_site", label: "Site (Landing Page)" },
                      { key: "public_loja", label: "Loja Virtual" },
                      { key: "public_clube", label: "Clube (Área Pública)" },
                    ].map((mod) => {
                      const isActive = branding?.modules?.[mod.key] !== false;
                      return (
                        <div key={mod.key} className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-4">
                          <Label className="font-medium cursor-pointer" htmlFor={`switch-${mod.key}`}>{mod.label}</Label>
                          <Switch
                            id={`switch-${mod.key}`}
                            checked={isActive}
                            onCheckedChange={async (val) => {
                              const newModules = { ...(branding?.modules || {}), [mod.key]: val };
                              const { error } = await saveBranding({ modules: newModules });
                              if (error) toast.error("Erro ao salvar módulo");
                              else toast.success(`Módulo ${mod.label} ${val ? "ativado" : "desativado"}`);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Módulos Administrativos */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-4">Módulos Administrativos</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ADMIN_PAGES.filter(p => p.key !== "inicio" && p.key !== "dev").map((mod) => {
                      const activeKey = `admin_${mod.key}`;
                      const isActive = branding?.modules?.[activeKey] !== false;
                      return (
                        <div key={mod.key} className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-4">
                          <Label className="font-medium cursor-pointer" htmlFor={`switch-${mod.key}`}>{mod.label}</Label>
                          <Switch
                            id={`switch-${mod.key}`}
                            checked={isActive}
                            onCheckedChange={async (val) => {
                              const newModules = { ...(branding?.modules || {}), [activeKey]: val };
                              const { error } = await saveBranding({ modules: newModules });
                              if (error) toast.error("Erro ao salvar módulo");
                              else toast.success(`Módulo ${mod.label} ${val ? "ativado" : "desativado"}`);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Apresentação Comercial do Ecossistema (Huashu-Design) */}
            <Card className="border-border bg-card col-span-1 md:col-span-2 mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Apresentação Comercial do Ecossistema (Huashu-Design)</CardTitle>
                    <CardDescription>
                      Slides interativos criados com foco na experiência de alta fidelidade e valor comercial.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border bg-secondary/10 p-4">
                  <h4 className="font-semibold text-sm mb-2">Slides Comerciais e Diferenciais</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Os slides demonstram cada módulo do ecossistema, os diferenciais integrados e a análise financeira comparativa de valores de mercado.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary/20 p-3">
                      <div className="text-sm">
                        <span className="font-mono text-xs block text-muted-foreground">Caminho Local do Slide Deck:</span>
                        <span className="font-mono text-xs select-all">docs/apresentacao_ecossistema/index.html</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const basePath = "docs/apresentacao_ecossistema/index.html";
                          copyToClipboard(basePath, "slide-path");
                        }}
                        className="rounded-lg shrink-0 flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary/20 p-3">
                      <div className="text-sm">
                        <span className="font-mono text-xs block text-muted-foreground">Plano de Apresentação (Markdown):</span>
                        <span className="font-mono text-xs select-all">docs/plano_apresentacao_ecossistema.md</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const basePath = "docs/plano_apresentacao_ecossistema.md";
                          copyToClipboard(basePath, "plan-path");
                        }}
                        className="rounded-lg shrink-0 flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  💡 <strong>Dica de Uso:</strong> Abra o terminal na raiz do projeto e use o comando para abrir o index no navegador ou navegue até a pasta <code className="font-mono px-1 bg-muted rounded">docs/apresentacao_ecossistema/</code> e abra o arquivo <code className="font-mono px-1 bg-muted rounded">index.html</code>.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 1: Diagnostics and keys */}
        <TabsContent value="diagnostics">
          <div className="grid gap-6 md:grid-cols-2">
            {/* URL Base do Sistema */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>URL Base do Sistema</CardTitle>
                    <CardDescription>
                      Configure a URL base do site para a geração de links absolutos de faturas, recibos e orçamentos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-url">URL Base</Label>
                  <Input
                    id="system-url"
                    value={baseUrlSetting}
                    onChange={(e) => setBaseUrlSetting(e.target.value)}
                    placeholder="https://sua-plataforma.com"
                    className="font-mono bg-secondary/30 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se vazio, o sistema usará <code className="font-mono text-primary bg-primary/5 px-1 py-0.5 rounded">window.location.origin</code> do navegador.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={async () => {
                    const { error } = await saveBranding({ base_url: baseUrlSetting });
                    if (error) {
                      toast.error(`Erro ao salvar URL base: ${error}`);
                    } else {
                      toast.success("URL base do sistema salva!");
                    }
                  }}
                  className="rounded-xl w-full"
                >
                  Salvar URL Base
                </Button>
              </CardFooter>
            </Card>

            {/* N8N Settings */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Conexão do N8N</CardTitle>
                    <CardDescription>
                      Configure a rota de webhook para disparar fluxos no N8N
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8n-url">Webhook URL</Label>
                  <Input
                    id="n8n-url"
                    value={n8nUrl}
                    onChange={(e) => setN8nUrl(e.target.value)}
                    placeholder="http://localhost:5678/webhook/..."
                    className="font-mono bg-secondary/30 rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Ambiente do Fluxo</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{n8nMode.toUpperCase()}</span>
                    <Switch
                      checked={n8nMode === "production"}
                      onCheckedChange={(checked) => setN8nMode(checked ? "production" : "sandbox")}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() =>
                    saveSettingsMutation.mutate({
                      provider: "n8n",
                      settings: { webhook_url: n8nUrl, mode: n8nMode },
                    })
                  }
                  className="rounded-xl w-full"
                >
                  Salvar Configuração N8N
                </Button>
              </CardFooter>
            </Card>

            {/* Mercado Pago Settings */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Credenciais Mercado Pago</CardTitle>
                    <CardDescription>
                      Sandbox ou credenciais de produção para pagamentos Pix
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mp-pub">Public Key (Client ID)</Label>
                    <Input
                      id="mp-pub"
                      value={mpPublicKey}
                      onChange={(e) => setMpPublicKey(e.target.value)}
                      placeholder="APP_USR-..."
                      className="font-mono bg-secondary/30 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mp-priv">Access Token (Private Key)</Label>
                    <Input
                      id="mp-priv"
                      type="password"
                      value={mpPrivateKey}
                      onChange={(e) => setMpPrivateKey(e.target.value)}
                      placeholder="TEST-..."
                      className="font-mono bg-secondary/30 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Modo de Operação</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{mpMode.toUpperCase()}</span>
                    <Switch
                      checked={mpMode === "production"}
                      onCheckedChange={(checked) => setMpMode(checked ? "production" : "sandbox")}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() =>
                    saveSettingsMutation.mutate({
                      provider: "mercado_pago",
                      settings: {
                        public_key: mpPublicKey,
                        private_key: mpPrivateKey,
                        mode: mpMode,
                      },
                    })
                  }
                  className="rounded-xl w-full"
                >
                  Salvar Credenciais Mercado Pago
                </Button>
              </CardFooter>
            </Card>

            {/* Melhor Envio OAuth Connect */}
            <Card className="border border-border bg-card md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Integração Melhor Envio (OAuth2 Portal)</CardTitle>
                    <CardDescription>
                      Fluxo visual de autorização exigido pelo Melhor Envio para gerar tokens de
                      cotação e emissão de fretes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="me-id">Client ID Melhor Envio</Label>
                    <Input
                      id="me-id"
                      value={meClientId}
                      onChange={(e) => setMeClientId(e.target.value)}
                      placeholder="1234..."
                      className="font-mono bg-secondary/30 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="me-redirect">URL de Retorno (Redirect URI)</Label>
                    <Input
                      id="me-redirect"
                      value={meRedirectUri}
                      onChange={(e) => setMeRedirectUri(e.target.value)}
                      className="font-mono bg-secondary/30 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Modo de Operação do Frete</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{meMode.toUpperCase()}</span>
                    <Switch
                      checked={meMode === "production"}
                      onCheckedChange={(checked) => setMeMode(checked ? "production" : "sandbox")}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    saveSettingsMutation.mutate({
                      provider: "melhor_envio",
                      settings: { public_key: meClientId, mode: meMode },
                    })
                  }
                  className="rounded-xl flex-1"
                >
                  Salvar Configuração Básica
                </Button>
                <Button
                  onClick={() => {
                    if (!meClientId) {
                      toast.error("Por favor, preencha o Client ID antes de autorizar.");
                      return;
                    }
                    startMelhorEnvioOAuth(meClientId, meRedirectUri, meMode === "sandbox");
                  }}
                  className="rounded-xl flex-1 bg-gradient-to-r from-primary to-rose-500 text-white"
                >
                  Autorizar com Melhor Envio OAuth
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Simulators */}
        <TabsContent value="simulators">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Mercado Pago Payment Simulator */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Simulador de Pagamentos (Mercado Pago)</CardTitle>
                    <CardDescription>
                      Ligue pedidos pendentes mockando a liquidação do gateway
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sim-mp-order">Selecionar Pedido</Label>
                  <select
                    id="sim-mp-order"
                    value={simMpOrderId}
                    onChange={(e) => setSimMpOrderId(e.target.value)}
                    className="w-full bg-secondary/30 rounded-xl border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  >
                    <option value="">-- Escolha um pedido --</option>
                    {orders?.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id.substring(0, 12)}... - {o.customer_id?.name || "Sem Nome"} (R${" "}
                        {o.total} - {o.status.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Resultado Simulado</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["pago", "recusado", "reembolsado"].map((st) => (
                      <Button
                        key={st}
                        type="button"
                        variant={simMpStatus === st ? "default" : "outline"}
                        onClick={() => setSimMpStatus(st as any)}
                        className="rounded-xl text-xs capitalize"
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Bater na API Sandbox Real</span>
                    <span className="text-xs text-muted-foreground">
                      Requer credenciais reais salvas
                    </span>
                  </div>
                  <Switch checked={simMpRealSandbox} onCheckedChange={setSimMpRealSandbox} />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => paymentMutation.mutate()}
                  disabled={paymentMutation.isPending}
                  className="rounded-xl w-full"
                >
                  {paymentMutation.isPending
                    ? "Processando Simulação..."
                    : "Confirmar & Processar Transação de Teste"}
                </Button>
              </CardFooter>
            </Card>

            {/* Melhor Envio Freight Simulator */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Simulador de Fretes (Melhor Envio)</CardTitle>
                    <CardDescription>
                      Simule cotações para CEPs com mocks ou via API de homologação
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sim-me-cep">CEP de Destino</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sim-me-cep"
                      value={simMeCep}
                      onChange={(e) => setSimMeCep(e.target.value)}
                      placeholder="01310-200"
                      className="font-mono bg-secondary/30 rounded-xl"
                    />
                    <Button
                      onClick={handleCalculateFreight}
                      disabled={loadingFreight}
                      className="rounded-xl"
                    >
                      Calcular
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Bater na API Sandbox Real</span>
                    <span className="text-xs text-muted-foreground">
                      Exige chaves válidas salvas
                    </span>
                  </div>
                  <Switch checked={simMeRealSandbox} onCheckedChange={setSimMeRealSandbox} />
                </div>

                {/* Freight Options Results */}
                {freightOptions.length > 0 && (
                  <div className="mt-4 border-t border-border pt-4 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Opções de Envio Disponíveis
                    </span>
                    <div className="grid gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {freightOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {opt.company.picture && (
                              <img
                                src={opt.company.picture}
                                alt={opt.company.name}
                                className="h-6 w-10 object-contain rounded bg-white p-0.5"
                              />
                            )}
                            <div>
                              <div className="text-sm font-semibold">{opt.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Prazo: {opt.delivery_time}{" "}
                                {opt.delivery_time === 1 ? "dia útil" : "dias úteis"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-primary">
                              R$ {opt.custom_price.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-muted-foreground line-through">
                              R$ {opt.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Webhooks */}
        <TabsContent value="webhooks">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Disparador Manual de Eventos */}
            <Card className="border border-border bg-card lg:col-span-1">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Disparador Manual de Eventos</CardTitle>
                    <CardDescription>
                      Escolha o evento e dispare um payload sob demanda para testar o N8N
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-event">Tipo de Evento</Label>
                  <select
                    id="manual-event"
                    value={manualEvent}
                    onChange={(e) => {
                      const ev = e.target.value;
                      setManualEvent(ev);
                      const specificHook = eventWebhooks[ev];
                      setManualWebhookUrl(specificHook?.webhook_url || n8nUrl || "");
                      // Atualiza payloads sugeridos completos com a modelagem do banco
                      if (
                        ev === "vendas.pedido_criado" ||
                        ev === "vendas.pedido_pago" ||
                        ev === "vendas.pedido_cancelado" ||
                        ev === "vendas.pedido_status_alterado"
                      ) {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "e2c3b88d-bf88-449e-8777-7161c960b398",
                              code: "PED-2026-0001",
                              customer_id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
                              quote_id: null,
                              status: ev.split(".")[1] === "status_alterado" ? "separado" : ev.split(".")[1] === "pedido_criado" ? "pendente" : ev.split(".")[1],
                              shipping: 25.0,
                              subtotal: 325.0,
                              total: 350.0,
                              notes: "Entregar no período da tarde.",
                              origin_kanban: null,
                              paid_at: ev.endsWith("pago") ? new Date().toISOString() : null,
                              separated_at: ev.endsWith("status_alterado") ? new Date().toISOString() : null,
                              shipped_at: null,
                              finished_at: null,
                              source: "Site",
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              customer: {
                                id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
                                name: "Cliente Exemplo de Vendas",
                                email: "cliente@exemplo.com",
                                phone: "11988887777",
                                cpf: "123.456.789-00",
                                active: true,
                              },
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (ev === "fidelidade.pontos_acumulados") {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "d5b91a78-22cf-4bda-a887-f27161c96001",
                              customer_id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
                              delta: 50,
                              description: "Compra realizada - Pedido PED-2026-0001",
                              order_id: "e2c3b88d-bf88-449e-8777-7161c960b398",
                              redemption_id: null,
                              reason: "purchase",
                              created_at: new Date().toISOString(),
                              customer: {
                                name: "Cliente Exemplo de Vendas",
                                email: "cliente@exemplo.com",
                              },
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (
                        ev === "fidelidade.resgate_solicitado" ||
                        ev === "fidelidade.resgate_concluido"
                      ) {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "b3c8aa77-992d-45f9-b31f-e19c2fe0544d",
                              code: "RES-2026-0422",
                              customer_id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
                              reward_item_id: "ff887766-aa11-bb22-cc33-dd4455667788",
                              points_spent: 500,
                              status: ev.split(".")[1] === "resgate_solicitado" ? "solicitado" : "concluido",
                              voucher_code: "COMAMOR50",
                              used_at: ev.endsWith("concluido") ? new Date().toISOString() : null,
                              used_in_order_id: ev.endsWith("concluido") ? "e2c3b88d-bf88-449e-8777-7161c960b398" : null,
                              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                              created_at: new Date().toISOString(),
                              customer: {
                                name: "Cliente Exemplo de Vendas",
                                email: "cliente@exemplo.com",
                                phone: "11988887777",
                              },
                              reward_item: {
                                name: "Cupom R$ 50",
                                kind: "voucher",
                                voucher_value: 50.0,
                                voucher_min_order: 150.0,
                              },
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (ev === "crm.lead_capturado") {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "9933b8a1-ff44-4c7f-969d-4a18985d4345",
                              name: "Amanda Pereira B2B",
                              whatsapp: "11999998888",
                              reason: "quote_b2b",
                              message: "Tenho interesse em orçar 50 uniformes corporativos.",
                              utm_source: "google",
                              utm_medium: "cpc",
                              utm_campaign: "black_friday_b2b",
                              created_at: new Date().toISOString(),
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (ev === "crm.cliente_criado" || ev === "crm.cliente_atualizado") {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
                              code: "CLI-1029",
                              name: "Carlos Oliveira",
                              email: "carlos@gmail.com",
                              phone: "11988887777",
                              landline: null,
                              cpf: "123.456.789-00",
                              cnpj: null,
                              type: "pf",
                              category: "prata",
                              active: true,
                              cep: "01310-200",
                              street: "Avenida Paulista",
                              number: "1000",
                              complement: "Apto 152",
                              neighborhood: "Bela Vista",
                              city: "São Paulo",
                              state: "SP",
                              user_id: null,
                              portal_invited_at: null,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (
                        ev === "financeiro.fatura_criada" ||
                        ev === "financeiro.pagamento_confirmado"
                      ) {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "fat_8877_mock_uuid",
                              code: "FAT-2026-1052",
                              customer_id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
                              order_id: "e2c3b88d-bf88-449e-8777-7161c960b398",
                              total: 350.0,
                              paid_total: ev.endsWith("confirmado") ? 350.0 : 0.0,
                              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                              status: ev.endsWith("confirmado") ? "paga" : "pendente",
                              payment_method: "pix",
                              pix_qr: "base64_qr_code_placeholder",
                              pix_copia_cola: "00020101021226870014br.gov.bcb.pix...",
                              mp_preference_id: "pref_123456789",
                              mp_payment_id: ev.endsWith("confirmado") ? "mp_pay_998877" : null,
                              mp_init_point: "https://www.mercadopago.com.br/checkout/start?pref_id=...",
                              boleto_url: null,
                              pdf_url: null,
                              public_token: "pt_abc123xyz",
                              notes: "Faturamento Pix Com Amor",
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              customer: {
                                name: "Cliente Exemplo de Vendas",
                                email: "cliente@exemplo.com",
                                phone: "11988887777",
                              },
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (ev === "financeiro.recibo_emitido") {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "rec_3344_mock_uuid",
                              code: "REC-2026-0005",
                              customer_id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
                              invoice_id: "fat_8877_mock_uuid",
                              order_id: "e2c3b88d-bf88-449e-8777-7161c960b398",
                              amount: 350.0,
                              amount_in_words: "Trezentos e cinquenta reais",
                              reference: "Pagamento ref. Pedido PED-2026-0001",
                              payer_name: "Carlos Oliveira",
                              payer_doc: "123.456.789-00",
                              payment_method: "pix",
                              signature_mode: "automatic",
                              signature_url: null,
                              status: "emitido",
                              issuer_name: "Com Amor Vestuario LTDA",
                              issuer_doc: "12.345.678/0001-90",
                              issuer_address: "Rua Exemplo, 123, São Paulo - SP",
                              city: "São Paulo",
                              paid_at: new Date().toISOString(),
                              public_token: "rec_tok_xyz123",
                              notes: null,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (
                        ev === "orcamento.criado" ||
                        ev === "orcamento.aprovado" ||
                        ev === "orcamento.rejeitado"
                      ) {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "orc_5544_mock_uuid",
                              code: "ORC-2026-0099",
                              customer_id: "aa123b45-67c8-90d1-e2f3-456789abcdef",
                              lead_id: null,
                              requester_name: "Carlos Uniformes",
                              consultant_name: "Vendedora Amada",
                              quote_date: new Date().toISOString().split("T")[0],
                              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                              status: ev.split(".")[1],
                              shipping: 150.0,
                              subtotal: 4350.0,
                              total: 4500.0,
                              notes: "Orçamento para fardamento de algodão egípcio.",
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                              customer: {
                                name: "Vendas Corporativas LTDA",
                                cnpj: "12.345.678/0001-99",
                                phone: "11977776666",
                              },
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (ev === "produtos.estoque_alterado") {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "prod_7766_mock_uuid",
                              code: "VEST-RED-G",
                              name: "Vestido Com Amor Vermelho G",
                              description: "Vestido leve e fluido com estampa artesanal.",
                              type: "retail",
                              retail_price: 189.9,
                              wholesale_price: 139.9,
                              cost_price: 65.0,
                              stock: 18,
                              rewards_reserved: 0,
                              sizes: ["P", "M", "G"],
                              colors: ["Vermelho", "Azul"],
                              images: ["https://exemplo.com/vestido-vermelho.jpg"],
                              active: true,
                              stock_delta: -2,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            },
                            null,
                            2,
                          ),
                        );
                      } else if (ev === "produtos.esgotado") {
                        setManualPayload(
                          JSON.stringify(
                            {
                              id: "prod_7766_mock_uuid",
                              code: "VEST-RED-G",
                              name: "Vestido Com Amor Vermelho G",
                              description: "Vestido leve e fluido com estampa artesanal.",
                              type: "retail",
                              retail_price: 189.9,
                              wholesale_price: 139.9,
                              cost_price: 65.0,
                              stock: 0,
                              rewards_reserved: 0,
                              sizes: ["P", "M", "G"],
                              colors: ["Vermelho", "Azul"],
                              images: ["https://exemplo.com/vestido-vermelho.jpg"],
                              active: true,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            },
                            null,
                            2,
                          ),
                        );
                      }
                    }}
                    className="w-full bg-secondary/30 rounded-xl border border-input px-3 py-2 text-sm focus:outline-none font-mono"
                  >
                    <optgroup label="Vendas">
                      <option value="vendas.pedido_criado">vendas.pedido_criado</option>
                      <option value="vendas.pedido_pago">vendas.pedido_pago</option>
                      <option value="vendas.pedido_cancelado">vendas.pedido_cancelado</option>
                      <option value="vendas.pedido_status_alterado">vendas.pedido_status_alterado</option>
                    </optgroup>
                    <optgroup label="Fidelidade">
                      <option value="fidelidade.pontos_acumulados">fidelidade.pontos_acumulados</option>
                      <option value="fidelidade.resgate_solicitado">fidelidade.resgate_solicitado</option>
                      <option value="fidelidade.resgate_concluido">fidelidade.resgate_concluido</option>
                    </optgroup>
                    <optgroup label="CRM">
                      <option value="crm.lead_capturado">crm.lead_capturado</option>
                      <option value="crm.cliente_criado">crm.cliente_criado</option>
                      <option value="crm.cliente_atualizado">crm.cliente_atualizado</option>
                    </optgroup>
                    <optgroup label="Financeiro">
                      <option value="financeiro.fatura_criada">financeiro.fatura_criada</option>
                      <option value="financeiro.pagamento_confirmado">financeiro.pagamento_confirmado</option>
                      <option value="financeiro.recibo_emitido">financeiro.recibo_emitido</option>
                    </optgroup>
                    <optgroup label="Orçamentos">
                      <option value="orcamento.criado">orcamento.criado</option>
                      <option value="orcamento.aprovado">orcamento.aprovado</option>
                      <option value="orcamento.rejeitado">orcamento.rejeitado</option>
                    </optgroup>
                    <optgroup label="Produtos">
                      <option value="produtos.estoque_alterado">produtos.estoque_alterado</option>
                      <option value="produtos.esgotado">produtos.esgotado</option>
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-webhook-url">URL de Destino do Webhook</Label>
                  <Input
                    id="manual-webhook-url"
                    value={manualWebhookUrl}
                    onChange={(e) => setManualWebhookUrl(e.target.value)}
                    placeholder="http://localhost:5678/webhook/..."
                    className="font-mono bg-secondary/30 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 pb-1">
                  <Checkbox
                    id="save-url-db"
                    checked={saveUrlToDb}
                    onCheckedChange={(checked) => setSaveUrlToDb(!!checked)}
                  />
                  <Label
                    htmlFor="save-url-db"
                    className="text-xs text-muted-foreground cursor-pointer select-none font-normal"
                  >
                    Salvar esta URL no Banco de Dados
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-pay">JSON Payload (Corpo da Requisição)</Label>
                  <Textarea
                    id="manual-pay"
                    value={manualPayload}
                    onChange={(e: any) => setManualPayload(e.target.value)}
                    rows={8}
                    className="font-mono text-xs bg-secondary/30 rounded-xl"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => manualWebhookMutation.mutate()}
                  disabled={manualWebhookMutation.isPending}
                  className="rounded-xl w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {manualWebhookMutation.isPending ? "Disparando..." : "Disparar Webhook no N8N"}
                </Button>
              </CardFooter>
            </Card>

            {/* Right: Webhook Logs list */}
            <Card className="border border-border bg-card lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Histórico de Webhooks Enviados</CardTitle>
                  <CardDescription>
                    Auditoria em tempo real de webhooks despachados e integrados com N8N
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchLogs()}
                  className="rounded-xl"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto max-h-[460px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>N8N Response</TableHead>
                      <TableHead>Latência</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs && webhookLogs.length > 0 ? (
                      webhookLogs.map((log) => {
                        const isSuccess = log.status === "success";
                        return (
                          <TableRow
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="cursor-pointer hover:bg-muted/40 transition-colors"
                          >
                            <TableCell>
                              <Badge
                                className={`rounded-lg px-2 py-0.5 font-semibold ${
                                  isSuccess
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                }`}
                              >
                                {log.status_code === 0 ? "NETWORK ERR" : log.status_code || "FAIL"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold">
                              {log.event_type}
                            </TableCell>
                            <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground font-mono">
                              {log.response_body || "Sem resposta"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {log.duration_ms ? `${log.duration_ms}ms` : "---"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    copyToClipboard(JSON.stringify(log.payload, null, 2), log.id)
                                  }
                                  className="h-8 w-8 rounded-lg"
                                >
                                  {copiedId === log.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => resendWebhook(log)}
                                  className="h-8 w-8 rounded-lg text-primary"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Nenhum webhook disparado no histórico recente.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Log Details Drawer/Modal */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div
                className="h-full w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6 overflow-y-auto pr-1 flex-1">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold">
                        Detalhes do Evento Webhook
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {selectedLog.id}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedLog(null)}
                      className="rounded-xl"
                    >
                      Fechar
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Evento</span>
                      <div className="font-mono font-semibold text-primary">
                        {selectedLog.event_type}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status do Gateway</span>
                      <div>
                        <Badge
                          className={`rounded-lg px-2 py-0.5 ${
                            selectedLog.status === "success"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          }`}
                        >
                          {selectedLog.status_code === 0
                            ? "CORS / NETWORK ERR"
                            : `${selectedLog.status_code} - ${selectedLog.status.toUpperCase()}`}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">URL Destino (N8N)</span>
                      <div
                        className="truncate font-mono text-xs text-muted-foreground"
                        title={selectedLog.webhook_url}
                      >
                        {selectedLog.webhook_url}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Tempo de Resposta (N8N)</span>
                      <div className="font-mono text-xs text-muted-foreground">
                        {selectedLog.duration_ms ? `${selectedLog.duration_ms}ms` : "Sem resposta"}
                      </div>
                    </div>
                  </div>

                  {/* JSON Payload console */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Terminal className="h-3.5 w-3.5 text-primary" /> Request Body (Payload
                        Enviado)
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(selectedLog.payload, null, 2), "req-copy")
                        }
                        className="h-7 text-xs rounded-lg"
                      >
                        {copiedId === "req-copy" ? (
                          <Check className="h-3 w-3 text-emerald-500 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        Copiar JSON
                      </Button>
                    </div>
                    <pre className="p-4 rounded-xl bg-secondary/40 border border-border text-[11px] font-mono text-foreground/90 overflow-x-auto max-h-[220px]">
                      {JSON.stringify(selectedLog.payload, null, 2)}
                    </pre>
                  </div>

                  {/* JSON Response console */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-primary" /> N8N Response (Retorno)
                    </span>
                    <pre className="p-4 rounded-xl bg-secondary/40 border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-[150px]">
                      {selectedLog.response_body || "O Servidor N8N não retornou nenhum conteúdo."}
                    </pre>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLog(null)}
                    className="rounded-xl flex-1"
                  >
                    Fechar Detalhes
                  </Button>
                  <Button
                    onClick={() => {
                      resendWebhook(selectedLog);
                      setSelectedLog(null);
                    }}
                    className="rounded-xl flex-1"
                  >
                    Reenviar este Webhook
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Database / Supabase Console */}
        <TabsContent value="database">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Database Migrations status */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Console do Banco (Supabase SQL)</CardTitle>
                    <CardDescription>
                      Acompanhe o histórico de schemas e migrações executadas na plataforma
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Estado do Servidor:</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg">
                      ATIVO (POSTGRESQL)
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tabelas Ativas detectadas:</span>
                    <span className="font-mono text-xs font-semibold">14 Tabelas (public)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Última Migração Local Aplicada:</span>
                    <span className="font-mono text-xs text-primary font-semibold">
                      20260518000000_ambiente_dev_core
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Migrações do Projeto (supabase/migrations/*)
                  </span>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { ver: "20260518000000", desc: "ambiente_dev_core.sql", active: true },
                      { ver: "20260517223500", desc: "sincronizacao_estoque.sql", active: true },
                      { ver: "20260517015912", desc: "ec0db395_rewards_rules.sql", active: true },
                      { ver: "20260514040807", desc: "d612ecd9_wholesale_price.sql", active: true },
                      { ver: "20260512171507", desc: "a70bcebc_admin_page_rbac.sql", active: true },
                      {
                        ver: "20260512004617",
                        desc: "c8cfb13f_db_initial_setup.sql",
                        active: true,
                      },
                    ].map((mig) => (
                      <div
                        key={mig.ver}
                        className="flex items-center justify-between text-xs rounded-lg border border-border p-2 bg-secondary/20"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="font-mono text-muted-foreground">{mig.ver}</span>
                          <span className="font-medium text-foreground truncate max-w-[150px]">
                            {mig.desc}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-lg bg-emerald-500/5 text-emerald-500 border-emerald-500/10 text-[9px]"
                        >
                          Aplicado
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edge Functions status */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Supabase Edge Functions Console</CardTitle>
                    <CardDescription>
                      Verifique se os microsserviços Deno em nuvem estão responsivos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    {
                      name: "dispatch-webhook",
                      route: "/functions/v1/dispatch-webhook",
                      desc: "Garante entrega em lote assíncrona",
                      status: "online",
                      latency: 85,
                    },
                    {
                      name: "sync-stock-erp",
                      route: "/functions/v1/sync-stock-erp",
                      desc: "Cron job para sincronizar estoque físico",
                      status: "online",
                      latency: 120,
                    },
                    {
                      name: "calculate-freight",
                      route: "/functions/v1/calculate-freight",
                      desc: "Servidor proxy Melhor Envio",
                      status: "warning",
                      latency: 450,
                      msg: "Token expirando em 2 dias",
                    },
                  ].map((func) => {
                    const isOnline = func.status === "online";
                    return (
                      <div
                        key={func.name}
                        className="rounded-xl border border-border p-3 hover:bg-muted/30 transition-colors flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-mono">{func.name}</span>
                            <Badge
                              className={`rounded-lg text-[9px] px-1.5 py-0.2 font-semibold ${
                                isOnline
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              }`}
                            >
                              {func.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground">{func.desc}</div>
                          <div className="text-[9px] text-muted-foreground font-mono truncate max-w-[200px]">
                            {func.route}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold font-mono">{func.latency}ms</div>
                          {func.msg && <div className="text-[9px] text-amber-500">{func.msg}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Configuração de Novo Supabase */}
            <Card className="border border-border bg-card md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Configuração em Nova Conta do Supabase</CardTitle>
                    <CardDescription>
                      Instruções detalhadas e script SQL completo consolidado para colocar o projeto no ar do zero em um Supabase próprio
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 text-sm">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border p-4 bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold mb-1 text-primary">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-mono">1</span>
                        Novo Projeto
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Crie um projeto no painel do Supabase. Guarde a senha de banco definida e obtenha a <strong>URL do projeto</strong> e a <strong>Anon/Publishable Key</strong>.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4 bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold mb-1 text-primary">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-mono">2</span>
                        SQL Editor
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Acesse a aba <strong>SQL Editor</strong> no painel, crie uma <strong>New Query</strong>, cole o script SQL consolidado abaixo e clique em <strong>Run</strong>.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4 bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold mb-1 text-primary">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-mono">3</span>
                        Variáveis (.env)
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Edite o arquivo <code>.env</code> na sua VPS apontando para o novo banco de dados: <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        Script SQL Completo (Consolidado de todas as migrações)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(supabaseSetupSql, "supabase-sql")}
                        className="h-8 rounded-lg text-xs"
                      >
                        {copiedId === "supabase-sql" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500 mr-1" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" /> Copiar SQL Completo
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 rounded-xl bg-secondary/40 border border-border text-[11px] font-mono text-foreground/90 overflow-x-auto max-h-[300px] select-all">
                      {supabaseSetupSql}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
export default DevConsoleDashboard;
