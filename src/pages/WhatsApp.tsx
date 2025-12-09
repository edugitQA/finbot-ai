import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, ArrowDownCircle, ArrowUpCircle, HelpCircle, Phone, Calendar, Bot } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type WhatsAppMessage = Database["public"]["Tables"]["whatsapp_messages_log"]["Row"];

export default function WhatsApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages_log")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WhatsAppMessage[];
    },
  });

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = msg.raw_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.phone_number?.includes(searchTerm);
    const matchesType = filterType === "all" || msg.parsed_type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case "gasto":
        return <ArrowDownCircle className="w-4 h-4 text-destructive" />;
      case "ganho":
        return <ArrowUpCircle className="w-4 h-4 text-emerald-400" />;
      case "pergunta":
        return <HelpCircle className="w-4 h-4 text-primary" />;
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case "gasto":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Gasto</Badge>;
      case "ganho":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ganho</Badge>;
      case "pergunta":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pergunta</Badge>;
      default:
        return <Badge variant="secondary">Não identificado</Badge>;
    }
  };

  const stats = {
    total: messages.length,
    gastos: messages.filter((m) => m.parsed_type === "gasto").length,
    ganhos: messages.filter((m) => m.parsed_type === "ganho").length,
    perguntas: messages.filter((m) => m.parsed_type === "pergunta").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground">Histórico de mensagens e conversas</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <ArrowDownCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.gastos}</p>
                  <p className="text-sm text-muted-foreground">Gastos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ganhos}</p>
                  <p className="text-sm text-muted-foreground">Ganhos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.perguntas}</p>
                  <p className="text-sm text-muted-foreground">Perguntas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Messages List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Mensagens Recebidas</CardTitle>
              <CardDescription>Clique em uma mensagem para ver detalhes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar mensagem ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="gasto">Gastos</SelectItem>
                    <SelectItem value="ganho">Ganhos</SelectItem>
                    <SelectItem value="pergunta">Perguntas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message List */}
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma mensagem encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMessages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${
                          selectedMessage?.id === msg.id
                            ? "border-primary bg-primary/5"
                            : "border-border/50 bg-card/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getTypeIcon(msg.parsed_type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeBadge(msg.parsed_type)}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-sm truncate">{msg.raw_message}</p>
                            {msg.phone_number && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {msg.phone_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Details */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Detalhes da Conversa</CardTitle>
              <CardDescription>Visualize a mensagem e resposta da IA</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <div className="space-y-6">
                  {/* Message Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(selectedMessage.parsed_type)}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(selectedMessage.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {selectedMessage.phone_number && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{selectedMessage.phone_number}</span>
                      </div>
                    )}
                  </div>

                  {/* User Message */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Mensagem recebida:</p>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-sm">{selectedMessage.raw_message}</p>
                    </div>
                  </div>

                  {/* Parsed Data */}
                  {selectedMessage.parsed_data && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Dados extraídos:</p>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(selectedMessage.parsed_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* AI Response */}
                  {selectedMessage.response_sent && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Resposta da IA:
                      </p>
                      <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <p className="text-sm whitespace-pre-wrap">{selectedMessage.response_sent}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                  <p>Selecione uma mensagem para ver detalhes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
