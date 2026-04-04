import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(v);

interface CompoundInterestCalculatorProps {
  defaultOneTime?: number;
  defaultMonthly?: number;
  defaultRate?: number;
  defaultYears?: number;
  defaultAccumulationFee?: number;
  taxRate?: number;
  fundName?: string;
  fundNumber?: string;
  managingCompany?: string;
  onFundInfoChange?: (info: { fundName: string; fundNumber: string; managingCompany: string }) => void;
}

const CompoundInterestCalculator = ({
  defaultOneTime = 0,
  defaultMonthly = 0,
  defaultRate = 6,
  defaultYears = 10,
  defaultAccumulationFee = 0,
  taxRate = 0.25,
  fundName = "",
  fundNumber = "",
  managingCompany = "",
  onFundInfoChange,
}: CompoundInterestCalculatorProps) => {
  const [oneTime, setOneTime] = useState(defaultOneTime);
  const [monthly, setMonthly] = useState(defaultMonthly);
  const [rate, setRate] = useState(defaultRate);
  const [years, setYears] = useState(defaultYears);
  const [accFee, setAccFee] = useState(defaultAccumulationFee);
  const [name, setName] = useState(fundName);
  const [number, setNumber] = useState(fundNumber);
  const [company, setCompany] = useState(managingCompany);
  const [open, setOpen] = useState(false);

  const effectiveRate = Math.max(0, rate - accFee);
  const r = effectiveRate / 100 / 12;
  let totalBeforeTax = oneTime;
  for (let m = 0; m < years * 12; m++) {
    totalBeforeTax = totalBeforeTax * (1 + r) + monthly;
  }
  totalBeforeTax = Math.round(totalBeforeTax);

  const totalDeposits = oneTime + monthly * years * 12;
  const profitBeforeTax = Math.max(0, totalBeforeTax - totalDeposits);
  const taxAmount = Math.round(profitBeforeTax * taxRate);
  const profitAfterTax = profitBeforeTax - taxAmount;
  const totalAfterTax = totalDeposits + profitAfterTax;

  const handleFundInfo = (field: string, value: string) => {
    const updated = { fundName: name, fundNumber: number, managingCompany: company, [field]: value };
    if (field === "fundName") setName(value);
    if (field === "fundNumber") setNumber(value);
    if (field === "managingCompany") setCompany(value);
    onFundInfoChange?.(updated);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer w-full py-2">
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        <span className="font-medium">מחשבון ריבית דריבית</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-muted/50 rounded-lg p-4 mt-2 space-y-4 border border-border">
          {/* Fund Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">שם הקופה</Label>
              <Input className="h-8" value={name} onChange={(e) => handleFundInfo("fundName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">מספר קופה</Label>
              <Input className="h-8" value={number} onChange={(e) => handleFundInfo("fundNumber", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">חברה מנהלת</Label>
              <Input className="h-8" value={company} onChange={(e) => handleFundInfo("managingCompany", e.target.value)} />
            </div>
          </div>

          {/* Calculator Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">הפקדה חד פעמית ₪</Label>
              <Input type="number" className="h-8" value={oneTime || ""} onChange={(e) => setOneTime(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">הפקדה חודשית ₪</Label>
              <Input type="number" className="h-8" value={monthly || ""} onChange={(e) => setMonthly(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">תשואה שנתית %</Label>
              <Input type="number" step="0.1" className="h-8" value={rate || ""} onChange={(e) => setRate(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">מספר שנות הפקדה</Label>
              <Input type="number" className="h-8" value={years || ""} onChange={(e) => setYears(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">דמי ניהול מצבירה %</Label>
              <Input type="number" step="0.01" className="h-8" value={accFee || ""} onChange={(e) => setAccFee(Number(e.target.value))} />
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground">הסכום הכולל לפני מס</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalBeforeTax)}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground">הסכום הכולל אחרי מס</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalAfterTax)}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground">הרווח לפני מס</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(profitBeforeTax)}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground">הרווח אחרי מס</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(profitAfterTax)}</p>
            </div>
          </div>

          {/* Summary Text */}
          <p className="text-sm text-muted-foreground leading-relaxed bg-card rounded-lg p-3 border border-border">
            ההשקעה ההתחלתית שלך על סך {formatCurrency(oneTime)} יחד עם ההפקדות החודשיות שלך על סך {formatCurrency(monthly)} עם תשואה שנתית של {rate}% תהיה שווה בעתיד{" "}
            <span className="text-foreground font-bold">{formatCurrency(totalBeforeTax)}</span> לאחר {years} שנים של ריבית דריבית
            (או <span className="text-primary font-bold">{formatCurrency(totalAfterTax)}</span> לאחר ניכוי מס רווחי הון של {(taxRate * 100).toFixed(0)}%)
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CompoundInterestCalculator;
