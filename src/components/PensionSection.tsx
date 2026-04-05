import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Plus, Trash2, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import CompoundInterestCalculator from "./CompoundInterestCalculator";
import type { FundEntry } from "./FundSection";

export interface OwnerConfig {
  name: string;
  birthYear: number;
  retirementAge: number;
  annuityFactor: number; // מקדם קצבה
  officialMonthlyPension?: number; // קצבה רשמית לפי חישוב קרן הפנסיה עצמה
}

interface PensionSectionProps {
  pensionEntries: FundEntry[];
  studyEntries: FundEntry[];
  onPensionChange: (entries: FundEntry[]) => void;
  ownerOptions: { value: string; label: string }[];
  ownerConfigs: OwnerConfig[];
  onOwnerConfigsChange: (configs: OwnerConfig[]) => void;
}

// חישוב צבירה צפויה בפרישה
function projectToRetirement(entries: FundEntry[], yearsLeft: number): number {
  if (yearsLeft <= 0) return entries.reduce((s, e) => s + e.balance, 0);
  return entries.reduce((total, e) => {
    const effectiveRate = Math.max(0, e.annualReturn - e.accumulationFee);
    const r = effectiveRate / 100 / 12;
    const monthlyNet = e.monthlyDeposit * (1 - e.depositFee / 100);
    let balance = e.balance;
    for (let m = 0; m < yearsLeft * 12; m++) {
      balance = r === 0 ? balance + monthlyNet : balance * (1 + r) + monthlyNet;
    }
    return total + Math.round(balance);
  }, 0);
}

// ------- כרטיס קצבה -------
const PensionProjectionCard = ({
  label,
  pensionProjected,
  studyProjected,
  config,
  onConfigChange,
}: {
  label: string;
  pensionProjected: number;
  studyProjected: number;
  config: OwnerConfig;
  onConfigChange?: (c: OwnerConfig) => void;
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const pensionOnly = pensionProjected / config.annuityFactor;
  const withStudy = (pensionProjected + studyProjected) / config.annuityFactor;
  const currentYear = new Date().getFullYear();
  const retirementYear = config.birthYear + config.retirementAge;
  const yearsLeft = Math.max(0, retirementYear - currentYear);

  return (
    <div className="rounded-xl border border-primary/20 bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm text-primary font-display">{label} — קצבה צפויה בגיל {config.retirementAge}</p>
        {onConfigChange && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSettings((p) => !p)}>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {showSettings && onConfigChange && (
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">שנת לידה</Label>
            <Input type="number" className="h-7 text-sm" value={config.birthYear || ""} onChange={(e) => onConfigChange({ ...config, birthYear: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">גיל פרישה</Label>
            <Input type="number" className="h-7 text-sm" value={config.retirementAge || ""} onChange={(e) => onConfigChange({ ...config, retirementAge: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">מקדם קצבה</Label>
            <Input type="number" className="h-7 text-sm" value={config.annuityFactor || ""} onChange={(e) => onConfigChange({ ...config, annuityFactor: Number(e.target.value) })} />
          </div>
          <p className="col-span-3 text-[10px] text-muted-foreground">שנים לפרישה: <strong>{yearsLeft}</strong> | צבירה פנסיה: {formatCurrency(pensionProjected)} | צבירה השתלמות: {formatCurrency(studyProjected)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-lg p-3 border border-border text-center">
          <p className="text-[11px] text-muted-foreground mb-1">מפנסיה בלבד</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(Math.round(pensionOnly))}</p>
          <p className="text-[10px] text-muted-foreground">לחודש</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/30 text-center">
          <p className="text-[11px] text-muted-foreground mb-1">כולל קרן השתלמות</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(Math.round(withStudy))}</p>
          <p className="text-[10px] text-muted-foreground">לחודש</p>
        </div>
      </div>
      {config.officialMonthlyPension && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-2 text-center space-y-0.5">
          <p className="text-[10px] text-warning font-semibold">חישוב רשמי של קרן הפנסיה</p>
          <p className="text-base font-bold text-warning">{formatCurrency(config.officialMonthlyPension)}/חודש</p>
          <p className="text-[10px] text-muted-foreground">לפי הנחות הקרן (תשואה שמרנית + מקדם אקטוארי)</p>
        </div>
      )}
      <p className="text-[10px] text-center text-muted-foreground">
        מקדם קצבה: {config.annuityFactor} · גיל פרישה: {config.retirementAge} · שנים לפרישה: {yearsLeft}
      </p>
    </div>
  );
};

// ------- טבלת קרנות לבעלים -------
const OwnerFundTable = ({
  entries,
  ownerOptions,
  onAdd,
  onDelete,
  onUpdate,
}: {
  entries: FundEntry[];
  ownerOptions: { value: string; label: string }[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: keyof FundEntry, value: string | number) => void;
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="text-right">בעלים</TableHead>
              <TableHead className="text-right">חברה</TableHead>
              <TableHead className="text-right">מסלול</TableHead>
              <TableHead className="text-right">יתרה ₪</TableHead>
              <TableHead className="text-right">הפקדה חודשית ₪</TableHead>
              <TableHead className="text-right">דמי ניהול מצבירה %</TableHead>
              <TableHead className="text-right">תשואה %</TableHead>
              <TableHead className="text-right">תאריך עדכון</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-6">
                  לחץ "הוסף קרן" להוספת נתונים
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <React.Fragment key={entry.id}>
                <TableRow>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleRow(entry.id)}>
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedRows.has(entry.id) ? "rotate-180" : ""}`} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Select value={entry.owner} onValueChange={(v) => onUpdate(entry.id, "owner", v)}>
                      <SelectTrigger className="h-7 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>{ownerOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input className="h-7 w-32" value={entry.provider} onChange={(e) => onUpdate(entry.id, "provider", e.target.value)} /></TableCell>
                  <TableCell><Input className="h-7 w-44" value={entry.investmentTrack} onChange={(e) => onUpdate(entry.id, "investmentTrack", e.target.value)} /></TableCell>
                  <TableCell><Input type="number" min="0" className="h-7 w-28" value={entry.balance || ""} onChange={(e) => onUpdate(entry.id, "balance", Math.max(0, Number(e.target.value)))} /></TableCell>
                  <TableCell><Input type="number" min="0" className="h-7 w-28" value={entry.monthlyDeposit || ""} onChange={(e) => onUpdate(entry.id, "monthlyDeposit", Math.max(0, Number(e.target.value)))} /></TableCell>
                  <TableCell><Input type="number" min="0" step="0.01" className="h-7 w-24" value={entry.accumulationFee || ""} onChange={(e) => onUpdate(entry.id, "accumulationFee", Math.max(0, Number(e.target.value)))} /></TableCell>
                  <TableCell><Input type="number" min="0" step="0.1" className="h-7 w-20" value={entry.annualReturn || ""} onChange={(e) => onUpdate(entry.id, "annualReturn", Math.max(0, Number(e.target.value)))} /></TableCell>
                  <TableCell><Input type="date" className="h-7 w-32" value={entry.lastUpdated} onChange={(e) => onUpdate(entry.id, "lastUpdated", e.target.value)} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows.has(entry.id) && (
                  <TableRow key={`${entry.id}-calc`}>
                    <TableCell colSpan={10} className="p-0">
                      <div className="px-4 pb-3">
                        <CompoundInterestCalculator
                          defaultOneTime={entry.balance}
                          defaultMonthly={entry.monthlyDeposit}
                          defaultRate={entry.annualReturn || 6}
                          defaultAccumulationFee={entry.accumulationFee}
                          fundName={entry.investmentTrack}
                          managingCompany={entry.provider}
                          taxRate={0.25}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button size="sm" onClick={onAdd} variant="outline" className="gap-1 text-xs">
        <Plus className="h-3.5 w-3.5" /> הוסף קרן
      </Button>
    </div>
  );
};

// ------- Main Component -------
type Tab = "ישי" | "מיכל" | "ביחד";

const PensionSection = ({
  pensionEntries,
  studyEntries,
  onPensionChange,
  ownerOptions,
  ownerConfigs,
  onOwnerConfigsChange,
}: PensionSectionProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("ישי");

  const totalBalance = pensionEntries.reduce((s, e) => s + e.balance, 0);
  const currentYear = new Date().getFullYear();

  const getConfig = (name: string) =>
    ownerConfigs.find((c) => c.name === name) ?? { name, birthYear: 1985, retirementAge: 67, annuityFactor: 200 };

  const updateConfig = (updated: OwnerConfig) =>
    onOwnerConfigsChange(ownerConfigs.map((c) => (c.name === updated.name ? updated : c)));

  const addEntry = (ownerName?: string) => {
    const newEntry: FundEntry = {
      id: crypto.randomUUID(),
      owner: ownerName ?? ownerOptions[0]?.value ?? "",
      provider: "",
      investmentTrack: "",
      balance: 0,
      depositFee: 0,
      accumulationFee: 0,
      annualReturn: 0,
      monthlyDeposit: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    onPensionChange([...pensionEntries, newEntry]);
  };

  const deleteEntry = (id: string) => onPensionChange(pensionEntries.filter((e) => e.id !== id));
  const updateEntry = (id: string, field: keyof FundEntry, value: string | number) =>
    onPensionChange(pensionEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  const renderOwnerView = (ownerName: string) => {
    const cfg = getConfig(ownerName);
    const myPension = pensionEntries.filter((e) => e.owner === ownerName);
    const myStudy = studyEntries.filter((e) => e.owner === ownerName);
    const yearsLeft = Math.max(0, cfg.birthYear + cfg.retirementAge - currentYear);
    const pensionProjected = projectToRetirement(myPension, yearsLeft);
    const studyProjected = projectToRetirement(myStudy, yearsLeft);
    const myTotal = myPension.reduce((s, e) => s + e.balance, 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>סה״כ פנסיה: <strong className="text-foreground">{formatCurrency(myTotal)}</strong></span>
        </div>
        <OwnerFundTable
          entries={myPension}
          ownerOptions={ownerOptions}
          onAdd={() => addEntry(ownerName)}
          onDelete={deleteEntry}
          onUpdate={updateEntry}
        />
        <PensionProjectionCard
          label={ownerName}
          pensionProjected={pensionProjected}
          studyProjected={studyProjected}
          config={cfg}
          onConfigChange={updateConfig}
        />
      </div>
    );
  };

  const renderCombinedView = () => {
    const configs = ownerOptions.map((o) => getConfig(o.value));
    let combinedPensionOnly = 0;
    let combinedWithStudy = 0;

    for (const cfg of configs) {
      const yearsLeft = Math.max(0, cfg.birthYear + cfg.retirementAge - currentYear);
      const myPension = pensionEntries.filter((e) => e.owner === cfg.name);
      const myStudy = studyEntries.filter((e) => e.owner === cfg.name);
      combinedPensionOnly += projectToRetirement(myPension, yearsLeft) / cfg.annuityFactor;
      combinedWithStudy +=
        (projectToRetirement(myPension, yearsLeft) + projectToRetirement(myStudy, yearsLeft)) /
        cfg.annuityFactor;
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          סה״כ צבירה משפחתית: <strong className="text-foreground">{formatCurrency(totalBalance)}</strong>
        </p>
        <div className="rounded-xl border border-primary/20 bg-muted/40 p-4 space-y-3">
          <p className="font-bold text-sm text-primary font-display">קצבה משפחתית מאוחדת</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-lg p-3 border border-border text-center">
              <p className="text-[11px] text-muted-foreground mb-1">מפנסיה בלבד</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.round(combinedPensionOnly))}</p>
              <p className="text-[10px] text-muted-foreground">לחודש</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/30 text-center">
              <p className="text-[11px] text-muted-foreground mb-1">כולל קרנות השתלמות</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(Math.round(combinedWithStudy))}</p>
              <p className="text-[10px] text-muted-foreground">לחודש</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {ownerOptions.map((o) => {
              const cfg = getConfig(o.value);
              const yearsLeft = Math.max(0, cfg.birthYear + cfg.retirementAge - currentYear);
              const myPension = pensionEntries.filter((e) => e.owner === o.value);
              const myStudy = studyEntries.filter((e) => e.owner === o.value);
              const p = projectToRetirement(myPension, yearsLeft);
              const s = projectToRetirement(myStudy, yearsLeft);
              return (
                <div key={o.value} className="text-center text-xs text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground">{o.label}</p>
                  <p>פנסיה: {formatCurrency(Math.round(p / cfg.annuityFactor))}/חודש</p>
                  <p>כולל השתלמות: {formatCurrency(Math.round((p + s) / cfg.annuityFactor))}/חודש</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const tabs: Tab[] = ["ישי", "מיכל", "ביחד"];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle className="font-display text-xl">פנסיה</CardTitle>
          <span className="text-sm text-muted-foreground mr-2">
            סה״כ: {formatCurrency(totalBalance)}
          </span>
        </div>
        {/* Tab selector */}
        <div className="flex rounded-lg overflow-hidden border border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "ביחד" ? renderCombinedView() : renderOwnerView(activeTab)}
      </CardContent>
    </Card>
  );
};

export default PensionSection;
