import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    // Test mode
    if (body.test) {
      console.log("Webhook test received");
      return new Response(JSON.stringify({ success: true, message: "Webhook is working!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Extract message from Evolution API payload
    const message = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text;
    const phoneNumber = body.data?.key?.remoteJid?.replace("@s.whatsapp.net", "") || null;
    const instanceName = body.instance || null;

    if (!message) {
      console.log("No message content found in webhook");
      return new Response(JSON.stringify({ success: true, message: "No message to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by phone number
    let userId: string | null = null;
    if (phoneNumber) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone_number", phoneNumber)
        .maybeSingle();
      
      userId = profile?.user_id || null;
    }

    // Parse message type and extract data
    const parsedResult = parseMessage(message);
    console.log("Parsed message:", parsedResult);

    // Log the message
    const { error: logError } = await supabase.from("whatsapp_messages_log").insert({
      user_id: userId,
      phone_number: phoneNumber,
      raw_message: message,
      parsed_type: parsedResult.type,
      parsed_data: parsedResult.data,
    });

    if (logError) {
      console.error("Error logging message:", logError);
    }

    // Process based on type
    let responseMessage = "";

    if (parsedResult.type === "gasto" && userId && parsedResult.data) {
      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        description: parsedResult.data.description,
        amount: parsedResult.data.amount,
        category: parsedResult.data.category || "Outros",
        payment_method: parsedResult.data.payment_method || "débito",
        source: "whatsapp",
      });

      if (!error) {
        responseMessage = `✅ Gasto registrado!\n💸 ${parsedResult.data.description}: R$ ${parsedResult.data.amount.toFixed(2)}`;
      } else {
        responseMessage = "❌ Erro ao registrar gasto. Tente novamente.";
        console.error("Error inserting expense:", error);
      }
    } else if (parsedResult.type === "ganho" && userId && parsedResult.data) {
      const { error } = await supabase.from("incomes").insert({
        user_id: userId,
        description: parsedResult.data.description,
        amount: parsedResult.data.amount,
        source: "whatsapp",
      });

      if (!error) {
        responseMessage = `✅ Ganho registrado!\n💰 ${parsedResult.data.description}: R$ ${parsedResult.data.amount.toFixed(2)}`;
      } else {
        responseMessage = "❌ Erro ao registrar ganho. Tente novamente.";
        console.error("Error inserting income:", error);
      }
    } else if (parsedResult.type === "pergunta" && userId) {
      // Handle question with AI
      responseMessage = await handleQuestion(supabase, userId, message);
    } else if (!userId) {
      responseMessage = "⚠️ Número não cadastrado. Acesse o FinBalance AI para vincular seu WhatsApp.";
    }

    // Send response via Evolution API if we have settings
    if (responseMessage && phoneNumber && instanceName) {
      await sendWhatsAppResponse(supabase, userId, phoneNumber, instanceName, responseMessage);
      
      // Update log with response
      await supabase
        .from("whatsapp_messages_log")
        .update({ response_sent: responseMessage })
        .eq("phone_number", phoneNumber)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    return new Response(JSON.stringify({ success: true, parsed: parsedResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface ParsedMessage {
  type: "gasto" | "ganho" | "pergunta" | null;
  data: {
    description: string;
    amount: number;
    category?: string;
    payment_method?: string;
  } | null;
}

function parseMessage(message: string): ParsedMessage {
  const lowerMessage = message.toLowerCase().trim();

  // Expense patterns
  const expensePatterns = [
    /^gastei\s+(?:r\$?\s*)?([\d,.]+)\s+(?:reais?\s+)?(?:no?|na|em|com)\s+(.+)$/i,
    /^(?:paguei|comprei)\s+(?:r\$?\s*)?([\d,.]+)\s+(?:reais?\s+)?(?:no?|na|em|com|de)\s+(.+)$/i,
    /^(.+)\s+(?:r\$?\s*)?([\d,.]+)\s*(?:reais?)?$/i,
  ];

  for (const pattern of expensePatterns) {
    const match = message.match(pattern);
    if (match) {
      let amount: number;
      let description: string;
      
      if (pattern.source.startsWith("^gastei") || pattern.source.startsWith("^(?:paguei")) {
        amount = parseAmount(match[1]);
        description = match[2].trim();
      } else {
        description = match[1].trim();
        amount = parseAmount(match[2]);
      }

      if (amount > 0) {
        const category = detectCategory(description);
        const paymentMethod = detectPaymentMethod(description);
        
        return {
          type: "gasto",
          data: { description, amount, category, payment_method: paymentMethod },
        };
      }
    }
  }

  // Income patterns
  const incomePatterns = [
    /^recebi\s+(?:r\$?\s*)?([\d,.]+)\s+(?:reais?\s+)?(?:de|do|da)?\s*(.+)$/i,
    /^ganhei\s+(?:r\$?\s*)?([\d,.]+)\s+(?:reais?\s+)?(?:de|do|da|com)?\s*(.+)$/i,
    /^entrou\s+(?:r\$?\s*)?([\d,.]+)\s+(?:reais?\s+)?(?:de|do|da)?\s*(.+)$/i,
  ];

  for (const pattern of incomePatterns) {
    const match = message.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      const description = match[2]?.trim() || "Receita";
      
      if (amount > 0) {
        return {
          type: "ganho",
          data: { description, amount },
        };
      }
    }
  }

  // Question patterns
  const questionKeywords = [
    "quanto", "qual", "como", "saldo", "fatura", "total", "gastei", 
    "sobrou", "economia", "balanço", "resumo", "relatório"
  ];

  if (questionKeywords.some(k => lowerMessage.includes(k)) && lowerMessage.includes("?")) {
    return { type: "pergunta", data: null };
  }

  return { type: null, data: null };
}

function parseAmount(str: string): number {
  const cleaned = str.replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function detectCategory(description: string): string {
  const lower = description.toLowerCase();
  
  if (/mercado|supermercado|feira|açougue|padaria|restaurante|lanche|comida|almoço|jantar|café/.test(lower)) {
    return "Alimentação";
  }
  if (/uber|99|taxi|ônibus|metrô|gasolina|combustível|estacionamento/.test(lower)) {
    return "Transporte";
  }
  if (/cinema|netflix|spotify|show|festa|bar|balada|entretenimento/.test(lower)) {
    return "Lazer";
  }
  if (/farmácia|médico|hospital|plano de saúde|remédio|consulta/.test(lower)) {
    return "Saúde";
  }
  if (/curso|livro|escola|faculdade|mensalidade/.test(lower)) {
    return "Educação";
  }
  if (/aluguel|condomínio|luz|água|gás|internet|iptu/.test(lower)) {
    return "Moradia";
  }
  if (/cartão|fatura|crédito/.test(lower)) {
    return "Cartão Crédito";
  }
  if (/conta fixa|mensalidade|assinatura/.test(lower)) {
    return "Fixo";
  }
  
  return "Gasto Variável";
}

function detectPaymentMethod(description: string): string {
  const lower = description.toLowerCase();
  
  if (/crédito|cartão de crédito/.test(lower)) return "crédito";
  if (/débito|cartão de débito/.test(lower)) return "débito";
  if (/pix/.test(lower)) return "pix";
  if (/dinheiro|cash|espécie/.test(lower)) return "dinheiro";
  if (/transferência|ted|doc/.test(lower)) return "transferência";
  
  return "débito";
}

async function handleQuestion(supabase: any, userId: string, question: string): Promise<string> {
  const lowerQuestion = question.toLowerCase();

  // Get current month data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  // Fetch expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  // Fetch incomes
  const { data: incomes } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const totalIncomes = (incomes || []).reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const balance = totalIncomes - totalExpenses;

  // Credit card expenses
  const creditCardExpenses = (expenses || [])
    .filter((e: any) => e.category === "Cartão Crédito" || e.payment_method === "crédito")
    .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  // Expenses by category
  const expensesByCategory: Record<string, number> = {};
  (expenses || []).forEach((e: any) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount);
  });

  // Generate response based on question type
  if (/fatura|cartão|crédito/.test(lowerQuestion)) {
    return `💳 *Fatura do Cartão (${now.toLocaleDateString("pt-BR", { month: "long" })})*\n\nTotal: R$ ${creditCardExpenses.toFixed(2)}\n\n${creditCardExpenses > 0 ? "Lembre-se de pagar em dia! 📅" : "Nenhum gasto no cartão este mês! 🎉"}`;
  }

  if (/saldo|sobrou|tenho/.test(lowerQuestion)) {
    const emoji = balance >= 0 ? "💚" : "🔴";
    return `${emoji} *Seu Saldo Atual*\n\n💰 Ganhos: R$ ${totalIncomes.toFixed(2)}\n💸 Gastos: R$ ${totalExpenses.toFixed(2)}\n━━━━━━━━━━━\n${balance >= 0 ? "✅" : "⚠️"} Saldo: R$ ${balance.toFixed(2)}`;
  }

  if (/gastei|total.*gasto|quanto.*gast/.test(lowerQuestion)) {
    let categoryBreakdown = "";
    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    sortedCategories.forEach(([cat, amount]) => {
      categoryBreakdown += `\n• ${cat}: R$ ${amount.toFixed(2)}`;
    });

    return `💸 *Gastos de ${now.toLocaleDateString("pt-BR", { month: "long" })}*\n\nTotal: R$ ${totalExpenses.toFixed(2)}\n\n📊 Por categoria:${categoryBreakdown}`;
  }

  if (/resumo|balanço|relatório/.test(lowerQuestion)) {
    const healthEmoji = balance >= totalIncomes * 0.2 ? "🟢" : balance >= 0 ? "🟡" : "🔴";
    
    return `📊 *Resumo Financeiro - ${now.toLocaleDateString("pt-BR", { month: "long" })}*\n\n💰 Receitas: R$ ${totalIncomes.toFixed(2)}\n💸 Despesas: R$ ${totalExpenses.toFixed(2)}\n💳 Cartão: R$ ${creditCardExpenses.toFixed(2)}\n━━━━━━━━━━━\n💵 Saldo: R$ ${balance.toFixed(2)}\n${healthEmoji} Saúde Financeira`;
  }

  // Default response
  return `📊 *Resumo Rápido*\n\n💰 Ganhos: R$ ${totalIncomes.toFixed(2)}\n💸 Gastos: R$ ${totalExpenses.toFixed(2)}\n💵 Saldo: R$ ${balance.toFixed(2)}\n\n💡 Pergunte sobre:\n• "Quanto gastei esse mês?"\n• "Qual minha fatura do cartão?"\n• "Qual meu saldo atual?"`;
}

async function sendWhatsAppResponse(
  supabase: any,
  userId: string | null,
  phoneNumber: string,
  instanceName: string,
  message: string
): Promise<void> {
  if (!userId) return;

  const { data: settings } = await supabase
    .from("whatsapp_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings?.evolution_api_url || !settings?.evolution_api_key) {
    console.log("WhatsApp settings not configured for user");
    return;
  }

  try {
    const response = await fetch(`${settings.evolution_api_url}/message/sendText/${settings.instance_name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": settings.evolution_api_key,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
      }),
    });

    if (!response.ok) {
      console.error("Error sending WhatsApp message:", await response.text());
    } else {
      console.log("WhatsApp response sent successfully");
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}
