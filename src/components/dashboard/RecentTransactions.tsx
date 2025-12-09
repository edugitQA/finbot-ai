import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: string;
  category?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Nenhuma transação registrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.slice(0, 5).map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              transaction.type === "income" 
                ? "bg-success/20" 
                : "bg-destructive/20"
            )}>
              {transaction.type === "income" ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {transaction.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(transaction.date), "dd MMM, yyyy", { locale: ptBR })}
                {transaction.category && ` • ${transaction.category}`}
              </p>
            </div>
            <p className={cn(
              "text-sm font-semibold",
              transaction.type === "income" ? "text-success" : "text-destructive"
            )}>
              {transaction.type === "income" ? "+" : "-"}
              R$ {transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
