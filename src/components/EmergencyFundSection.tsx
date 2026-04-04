import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck } from "lucide-react";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(v);

export interface EmergencyFundData {
  balance: number;
  target: number;
}

interface Props {
  data: EmergencyFundData;
  onChange: (data: EmergencyFundData) => void;
}

const EmergencyFundSection = ({ data, onChange }: Props) => {
  const rawProgress = data.target > 0 ? (data.balance / data.target) * 100 : 0;
  const progress = Math.min(100, rawProgress);
  const goalReached = data.target > 0 && data.balance >= data.target;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <CardTitle className="font-display text-xl">קרן חירום</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">יתרה נוכחית ₪</Label>
            <Input type="number" min="0" value={data.balance || ""} onChange={(e) => onChange({ ...data, balance: Math.max(0, Number(e.target.value)) })} />
            {data.balance > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(data.balance)}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">יעד ₪</Label>
            <Input type="number" min="0" value={data.target || ""} onChange={(e) => onChange({ ...data, target: Math.max(0, Number(e.target.value)) })} />
            {data.target > 0 && <p className="text-xs text-muted-foreground">{formatCurrency(data.target)}</p>}
          </div>
        </div>
        {data.target > 0 && (
          <div className="max-w-md space-y-2">
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
      </CardContent>
    </Card>
  );
};

export default EmergencyFundSection;
