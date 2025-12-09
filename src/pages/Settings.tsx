import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Settings2, Zap, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type WhatsAppSettings = Database["public"]["Tables"]["whatsapp_settings"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Settings() {
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);

  const [whatsappForm, setWhatsappForm] = useState({
    evolution_api_url: "",
    evolution_api_key: "",
    instance_name: "",
  });

  const [aiTone, setAiTone] = useState("friendly");

  const { data: whatsappSettings } = useQuery({
    queryKey: ["whatsapp-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("whatsapp_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as WhatsAppSettings | null;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
  });

  useEffect(() => {
    if (whatsappSettings) {
      setWhatsappForm({
        evolution_api_url: whatsappSettings.evolution_api_url || "",
        evolution_api_key: whatsappSettings.evolution_api_key || "",
        instance_name: whatsappSettings.instance_name || "",
      });
    }
  }, [whatsappSettings]);

  useEffect(() => {
    if (profile?.ai_tone) {
      setAiTone(profile.ai_tone);
    }
  }, [profile]);

  const saveWhatsAppMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (whatsappSettings) {
        const { error } = await supabase
          .from("whatsapp_settings")
          .update({
            evolution_api_url: whatsappForm.evolution_api_url,
            evolution_api_key: whatsappForm.evolution_api_key,
            instance_name: whatsappForm.instance_name,
          })
          .eq("id", whatsappSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_settings")
          .insert({
            user_id: user.id,
            evolution_api_url: whatsappForm.evolution_api_url,
            evolution_api_key: whatsappForm.evolution_api_key,
            instance_name: whatsappForm.instance_name,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      toast({ title: "Configurações do WhatsApp salvas!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    },
  });

  const saveAiToneMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({ ai_tone: aiTone })
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Preferências de IA atualizadas!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar preferências", variant: "destructive" });
    },
  });

  const testWebhook = async () => {
    setIsTesting(true);
    try {
      const response = await supabase.functions.invoke("whatsapp-webhook", {
        body: { test: true },
      });
      
      if (response.error) throw response.error;
      toast({ title: "Webhook funcionando corretamente!" });
    } catch (error) {
      toast({ title: "Erro ao testar webhook", variant: "destructive" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Configure integrações e preferências</p>
        </div>

        {/* WhatsApp Integration */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <CardTitle>Integração WhatsApp</CardTitle>
                  <CardDescription>Configure a Evolution API para receber mensagens</CardDescription>
                </div>
              </div>
              <Badge variant={whatsappSettings?.is_connected ? "default" : "secondary"} className="gap-1">
                {whatsappSettings?.is_connected ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Conectado
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Desconectado
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api_url">URL da Evolution API</Label>
                <Input
                  id="api_url"
                  value={whatsappForm.evolution_api_url}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, evolution_api_url: e.target.value })}
                  placeholder="https://sua-api.exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={whatsappForm.evolution_api_key}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, evolution_api_key: e.target.value })}
                  placeholder="Sua chave de API"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instance">Nome da Instância</Label>
              <Input
                id="instance"
                value={whatsappForm.instance_name}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, instance_name: e.target.value })}
                placeholder="finbalance"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveWhatsAppMutation.mutate()} disabled={saveWhatsAppMutation.isPending}>
                {saveWhatsAppMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
              <Button variant="outline" onClick={testWebhook} disabled={isTesting}>
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Testar Webhook
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Preferences */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Preferências da IA</CardTitle>
                <CardDescription>Configure como a IA responde suas perguntas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tom das Respostas</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">😊 Amigável e casual</SelectItem>
                  <SelectItem value="professional">💼 Profissional e direto</SelectItem>
                  <SelectItem value="detailed">📊 Detalhado e analítico</SelectItem>
                  <SelectItem value="motivational">🚀 Motivacional e encorajador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Define como a IA irá responder suas perguntas financeiras via WhatsApp
              </p>
            </div>
            <Button onClick={() => saveAiToneMutation.mutate()} disabled={saveAiToneMutation.isPending}>
              {saveAiToneMutation.isPending ? "Salvando..." : "Salvar Preferências"}
            </Button>
          </CardContent>
        </Card>

        {/* Webhook Info */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">URL do Webhook</CardTitle>
            <CardDescription>Configure este endpoint na sua Evolution API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm break-all">
              {import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Configure este URL como webhook de mensagens recebidas na sua instância da Evolution API.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
