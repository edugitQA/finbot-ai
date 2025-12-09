import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "income" | "expense" | "balance";
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  variant = "default",
  className 
}: StatCardProps) {
  const variantStyles = {
    default: "border-border",
    income: "border-success/30 shadow-success/5",
    expense: "border-destructive/30 shadow-destructive/5",
    balance: "border-primary/30 shadow-primary/10",
  };

  const iconStyles = {
    default: "bg-secondary text-foreground",
    income: "bg-success/20 text-success",
    expense: "bg-destructive/20 text-destructive",
    balance: "bg-primary/20 text-primary",
  };

  return (
    <div className={cn(
      "glass-card p-6 animate-fade-in",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold font-heading tracking-tight",
            variant === "income" && "text-success",
            variant === "expense" && "text-destructive",
            variant === "balance" && "neon-text"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl",
          iconStyles[variant]
        )}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-destructive" />
          )}
          <span className={cn(
            "text-sm font-medium",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">vs. mês anterior</span>
        </div>
      )}
    </div>
  );
}
