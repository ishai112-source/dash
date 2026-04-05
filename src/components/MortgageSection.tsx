import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export interface MortgageTrack {
  id: string;
  label: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  yearsRemaining: number;
}

export interface MortgageData {
  tracks: MortgageTrack[];
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

function buildChartData(tracks: MortgageTrack[]) {
  const activeTracks = tracks.filter((t) => t.balance > 0 && t.yearsRemaining > 0 && t.monthlyPayment > 0);
  if (activeTracks.length === 0) return [];

  const maxYears = Math.max(...activeTracks.map((t) => t.yearsRemaining));
  const projections = activeTracks.map(projectTrack);

  const points = [];
  for (let year = 0; year <= maxYears; year++) {
    let totalRemaining = 0;
    let totalInterest = 0;
    for (const proj of projections) {
      const pt = proj.find((p) => p.year === year) ?? proj[proj.length - 1];
      if (pt) {
        totalRemaining += pt.remaining;
        totalInterest += pt.cumulativeInterest;
      }
    }
    points.push({ year: `${year}`, remaining: Math.round(totalRemaining), interest: Math.round(totalInterest) });
  }
  return points;
}

const MortgageSection = ({ data, onChange }: Props) => {
  const [showRefi, setShowRefi] = useState(false);
  const [refiRate, setRefiRate] = useState(4.5);
  const [refiYears, setRefiYears] = useState(20);
  const [refiCosts, setRefiCosts] = useState(0);

  const tracks = data.tracks ?? [];
  const totalBalance = tracks.reduce((s, t) => s + t.balance, 0);
  const totalMonthly = tracks.reduce((s, t) => s + t.monthlyPayment, 0);
  const chartData = buildChartData(tracks);

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

  const updateTrack = (id: string, field: keyof MortgageTrack, value: string | number) => {
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
        {/* מסלולים */}
        <div className="space-y-4">
          {tracks.map((track, idx) => (
            <div key={track.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">מסלול {idx + 1}</span>
                  <Input
                    className="w-40 h-7 text-sm"
                    value={track.label}
                    onChange={(e) => updateTrack(track.id, "label", e.target.value)}
                    placeholder="שם המסלול"
                  />
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
                {(
                  [
                    { key: "balance", label: "יתרה ₪" },
                    { key: "monthlyPayment", label: "תשלום חודשי ₪" },
                    { key: "interestRate", label: "ריבית %" },
                    { key: "yearsRemaining", label: "שנים שנותרו" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      type="number"
                      min="0"
                      step={key === "interestRate" ? "0.01" : "1"}
                      value={track[key] || ""}
                      onChange={(e) =>
                        updateTrack(track.id, key, Math.max(0, Number(e.target.value)))
                      }
                    />
                    {track[key] > 0 && (key === "balance" || key === "monthlyPayment") && (
                      <p className="text-xs text-muted-foreground">{formatCurrency(track[key])}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addTrack} className="gap-1">
            <Plus className="h-4 w-4" />
            הוסף מסלול
          </Button>
        </div>

        {/* גרף יתרה + ריבית מצטברת */}
        {chartData.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              מסלול פירעון — יתרת קרן וריבית מצטברת (כל המסלולים)
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
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
                    fontSize={11}
                    label={{ value: "שנים", position: "insideBottomRight", offset: -5, fontSize: 11 }}
                  />
                  <YAxis
                    stroke="hsl(215 20% 55%)"
                    fontSize={11}
                    tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`}
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
                      name === "remaining" ? "יתרת קרן" : "ריבית מצטברת",
                    ]}
                    labelFormatter={(l) => `שנה ${l}`}
                  />
                  <Legend
                    formatter={(v) => (v === "remaining" ? "יתרת קרן" : "ריבית מצטברת")}
                  />
                  <Area
                    type="monotone"
                    dataKey="interest"
                    stroke="hsl(0 72% 51%)"
                    fill="url(#gradInterest)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="remaining"
                    stroke="hsl(38 92% 50%)"
                    fill="url(#gradRemaining)"
                    strokeWidth={2}
                  />
                </AreaChart>
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
                    <Input
                      type="number"
                      min="0"
                      value={refiCosts || ""}
                      onChange={(e) => setRefiCosts(Number(e.target.value))}
                    />
                    {refiCosts > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(refiCosts)}</p>}
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
