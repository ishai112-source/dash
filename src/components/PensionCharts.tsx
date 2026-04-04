import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import type { FundEntry } from "./FundSection";

interface PensionChartsProps {
  entries: (FundEntry & { fundType?: string })[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(210 60% 50%)",
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(v);

const PensionCharts = ({ entries }: PensionChartsProps) => {
  const byOwner = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      if (!e.owner) return;
      map[e.owner] = (map[e.owner] || 0) + e.balance;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      const type = e.fundType || "אחר";
      map[type] = (map[type] || 0) + e.balance;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {["חלוקה לפי בעלים", "חלוקה לפי סוג קופה"].map((title) => (
          <Card key={title} className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle className="font-display text-xl">{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-16 text-sm">הוסף נתונים כדי לראות את הגרף</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-xl">חלוקה לפי בעלים</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byOwner} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {byOwner.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-xl">חלוקה לפי סוג קופה</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {byType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PensionCharts;
