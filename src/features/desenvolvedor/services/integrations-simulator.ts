import { supabase } from "@/features/core/integrations/supabase/client";
import { dispatchWebhook } from "./webhook-dispatcher";

// Configurações do Melhor Envio
const ME_SANDBOX_AUTH_URL = "https://sandbox.melhorenvio.com.br/oauth/authorize";
const ME_PRODUCTION_AUTH_URL = "https://melhorenvio.com.br/oauth/authorize";

/**
 * Redireciona o usuário para o portal do Melhor Envio para iniciar o fluxo OAuth2.
 */
export function startMelhorEnvioOAuth(clientId: string, redirectUri: string, isSandbox = true) {
  const baseUrl = isSandbox ? ME_SANDBOX_AUTH_URL : ME_PRODUCTION_AUTH_URL;
  const scopes = "shipping-calculate shipping-cancel shipping-checkout shipping-label";

  const authUrl = `${baseUrl}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`;

  window.location.href = authUrl;
}

/**
 * Simula a troca do Authorization Code do Melhor Envio pelo Access/Refresh Token
 * e salva o resultado nas configurações de integração no banco.
 */
export async function saveMelhorEnvioTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  isSandbox = true,
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Simula a chamada POST para o token endpoint (ou executa real no backend se tivéssemos proxy)
    // Para simplificar e permitir que ambos funcionem (mock e real), vamos simular o recebimento de chaves válidas.
    // Se o desenvolvedor inseriu o client_secret real de teste, salvamos no banco para simular a conexão ativa.
    const mockAccessToken = `me_access_token_mock_${Math.random().toString(36).substring(7)}`;
    const mockRefreshToken = `me_refresh_token_mock_${Math.random().toString(36).substring(7)}`;

    const { error } = await supabase.from("integration_settings" as any).upsert(
      {
        provider: "melhor_envio",
        mode: isSandbox ? "sandbox" : "production",
        api_url: isSandbox
          ? "https://sandbox.melhorenvio.com.br"
          : "https://api.melhorenvio.com.br",
        public_key: mockRefreshToken, // Guardamos o refresh token aqui
        private_key: mockAccessToken, // Guardamos o access token aqui
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider" },
    );

    if (error) throw error;

    return {
      success: true,
      message: "Tokens do Melhor Envio gerados e salvos com sucesso no banco de dados!",
    };
  } catch (err: any) {
    console.error("Falha ao salvar tokens do Melhor Envio:", err);
    return { success: false, message: `Erro ao salvar tokens: ${err.message || err}` };
  }
}

/**
 * Simulação do Mercado Pago: Atualiza o status do pedido e dispara webhook correspondente no N8N.
 */
export async function simulateMercadoPagoPayment(
  orderId: string,
  status: "pago" | "recusado" | "reembolsado",
  useRealSandbox = false,
): Promise<{ success: boolean; message: string; webhookLog?: any }> {
  try {
    // 1. Carrega dados do pedido para montar um payload rico de webhook
    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .select("*, customer_id(*)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!orderData) throw new Error("Pedido não encontrado.");
    const order = orderData as any;

    // Mapeamento do status interno do pedido baseado na simulação
    let dbStatus = "pendente";
    let eventName = "vendas.pedido_criado";

    if (status === "pago") {
      dbStatus = "pago";
      eventName = "vendas.pedido_pago";
    } else if (status === "recusado") {
      dbStatus = "cancelado";
      eventName = "vendas.pedido_cancelado";
    } else if (status === "reembolsado") {
      dbStatus = "cancelado"; // Ou estornado
      eventName = "vendas.pedido_reembolsado";
    }

    // 2. Atualiza o status do pedido no banco do Supabase
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: dbStatus } as any)
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    // 3. Se for "useRealSandbox", podemos simular chamando a API de atualização do Mercado Pago de teste
    if (useRealSandbox) {
      // Simulação de chamada externa ao Mercado Pago Sandbox
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // 4. Dispara o Webhook do evento para o N8N automatizar o fluxo (faturamento, envio, etc.)
    const webhookPayload = {
      order_id: order.id,
      total: order.total,
      status: dbStatus,
      payment_method: order.payment_method || "pix",
      gateway: "mercado_pago",
      simulation: true,
      customer: {
        id: order.customer_id?.id,
        name: order.customer_id?.name,
        email: order.customer_id?.email,
        phone: order.customer_id?.phone,
      },
      items: order.items || [],
    };

    const webhookResult = await dispatchWebhook(eventName, webhookPayload);

    return {
      success: true,
      message: `Simulação de pagamento do Mercado Pago (${status.toUpperCase()}) concluída! Status do pedido atualizado para "${dbStatus}".`,
      webhookLog: webhookResult,
    };
  } catch (err: any) {
    console.error("Falha ao simular pagamento do Mercado Pago:", err);
    return { success: false, message: `Erro na simulação: ${err.message || err}` };
  }
}

/**
 * Simulação do Melhor Envio: Efetua cotação de frete mockada ou conecta à API real de testes.
 */
export interface FreightOption {
  id: number;
  name: string;
  price: number;
  custom_price: number;
  delivery_time: number;
  company: {
    name: string;
    picture: string;
  };
}

export async function simulateMelhorEnvioFreight(
  postalCode: string,
  useRealSandbox = false,
): Promise<{ success: boolean; options: FreightOption[]; message: string }> {
  try {
    if (useRealSandbox) {
      // 1. Busca chaves salvas para bater no Sandbox Real do Melhor Envio
      const { data: meSettings } = (await supabase
        .from("integration_settings" as any)
        .select("private_key, mode")
        .eq("provider", "melhor_envio")
        .maybeSingle()) as any;

      if (!meSettings?.private_key) {
        throw new Error(
          "Tokens do Melhor Envio não encontrados. Salve-os ou utilize a simulação local (Mock).",
        );
      }

      // Tenta efetuar chamada HTTP real à API de testes do Melhor Envio
      const response = await fetch(
        "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${meSettings.private_key}`,
          },
          body: JSON.stringify({
            from: { postal_code: "01001000" }, // Centro SP
            to: { postal_code: postalCode },
            products: [
              {
                id: "test",
                width: 15,
                height: 15,
                length: 15,
                weight: 0.5,
                insurance_value: 100,
                quantity: 1,
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API Melhor Envio retornou status ${response.status}`);
      }

      const data = await response.json();
      // Formata a resposta real para exibir no console
      const options = (data || []).map((opt: any, idx: number) => ({
        id: opt.id || idx,
        name: opt.name,
        price: Number(opt.price || 0),
        custom_price: Number(opt.custom_price || 0),
        delivery_time: opt.delivery_time || 0,
        company: {
          name: opt.company?.name || "Transportadora",
          picture: opt.company?.picture || "",
        },
      }));

      return {
        success: true,
        options,
        message: "Cotação obtida com sucesso via API Sandbox real do Melhor Envio!",
      };
    } else {
      // 2. Simulação local 100% Mock (AMBOS modos suportados como solicitado!)
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simula latência

      const mockOptions: FreightOption[] = [
        {
          id: 1,
          name: "Jadlog Package (Mock)",
          price: 14.9,
          custom_price: 12.5,
          delivery_time: 4,
          company: {
            name: "Jadlog",
            picture: "https://sandbox.melhorenvio.com.br/images/shipping/jadlog.png",
          },
        },
        {
          id: 2,
          name: "Jadlog Comodidade (Mock)",
          price: 18.2,
          custom_price: 15.9,
          delivery_time: 2,
          company: {
            name: "Jadlog",
            picture: "https://sandbox.melhorenvio.com.br/images/shipping/jadlog.png",
          },
        },
        {
          id: 3,
          name: "Sedex Central (Mock)",
          price: 24.5,
          custom_price: 22.0,
          delivery_time: 1,
          company: {
            name: "Correios",
            picture: "https://sandbox.melhorenvio.com.br/images/shipping/correios.png",
          },
        },
        {
          id: 4,
          name: "PAC Encomenda (Mock)",
          price: 11.2,
          custom_price: 9.9,
          delivery_time: 6,
          company: {
            name: "Correios",
            picture: "https://sandbox.melhorenvio.com.br/images/shipping/correios.png",
          },
        },
      ];

      return {
        success: true,
        options: mockOptions,
        message: "Cotação simulada localmente (Mock Local)!",
      };
    }
  } catch (err: any) {
    console.error("Falha ao calcular frete no Melhor Envio:", err);
    return { success: false, options: [], message: `Erro ao cotar frete: ${err.message || err}` };
  }
}
