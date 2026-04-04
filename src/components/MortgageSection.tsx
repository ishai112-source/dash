import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface MortgageData {
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  yearsRemaining: number;
}

interface MortgageSectionProps {
  data: MortgageData;
  onChange: (data: MortgageData) => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(v);

const generateProjection = (data: MortgageData) => {
  const points = [];
  const { balance, yearsRemaining, monthlyPayment } = data;
  if (balance <= 0 || yearsRemaining <= 0) return [];

  for (let year = 0; year <= yearsRemaining; year++) {
    const remaining = Math.max(0, balance - (monthlyPayment * 12 * year));
    points.push({ year: `שנה ${year}`, balance: Math.round(remaining) });
    if (remaining <= 0) break;
  }
  return points;
};

const MortgageSection = ({ data, onChange }: MortgageSectionProps) => {
  const chartData = generateProjection(data);

  const fields = [
    { key: "balance" as const, label: "יתרה נוכחית", prefix: "₪" },
    { key: "monthlyPayment" as const, label: "תשלום חודשי", prefix: "₪" },
    { key: "interestRate" as const, label: "ריבית ממוצעת (%)", prefix: "" },
    { key: "yearsRemaining" as const, label: "שנים שנותרו", prefix: "" },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-warning" />
          <CardTitle className="font-display text-xl">משכנתא</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fields.map(({ key, label, prefix }) => (
            <div key={key} className="space-y-2">
              <Label className="text-sm text-muted-foreground">{label}</Label>
              <Input
                type="number"
                step={key === "interestRate" ? "0.1" : "1"}
                value={data[key] || ""}
                onChange={(e) => onChange({ ...data, [key]: Number(e.target.value) })}
              />
              {data[key] > 0 && key !== "interestRate" && key !== "yearsRemaining" && (
                <p className="text-xs text-muted-foreground">{formatCurrency(data[key])}</p>
              )}
            </div>
          ))}
        </div>

        {chartData.length > 1 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 22%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={12} />
                <YAxis
                  stroke="hsl(215 20% 55%)"
                  fontSize={12}
                  tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 20% 14%)",
                    border: "1px solid hsl(220 16% 22%)",
                    borderRadius: "8px",
                    color: "hsl(210 40% 96%)",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "יתרה"]}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(38 92% 50%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MortgageSection;
