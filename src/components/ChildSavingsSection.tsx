import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Baby } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import CompoundInterestCalculator from "./CompoundInterestCalculator";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(v);

interface BarMitzvahSaving {
  balance: number;
  monthlyDeposit: number;
  target: number;
  targetDate: Date;
}

interface Age30Saving {
  balance: number;
  monthlyDeposit: number;
  targetYear: number;
}

export interface ChildData {
  name: string;
  birthDate: Date;
  barMitzvah?: BarMitzvahSaving;
  age30: Age30Saving;
}

export interface ChildSavingsData {
  children: ChildData[];
}

function monthsToGoal(balance: number, monthly: number, target: number, annualRate: number): number | null {
  if (balance >= target) return 0;
  if (monthly <= 0) return null;
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil((target - balance) / monthly);
  const n = Math.log((target * r + monthly) / (balance * r + monthly)) / Math.log(1 + r);
  return isFinite(n) && n > 0 ? Math.ceil(n) : null;
}

function monthsToDate(months: number): { date: string; duration: string } {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  const date = d.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const duration = years > 0 && rem > 0
    ? `${years} שנ' ${rem} ח'`
    : years > 0
    ? `${years} שנים`
    : `${rem} חודשים`;
  return { date, duration };
}

const projectBalance = (current: number, monthly: number, years: number, rate: number) => {
  const r = rate / 100 / 12;
  let balance = current;
  for (let m = 0; m < years * 12; m++) {
    balance = balance * (1 + r) + monthly;
  }
  return Math.round(balance);
};

const generateGrowthData = (current: number, monthly: number, startYear: number, endYear: number) => {
  const data = [];
  for (let y = startYear; y <= endYear; y++) {
    const years = y - startYear;
    data.push({
      year: y,
      "4%": projectBalance(current, monthly, years, 4),
      "6%": projectBalance(current, monthly, years, 6),
      "8%": projectBalance(current, monthly, years, 8),
    });
  }
  return data;
};

const BarMitzvahCard = ({ child, onUpdate }: { child: ChildData; onUpdate: (c: ChildData) => void }) => {
  const bm = child.barMitzvah;
  if (!bm) return null;
  const now = new Date();
  const yearsRemaining = Math.max(0, (bm.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const bmYear = bm.targetDate.getFullYear();
  const bmMonth = bm.targetDate.toLocaleDateString("he-IL", { month: "long" });

  return (
    <Card className="border-border bg-secondary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display">חיסכון בר מצווה</CardTitle>
          <span className="text-xs text-muted-foreground">{bmMonth} {bmYear} · עוד {yearsRemaining.toFixed(1)} שנים</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">יתרה נוכחית ₪</Label>
            <Input type="number" min="0" className="h-8" value={bm.balance || ""} onChange={(e) => onUpdate({ ...child, barMitzvah: { ...bm, balance: Math.max(0, Number(e.target.value)) } })} />
            {bm.balance > 0 && <p className="text-[10px] text-muted-foreground">{formatCurrency(bm.balance)}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">הפקדה חודשית ₪</Label>
            <Input type="number" min="0" className="h-8" value={bm.monthlyDeposit || ""} onChange={(e) => onUpdate({ ...child, barMitzvah: { ...bm, monthlyDeposit: Math.max(0, Number(e.target.value)) } })} />
            {bm.monthlyDeposit > 0 && <p className="text-[10px] text-muted-foreground">{formatCurrency(bm.monthlyDeposit)}</p>}
          </div>
        </div>

        {/* צפי ריאלי ביום הבר מצווה */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">צפי ריאלי ביום הבר מצווה:</p>
          <div className="grid grid-cols-3 gap-2">
            {[4, 6, 8].map((rate) => {
              const projected = projectBalance(bm.balance, bm.monthlyDeposit, yearsRemaining, rate);
              return (
                <div key={rate} className="bg-muted rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground">תשואה {rate}%</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(projected)}</p>
                </div>
              );
            })}
          </div>
        </div>
        <CompoundInterestCalculator
          defaultOneTime={bm.balance}
          defaultMonthly={bm.monthlyDeposit}
          defaultYears={Math.ceil(yearsRemaining)}
        />
      </CardContent>
    </Card>
  );
};

const Age30Card = ({ child, onUpdate }: { child: ChildData; onUpdate: (c: ChildData) => void }) => {
  const a30 = child.age30;
  const currentYear = new Date().getFullYear();
  const yearsToTarget = a30.targetYear - currentYear;
  const chartData = generateGrowthData(a30.balance, a30.monthlyDeposit, currentYear, a30.targetYear);

  return (
    <Card className="border-border bg-secondary">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">חיסכון עד גיל 30</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            יעד: שנת {a30.targetYear}
          </p>
          {yearsToTarget > 0 && (
            <p className="text-xs font-semibold text-muted-foreground">
              עוד {yearsToTarget} שנים
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">יתרה נוכחית ₪</Label>
            <Input type="number" min="0" className="h-8" value={a30.balance || ""} onChange={(e) => onUpdate({ ...child, age30: { ...a30, balance: Math.max(0, Number(e.target.value)) } })} />
            {a30.balance > 0 && <p className="text-[10px] text-muted-foreground">{formatCurrency(a30.balance)}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">הפקדה חודשית ₪</Label>
            <Input type="number" min="0" className="h-8" value={a30.monthlyDeposit || ""} onChange={(e) => onUpdate({ ...child, age30: { ...a30, monthlyDeposit: Math.max(0, Number(e.target.value)) } })} />
            {a30.monthlyDeposit > 0 && <p className="text-[10px] text-muted-foreground">{formatCurrency(a30.monthlyDeposit)}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[4, 6, 8].map((rate) => {
            const projected = projectBalance(a30.balance, a30.monthlyDeposit, yearsToTarget, rate);
            return (
              <div key={rate} className="bg-muted rounded-lg p-2">
                <p className="text-xs text-muted-foreground">תשואה {rate}%</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(projected)}</p>
              </div>
            );
          })}
        </div>
        {chartData.length > 1 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 22%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={11} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={11} tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220 20% 14%)", border: "1px solid hsl(220 16% 22%)", borderRadius: "8px", color: "hsl(210 40% 96%)" }} formatter={(value: number) => [formatCurrency(value), ""]} />
                <Legend />
                <Line type="monotone" dataKey="4%" stroke="hsl(210 100% 56%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="6%" stroke="hsl(160 70% 45%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="8%" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <CompoundInterestCalculator
          defaultOneTime={a30.balance}
          defaultMonthly={a30.monthlyDeposit}
          defaultYears={yearsToTarget}
        />
      </CardContent>
    </Card>
  );
};

interface ChildSavingsSectionProps {
  data: ChildSavingsData;
  onChange: (data: ChildSavingsData) => void;
}

const ChildSavingsSection = ({ data, onChange }: ChildSavingsSectionProps) => {
  const updateChild = (index: number, child: ChildData) => {
    const newChildren = [...data.children];
    newChildren[index] = child;
    onChange({ children: newChildren });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Baby className="h-5 w-5 text-warning" />
          <CardTitle className="font-display text-xl">חסכונות ילדים</CardTitle>
          <span className="text-sm text-muted-foreground mr-2">
            סה״כ: {formatCurrency(data.children.reduce((s, c) => s + (c.barMitzvah?.balance || 0) + c.age30.balance, 0))}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.children.map((child, i) => (
          <div key={child.name} className="space-y-3">
            <h3 className="text-lg font-bold font-display text-primary">{child.name}</h3>
            <div className={`grid ${child.barMitzvah ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} gap-4`}>
              {child.barMitzvah && <BarMitzvahCard child={child} onUpdate={(c) => updateChild(i, c)} />}
              <Age30Card child={child} onUpdate={(c) => updateChild(i, c)} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ChildSavingsSection;
