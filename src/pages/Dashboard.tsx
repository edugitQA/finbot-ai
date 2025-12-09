import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { HealthIndicator } from "@/components/dashboard/HealthIndicator";
import { ExpensesByCategoryChart } from "@/components/dashboard/ExpensesByCategoryChart";
import { MonthlyEvolutionChart } from "@/components/dashboard/MonthlyEvolutionChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, TrendingDown, CreditCard } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ balance: 0, totalIncome: 0, totalExpenses: 0, creditCard: 0 });
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [expensesRes, incomesRes] = await Promise.all([
      supabase.from("expenses").select("*").eq("user_id", user.id),
      supabase.from("incomes").select("*").eq("user_id", user.id)
    ]);

    const expenses = expensesRes.data || [];
    const incomes = incomesRes.data || [];

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const creditCard = expenses.filter(e => e.category === "Cartão Crédito").reduce((sum, e) => sum + Number(e.amount), 0);

    setStats({ balance: totalIncome - totalExpenses, totalIncome, totalExpenses, creditCard });

    const categories = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    setCategoryData(Object.entries(categories).map(([name, value]) => ({ name, value })));

    const allTransactions = [
      ...expenses.map(e => ({ ...e, type: "expense" as const })),
      ...incomes.map(i => ({ ...i, type: "income" as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(allTransactions);

    setMonthlyData([
      { month: "Jan", expenses: 2400, income: 4000 },
      { month: "Fev", expenses: 2800, income: 4200 },
      { month: "Mar", expenses: 3200, income: 4500 },
    ]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral das suas finanças</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Saldo Atual" value={`R$ ${stats.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={<Wallet className="w-6 h-6" />} variant="balance" />
          <StatCard title="Total Ganhos" value={`R$ ${stats.totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={<TrendingUp className="w-6 h-6" />} variant="income" />
          <StatCard title="Total Gastos" value={`R$ ${stats.totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={<TrendingDown className="w-6 h-6" />} variant="expense" />
          <StatCard title="Fatura Cartão" value={`R$ ${stats.creditCard.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={<CreditCard className="w-6 h-6" />} />
        </div>

        <HealthIndicator balance={stats.balance} income={stats.totalIncome} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpensesByCategoryChart data={categoryData} />
          <MonthlyEvolutionChart data={monthlyData} />
        </div>

        <RecentTransactions transactions={transactions} />
      </div>
    </DashboardLayout>
  );
}
