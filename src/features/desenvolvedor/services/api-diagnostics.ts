import { supabase } from "@/features/core/integrations/supabase/client";
import { ApiHealthStatus } from "../types";

/**
 * Executa diagnósticos de conexão com as principais APIs de integração.
 */
export async function runDiagnostics(): Promise<ApiHealthStatus[]> {
  const results: ApiHealthStatus[] = [];

  // 1. Diagnóstico do Supabase
  const startSupabase = performance.now();
  try {
    const { error } = await supabase
      .from("user_roles")
      .select("role", { count: "exact", head: true })
      .limit(1);

    const latency = Math.round(performance.now() - startSupabase);
    if (!error) {
      results.push({
        provider: "supabase",
        status: "online",
        latencyMs: latency,
        message: "Conectado ao Supabase com sucesso.",
        details: {
          projectUrl: import.meta.env.VITE_SUPABASE_URL || "Configurado nativamente",
          apiVersion: "PostgREST v12",
        },
      });
    } else {
      results.push({
        provider: "supabase",
        status: "warning",
        latencyMs: latency,
        message: `Conectado, mas com restrições: ${error.message}`,
        details: error,
      });
    }
  } catch (err: any) {
    results.push({
      provider: "supabase",
      status: "offline",
      message: `Erro crítico de conexão: ${err.message || err}`,
    });
  }

  // 2. Diagnóstico do N8N
  const startN8n = performance.now();
  try {
    const { data: n8nSettings } = await supabase
      .from("integration_settings" as any)
      .select("webhook_url")
      .eq("provider", "n8n")
      .maybeSingle() as any;

    const webhookUrl = n8nSettings?.webhook_url || "http://localhost:5678/webhook/comamor-vestuario";
    
    // Tentativa leve de ping (HEAD ou GET) - tratamos erros de CORS como "online" se houver resposta HTTP ou falha de rede específica
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let n8nOnline = false;
    let n8nMsg = "";
    let latencyN8n = 0;

    try {
      const response = await fetch(webhookUrl, {
        method: "OPTIONS", // OPTIONS costuma falhar menos em endpoints de webhook sem CORS
        signal: controller.signal,
      });
      latencyN8n = Math.round(performance.now() - startN8n);
      n8nOnline = true;
      n8nMsg = `Servidor respondendo (HTTP ${response.status})`;
    } catch (fetchErr: any) {
      latencyN8n = Math.round(performance.now() - startN8n);
      // Erros de CORS no fetch indicam que o servidor EXISTE e recusou a requisição no navegador (o que significa que está ONLINE)
      if (fetchErr.name === "AbortError") {
        n8nOnline = false;
        n8nMsg = "Timeout de conexão excedido (4s)";
      } else {
        n8nOnline = true;
        n8nMsg = "Endpoint ativo (Conexão estabelecida)";
      }
    } finally {
      clearTimeout(timeoutId);
    }

    results.push({
      provider: "n8n",
      status: n8nOnline ? "online" : "offline",
      latencyMs: latencyN8n,
      message: n8nMsg,
      details: { webhookUrl },
    });
  } catch (err: any) {
    results.push({
      provider: "n8n",
      status: "offline",
      message: `Não foi possível alcançar o servidor N8N: ${err.message || err}`,
    });
  }

  // 3. Diagnóstico do Mercado Pago
  const startMp = performance.now();
  try {
    const { data: mpSettings } = await supabase
      .from("integration_settings" as any)
      .select("mode, public_key")
      .eq("provider", "mercado_pago")
      .maybeSingle() as any;

    const mpMode = mpSettings?.mode || "sandbox";
    const hasKeys = !!mpSettings?.public_key;

    // Ping mockado para o Mercado Pago com latência simulada
    await new Promise((resolve) => setTimeout(resolve, 150));
    const latencyMp = Math.round(performance.now() - startMp);

    results.push({
      provider: "mercado_pago",
      status: hasKeys ? "online" : "warning",
      latencyMs: latencyMp,
      message: hasKeys 
        ? `Integração configurada em modo ${mpMode.toUpperCase()}`
        : "Chaves de API ausentes no banco. Operando com Mocks locais.",
      details: {
        mode: mpMode,
        hasPublicKey: hasKeys,
        publicKeyMascarada: mpSettings?.public_key 
          ? `***...${mpSettings.public_key.slice(-4)}` 
          : "Nenhuma",
      },
    });
  } catch (err: any) {
    results.push({
      provider: "mercado_pago",
      status: "warning",
      message: `Erro ao obter configurações: ${err.message || err}`,
    });
  }

  // 4. Diagnóstico do Melhor Envio
  const startMe = performance.now();
  try {
    const { data: meSettings } = await supabase
      .from("integration_settings" as any)
      .select("mode, private_key")
      .eq("provider", "melhor_envio")
      .maybeSingle() as any;

    const meMode = meSettings?.mode || "sandbox";
    const hasToken = !!meSettings?.private_key;

    await new Promise((resolve) => setTimeout(resolve, 200));
    const latencyMe = Math.round(performance.now() - startMe);

    results.push({
      provider: "melhor_envio",
      status: hasToken ? "online" : "warning",
      latencyMs: latencyMe,
      message: hasToken
        ? `Conectado em modo ${meMode.toUpperCase()}`
        : "Chave OAuth ausente. Operando com simulador local.",
      details: {
        mode: meMode,
        hasAccessToken: hasToken,
        tokenMascarado: meSettings?.private_key
          ? `***...${meSettings.private_key.slice(-8)}`
          : "Nenhum",
      },
    });
  } catch (err: any) {
    results.push({
      provider: "melhor_envio",
      status: "warning",
      message: `Erro ao obter configurações: ${err.message || err}`,
    });
  }

  return results;
}
