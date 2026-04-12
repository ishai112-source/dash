import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Home, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import FormattedNumberInput from "@/components/ui/FormattedNumberInput";

export interface MortgageTrack {
  id: string;
  label: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  yearsRemaining: number;
  isIndexed?: boolean;
  rateFormula?: string;
  nextRateChangeDate?: string;
}

function isWithinDays(isoDate: string | undefined, days: number): boolean {
  if (!isoDate) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate); target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

export interface MortgageData {
  tracks: MortgageTrack[];
  mortgageStartYear?: number;
}

interface Props {
  data: MortgageData;
  onChange: (data: MortgageData) => void;
}

const TRACK_PRESETS = ["פריים", "קבוע לא צמוד", "צמוד מדד"];

function calcMonthlyPayment(balance: number, annualRate: number, years: number): number {
  if (balance <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return balance / n;
  return (balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// מחשב יתרת קרן + ריבית מצטברת לפי שנה עבור מסלול אחד
function projectTrack(track: MortgageTrack): Array<{ year: number; remaining: number; cumulativeInterest: number }> {
  const { balance, monthlyPayment, interestRate, yearsRemaining } = track;
  if (balance <= 0 || yearsRemaining <= 0 || monthlyPayment <= 0) return [];
  const r = interestRate / 100 / 12;
  let remaining = balance;
  let cumulativeInterest = 0;
  const points = [{ year: 0, remaining: Math.round(balance), cumulativeInterest: 0 }];

  for (let year = 1; year <= yearsRemaining && remaining > 0; year++) {
    for (let m = 0; m < 12 && remaining > 0; m++) {
      const interest = r === 0 ? 0 : remaining * r;
      const principalPaid = Math.min(remaining, monthlyPayment - interest);
      cumulativeInterest += interest;
      remaining = Math.max(0, remaining - Math.max(0, principalPaid));
    }
    points.push({ year, remaining: Math.round(remaining), cumulativeInterest: Math.round(cumulativeInterest) });
  }
  return points;
}

// משחזר יתרת קרן היסטורית — פירוק אמורטיזציה לאחור
function reconstructHistoricalBalance(
  currentBalance: number,
  monthlyPayment: number,
  annualRate: number,
  monthsBack: number
): number {
  const r = annualRate / 100 / 12;
  let balance = currentBalance;
  for (let m = 0; m < monthsBack; m++) {
    balance = r === 0 ? balance + monthlyPayment : (balance + monthlyPayment) / (1 + r);
  }
  return balance;
}

// מחשב ריבית מצטברת היסטורית — מריץ אמורטיזציה קדימה מהיתרה המשוחזרת
function projectHistoricalInterest(
  startBalance: number,
  monthlyPayment: number,
  annualRate: number,
  years: number
): Array<{ year: number; cumulativeInterest: number }> {
  const r = annualRate / 100 / 12;
  let balance = startBalance;
  let cumulativeInterest = 0;
  const points = [{ year: 0, cumulativeInterest: 0 }];
  for (let year = 1; year <= years && balance > 0; year++) {
    for (let m = 0; m < 12 && balance > 0; m++) {
      const interest = r === 0 ? 0 : balance * r;
      const principalPaid = Math.min(balance, monthlyPayment - interest);
      cumulativeInterest += interest;
      balance = Math.max(0, balance - Math.max(0, principalPaid));
    }
    points.push({ year, cumulativeInterest: Math.round(cumulativeInterest) });
  }
  return points;
}

function buildChartData(tracks: MortgageTrack[], mortgageStartYear: number) {
  const activeTracks = tracks.filter((t) => t.balance > 0 && t.yearsRemaining > 0 && t.monthlyPayment > 0);
  if (activeTracks.length === 0) return { points: [], todayYear: "" };

  const currentYear = new Date().getFullYear();
  const yearsElapsed = Math.max(0, currentYear - mortgageStartYear);
  const maxFutureYears = Math.max(...activeTracks.map((t) => t.yearsRemaining));
  const todayYear = `${currentYear}`;

  const points: Array<{ year: string; remaining: number; interest?: number; monthlyPayment?: number }> = [];

  // חישוב ריבית היסטורית לכל מסלול — משחזר יתרה מקורית ומריץ אמורטיזציה קדימה
  const historicalProjections = activeTracks.map(track => {
    const originalBalance = reconstructHistoricalBalance(
      track.balance, track.monthlyPayment, track.interestRate, yearsElapsed * 12
    );
    return projectHistoricalInterest(originalBalance, track.monthlyPayment, track.interestRate, yearsElapsed);
  });

  // סה"כ ריבית ששולמה מ-mortgageStartYear עד היום
  const totalHistoricalInterestPaid = historicalProjections.reduce((sum, proj) => {
    return sum + (proj[proj.length - 1]?.cumulativeInterest ?? 0);
  }, 0);

  // שנים היסטוריות (לפני היום) — שחזור יתרה + ריבית מצטברת
  for (let yr = 0; yr < yearsElapsed; yr++) {
    const monthsBack = (yearsElapsed - yr) * 12;
    let totalRemaining = 0;
    let totalHistInterest = 0;
    for (let i = 0; i < activeTracks.length; i++) {
      const track = activeTracks[i];
      totalRemaining += reconstructHistoricalBalance(track.balance, track.monthlyPayment, track.interestRate, monthsBack);
      const pt = historicalProjections[i].find(p => p.year === yr)
              ?? historicalProjections[i][historicalProjections[i].length - 1];
      totalHistInterest += pt?.cumulativeInterest ?? 0;
    }
    points.push({
      year: `${mortgageStartYear + yr}`,
      remaining: Math.round(Math.max(0, totalRemaining)),
      interest: Math.round(totalHistInterest),
    });
  }

  // היום ואילך — חיזוי קדימה + offset ריבית היסטורית
  const projections = activeTracks.map(projectTrack);
  for (let futureYear = 0; futureYear <= maxFutureYears; futureYear++) {
    let totalRemaining = 0;
    let totalInterest = 0;
    let totalMonthly = 0;
    for (let i = 0; i < activeTracks.length; i++) {
      const track = activeTracks[i];
      const proj = projections[i];
      const pt = proj.find((p) => p.year === futureYear) ?? proj[proj.length - 1];
      if (pt) {
        totalRemaining += pt.remaining;
        totalInterest += pt.cumulativeInterest;
      }
      if (futureYear < track.yearsRemaining) {
        totalMonthly += track.monthlyPayment;
      }
    }
    points.push({
      year: `${currentYear + futureYear}`,
      remaining: Math.round(totalRemaining),
      interest: Math.round(totalInterest + totalHistoricalInterestPaid),
      monthlyPayment: Math.round(totalMonthly),
    });
  }

  return { points, todayYear };
}

const MortgageSection = ({ data, onChange }: Props) => {
  const [showRefi, setShowRefi] = useState(false);
  const [refiRate, setRefiRate] = useState(4.5);
  const [refiYears, setRefiYears] = useState(20);
  const [refiCosts, setRefiCosts] = useState(0);

  const tracks = data.tracks ?? [];
  const totalBalance = tracks.reduce((s, t) => s + t.balance, 0);
  const totalMonthly = tracks.reduce((s, t) => s + t.monthlyPayment, 0);
  const startYear = data.mortgageStartYear ?? 2021;
  const { points: chartData, todayYear } = buildChartData(tracks, startYear);

  const WARN_DAYS = 90;
  const tracksWithUpcomingChange = tracks.filter(t => isWithinDays(t.nextRateChangeDate, WARN_DAYS));
  const hasUpcomingChange = tracksWithUpcomingChange.length > 0;

  // מחשבון מחזור
  const newMonthly = calcMonthlyPayment(totalBalance, refiRate, refiYears);
  const monthlySavings = totalMonthly - newMonthly;
  const breakEvenMonths =
    refiCosts > 0 && monthlySavings > 0 ? Math.ceil(refiCosts / monthlySavings) : null;

  const addTrack = () => {
    onChange({
      ...data,
      tracks: [
        ...tracks,
        {
          id: `track-${Date.now()}`,
          label: TRACK_PRESETS[tracks.length % TRACK_PRESETS.length],
          balance: 0,
          monthlyPayment: 0,
          interestRate: 0,
          yearsRemaining: 0,
        },
      ],
    });
  };

  const updateTrack = (id: string, field: keyof MortgageTrack, value: string | number | boolean | undefined) => {
    onChange({ ...data, tracks: tracks.map((t) => (t.id === id ? { ...t, [field]: value } : t)) });
  };

  const removeTrack = (id: string) => {
    onChange({ ...data, tracks: tracks.filter((t) => t.id !== id) });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-warning" />
            <CardTitle className="font-display text-xl">משכנתא</CardTitle>
          </div>
          {totalBalance > 0 && (
            <p className="text-sm text-muted-foreground">
              סה״כ: <span className="font-semibold text-foreground">{formatCurrency(totalBalance)}</span>
              {" | "}
              <span className="font-semibold text-foreground">{formatCurrency(Math.round(totalMonthly))}</span> / חודש
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* התראת שינוי ריבית */}
        {hasUpcomingChange && (
          <Alert variant="destructive" className="mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {tracksWithUpcomingChange.map(t => (
                <span key={t.id} className="block">
                  ⚠️ מסלול <strong>{t.label}</strong> — שינוי ריבית ב-{new Date(t.nextRateChangeDate!).toLocaleDateString("he-IL")}
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* מסלולים */}
        <div className="space-y-4">
          {tracks.map((track, idx) => (
            <div key={track.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">מסלול {idx + 1}</span>
                  <Input
                    className="w-40 h-7 text-sm"
                    value={track.label}
                    onChange={(e) => updateTrack(track.id, "label", e.target.value)}
                    placeholder="שם המסלול"
                  />
                  {isWithinDays(track.nextRateChangeDate, WARN_DAYS) && (
                    <Badge variant="destructive" className="gap-1 shrink-0">
                      <AlertTriangle className="h-3 w-3" />שינוי ריבית קרוב
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                  onClick={() => removeTrack(track.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">יתרה ₪</Label>
                  <FormattedNumberInput value={track.balance} onChange={(v) => updateTrack(track.id, "balance", v)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">תשלום חודשי ₪</Label>
                  <FormattedNumberInput value={track.monthlyPayment} onChange={(v) => updateTrack(track.id, "monthlyPayment", v)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">ריבית %</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={track.interestRate || ""}
                    onChange={(e) => updateTrack(track.id, "interestRate", Math.max(0, Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">שנים שנותרו</Label>
                  <Input
                    type="number" min="0"
                    value={track.yearsRemaining || ""}
                    onChange={(e) => updateTrack(track.id, "yearsRemaining", Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">נוסחת ריבית</Label>
                  <Input
                    className="h-7 text-sm w-52"
                    value={track.rateFormula ?? ""}
                    onChange={e => updateTrack(track.id, "rateFormula", e.target.value)}
                    placeholder='פריים − 0.60%'
                    dir="rtl"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">שינוי ריבית הבא</Label>
                  <Input
                    type="date"
                    className="h-7 text-sm w-36"
                    value={track.nextRateChangeDate ?? ""}
                    onChange={e => updateTrack(track.id, "nextRateChangeDate", e.target.value || undefined)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`indexed-${track.id}`}
                    checked={track.isIndexed ?? false}
                    onCheckedChange={checked => updateTrack(track.id, "isIndexed", checked)}
                  />
                  <Label htmlFor={`indexed-${track.id}`} className="text-xs text-muted-foreground cursor-pointer">
                    צמוד למדד
                  </Label>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addTrack} className="gap-1">
            <Plus className="h-4 w-4" />
            הוסף מסלול
          </Button>
        </div>

        {/* גרף יתרה + ריבית מצטברת */}
        {chartData.length > 1 && todayYear && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              מסלול פירעון — יתרת קרן וריבית מצטברת (כל המסלולים)
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="gradRemaining" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 22%)" />
                  <XAxis
                    dataKey="year"
                    stroke="hsl(215 20% 55%)"
                    fontSize={10}
                    interval={4}
                    tick={{ fill: "hsl(215 20% 55%)" }}
                  />
                  {/* ציר שמאל — יתרות ₪K */}
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(215 20% 55%)"
                    fontSize={11}
                    tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`}
                  />
                  {/* ציר ימין — תשלום חודשי ₪ */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(262 80% 65%)"
                    fontSize={11}
                    tickFormatter={(v) => `₪${(v / 1000).toFixed(1)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 20% 14%)",
                      border: "1px solid hsl(220 16% 22%)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 96%)",
                    }}
                    formatter={(v: number, name: string) => [
                      formatCurrency(v),
                      name === "remaining" ? "יתרת קרן" :
                      name === "interest" ? "ריבית מצטברת" :
                      "תשלום חודשי כולל",
                    ]}
                    labelFormatter={(l) => String(l)}
                  />
                  <Legend
                    formatter={(v) =>
                      v === "remaining" ? "יתרת קרן" :
                      v === "interest" ? "ריבית מצטברת" :
                      "תשלום חודשי"
                    }
                  />
                  <ReferenceLine
                    x={todayYear}
                    yAxisId="left"
                    stroke="hsl(142 70% 50%)"
                    strokeDasharray="4 2"
                    label={{ value: "היום", position: "insideTopLeft", fontSize: 10, fill: "hsl(142 70% 50%)" }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="interest"
                    stroke="hsl(0 72% 51%)"
                    fill="url(#gradInterest)"
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="remaining"
                    stroke="hsl(38 92% 50%)"
                    fill="url(#gradRemaining)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="stepAfter"
                    dataKey="monthlyPayment"
                    stroke="hsl(262 80% 65%)"
                    strokeWidth={2.5}
                    dot={false}
                    strokeDasharray="6 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* מחשבון מחזור */}
        {totalBalance > 0 && (
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
            <button
              className="flex items-center gap-2 w-full text-right"
              onClick={() => setShowRefi(!showRefi)}
            >
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">מחשבון מחזור משכנתא</span>
              {showRefi ? (
                <ChevronUp className="h-4 w-4 mr-auto" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-auto" />
              )}
            </button>

            {showRefi && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 max-w-lg">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">ריבית חדשה %</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={refiRate}
                      onChange={(e) => setRefiRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">תקופה חדשה (שנים)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={refiYears}
                      onChange={(e) => setRefiYears(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">עלות מחזור ₪</Label>
                    <FormattedNumberInput value={refiCosts} onChange={setRefiCosts} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">יתרה למחזור</p>
                    <p className="text-sm font-bold">{formatCurrency(totalBalance)}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">תשלום חדש / חודש</p>
                    <p className="text-sm font-bold">{formatCurrency(Math.round(newMonthly))}</p>
                  </div>
                  <div
                    className={`rounded-lg p-3 text-center ${
                      monthlySavings > 0 ? "bg-accent/10" : "bg-destructive/10"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">חיסכון חודשי</p>
                    <p
                      className={`text-sm font-bold ${
                        monthlySavings > 0 ? "text-accent" : "text-destructive"
                      }`}
                    >
                      {monthlySavings > 0 ? "+" : ""}
                      {formatCurrency(Math.round(monthlySavings))}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">נקודת איזון</p>
                    <p className="text-sm font-bold">
                      {refiCosts <= 0
                        ? monthlySavings > 0 ? "מיידי" : "לא כדאי"
                        : breakEvenMonths !== null
                        ? `${breakEvenMonths} חודשים`
                        : "לא כדאי"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MortgageSection;
