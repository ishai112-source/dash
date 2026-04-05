import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export interface EmergencyFundData {
  balance: number;
  target: number;
  monthlyDeposit: number;
  monthlyExpenses?: number; // הוצאה חודשית ממוצעת
}

interface Props {
  data: EmergencyFundData;
  onChange: (data: EmergencyFundData) => void;
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

// סטטוס כיסוי: כמה חודשי מחיה מכוסים
function coverageStatus(balance: number, monthlyExpenses: number): {
  months: number;
  label: string;
  color: string;
  emoji: string;
} {
  if (monthlyExpenses <= 0) return { months: 0, label: "הזן הוצאה חודשית", color: "text-muted-foreground", emoji: "—" };
  const months = balance / monthlyExpenses;
  if (months < 3) return { months, label: `${months.toFixed(1)} חודשי מחיה — נמוך מדי`, color: "text-destructive", emoji: "🔴" };
  if (months < 6) return { months, label: `${months.toFixed(1)} חודשי מחיה`, color: "text-warning", emoji: "🟡" };
  return { months, label: `${months.toFixed(1)} חודשי מחיה`, color: "text-accent", emoji: "🟢" };
}

const EmergencyFundSection = ({ data, onChange }: Props) => {
  const rawProgress = data.target > 0 ? (data.balance / data.target) * 100 : 0;
  const progress = Math.min(100, rawProgress);
  const goalReached = data.target > 0 && data.balance >= data.target;
  const coverage = coverageStatus(data.balance, data.monthlyExpenses ?? 0);

  const rates = [3.64, 5, 7];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <CardTitle className="font-display text-xl">קרן חירום</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* שדות קלט */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">יתרה נוכחית ₪</Label>
            <Input
              type="number"
              min="0"
              value={data.balance || ""}
              onChange={(e) => onChange({ ...data, balance: Math.max(0, Number(e.target.value)) })}
            />
            {data.balance > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(data.balance)}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">הפקדה חודשית ₪</Label>
            <Input
              type="number"
              min="0"
              value={data.monthlyDeposit || ""}
              onChange={(e) => onChange({ ...data, monthlyDeposit: Math.max(0, Number(e.target.value)) })}
            />
            {data.monthlyDeposit > 0 && (
              <p className="text-xs text-muted-foreground">{formatCurrency(data.monthlyDeposit)} / חודש</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">יעד ₪</Label>
            <Input
              type="number"
              min="0"
              value={data.target || ""}
              onChange={(e) => onChange({ ...data, target: Math.max(0, Number(e.target.value)) })}
            />
            {data.target > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(data.target)}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">הוצאה חודשית ₪</Label>
            <Input
              type="number"
              min="0"
              value={data.monthlyExpenses || ""}
              onChange={(e) => onChange({ ...data, monthlyExpenses: Math.max(0, Number(e.target.value)) })}
            />
            {data.monthlyExpenses && data.monthlyExpenses > 0 && (
              <p className="text-xs text-muted-foreground">{formatCurrency(data.monthlyExpenses)} / חודש</p>
            )}
          </div>
        </div>

        {/* אינדיקטור כיסוי */}
        {data.monthlyExpenses && data.monthlyExpenses > 0 && (
          <div className="max-w-2xl rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">כיסוי קרן חירום</p>
              <p className={`text-sm font-bold ${coverage.color}`}>
                {coverage.emoji} {coverage.label}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>המלצה: 3–6 חודשים</p>
              <p>יעד מומלץ: {formatCurrency((data.monthlyExpenses ?? 0) * 6)}</p>
            </div>
          </div>
        )}

        {/* פס התקדמות */}
        {data.target > 0 && (
          <div className="max-w-2xl space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(data.balance)}</span>
              <span>{formatCurrency(data.target)}</span>
            </div>
            <Progress value={progress} className="h-4" />
            {goalReached ? (
              <p className="text-sm text-center text-accent font-semibold">✓ יעד הושג! ({rawProgress.toFixed(0)}% מהיעד)</p>
            ) : (
              <p className="text-sm text-center text-muted-foreground">{progress.toFixed(0)}% מהיעד</p>
            )}
          </div>
        )}

        {/* צפי הגעה ליעד */}
        {data.target > 0 && !goalReached && data.monthlyDeposit > 0 && (
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">צפי הגעה ליעד לפי תשואה:</p>
            <div className="grid grid-cols-3 gap-2">
              {rates.map((rate) => {
                const months = monthsToGoal(data.balance, data.monthlyDeposit, data.target, rate);
                const info = months !== null && months > 0 ? monthsToDate(months) : null;
                return (
                  <div key={rate} className="bg-muted rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">תשואה {rate}%</p>
                    {months === null ? (
                      <p className="text-xs font-bold text-destructive">לא מגיע</p>
                    ) : months === 0 ? (
                      <p className="text-xs font-bold text-accent">✓ הושג</p>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-foreground">{info!.date}</p>
                        <p className="text-xs text-muted-foreground">עוד {info!.duration}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyFundSection;
