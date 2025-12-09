import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, XCircle } from "lucide-react";

interface HealthIndicatorProps {
  balance: number;
  income: number;
}

export function HealthIndicator({ balance, income }: HealthIndicatorProps) {
  const ratio = income > 0 ? (balance / income) * 100 : 0;
  
  let status: "good" | "warning" | "danger";
  let label: string;
  let message: string;
  
  if (ratio >= 20) {
    status = "good";
    label = "Saudável";
    message = "Suas finanças estão em ótimo estado!";
  } else if (ratio >= 0) {
    status = "warning";
    label = "Atenção";
    message = "Considere reduzir alguns gastos.";
  } else {
    status = "danger";
    label = "Crítico";
    message = "Você está gastando mais do que ganha!";
  }

  const statusStyles = {
    good: {
      bg: "bg-success/10",
      border: "border-success/30",
      text: "text-success",
      icon: Shield,
      glow: "shadow-success/20",
    },
    warning: {
      bg: "bg-warning/10",
      border: "border-warning/30",
      text: "text-warning",
      icon: AlertTriangle,
      glow: "shadow-warning/20",
    },
    danger: {
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      text: "text-destructive",
      icon: XCircle,
      glow: "shadow-destructive/20",
    },
  };

  const styles = statusStyles[status];
  const Icon = styles.icon;

  return (
    <div className={cn(
      "glass-card p-6 animate-fade-in",
      styles.border,
      "shadow-lg",
      styles.glow
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex items-center justify-center w-14 h-14 rounded-xl",
          styles.bg
        )}>
          <Icon className={cn("w-7 h-7", styles.text)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={cn("health-indicator", `health-${status}`)} />
            <p className={cn("text-lg font-semibold font-heading", styles.text)}>
              {label}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {message}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-heading">
            {Math.abs(ratio).toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">
            da renda guardado
          </p>
        </div>
      </div>
    </div>
  );
}
