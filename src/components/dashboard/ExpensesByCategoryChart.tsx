import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryData {
  name: string;
  value: number;
}

interface ExpensesByCategoryChartProps {
  data: CategoryData[];
}

const COLORS = [
  "hsl(197, 100%, 50%)",  // Primary neon blue
  "hsl(142, 76%, 36%)",   // Success green
  "hsl(38, 92%, 50%)",    // Warning yellow
  "hsl(0, 84%, 60%)",     // Destructive red
  "hsl(280, 70%, 50%)",   // Purple
  "hsl(170, 80%, 40%)",   // Teal
  "hsl(30, 90%, 50%)",    // Orange
  "hsl(320, 70%, 50%)",   // Pink
  "hsl(200, 50%, 50%)",   // Light blue
  "hsl(60, 70%, 50%)",    // Lime
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 !bg-card/90">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-lg font-bold text-primary">
          R$ {payload[0].value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card variant="glass" className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum gasto registrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                paddingTop: "20px",
                fontSize: "12px"
              }}
              formatter={(value) => (
                <span className="text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
