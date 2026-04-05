import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, Trash2, ChevronDown, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import CompoundInterestCalculator from "./CompoundInterestCalculator";
import type { FundEntry } from "./FundSection";

// הרחבת FundEntry עם תאריך פתיחה
export interface StudyFundEntry extends FundEntry {
  openingDate?: string; // YYYY-MM-DD
}

interface StudyFundSectionProps {
  entries: StudyFundEntry[];
  onChange: (entries: StudyFundEntry[]) => void;
  ownerOptions: { value: string; label: string }[];
}

// חישוב סטטוס פטור ממס (6 שנים מתאריך פתיחה)
function taxExemptionStatus(openingDate?: string): { exempt: boolean; monthsLeft: number; exemptDate: string } | null {
  if (!openingDate) return null;
  const opening = new Date(openingDate);
  const exemptDate = new Date(opening);
  exemptDate.setFullYear(exemptDate.getFullYear() + 6);
  const now = new Date();
  const exempt = now >= exemptDate;
  const monthsLeft = exempt
    ? 0
    : Math.ceil((exemptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return {
    exempt,
    monthsLeft,
    exemptDate: exemptDate.toLocaleDateString("he-IL", { month: "long", year: "numeric" }),
  };
}

const TaxBadge = ({ openingDate }: { openingDate?: string }) => {
  const status = taxExemptionStatus(openingDate);
  if (!status) return <span className="text-[10px] text-muted-foreground">הזן תאריך פתיחה</span>;
  if (status.exempt)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent">
        <CheckCircle2 className="h-3 w-3" /> פטורה ממס ✓
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Clock className="h-3 w-3" /> פטור ב-{status.exemptDate} (עוד {status.monthsLeft} חודשים)
    </span>
  );
};

// ------- טבלת קרנות לבעלים -------
const OwnerStudyTable = ({
  entries,
  ownerOptions,
  onAdd,
  onDelete,
  onUpdate,
}: {
  entries: StudyFundEntry[];
  ownerOptions: { value: string; label: string }[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: keyof StudyFundEntry, value: string | number) => void;
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
              <TableHead className="text-right">תאריך פתיחה</TableHead>
              <TableHead className="text-right">סטטוס מס</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-6">
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
                  <TableCell><Input className="h-7 w-28" value={entry.provider} onChange={(e) => onUpdate(entry.id, "provider", e.target.value)} /></TableCell>
                  <TableCell><Input className="h-7 w-36" value={entry.investmentTrack} onChange={(e) => onUpdate(entry.id, "investmentTrack", e.target.value)} /></TableCell>
                  <TableCell><Input type="number" min="0" className="h-7 w-24" value={entry.balance || ""} onChange={(e) => onUpdate(entry.id, "balance", Math.max(0, Number(e.target.value)))} /></TableCell>
                  <TableCell><Input type="number" min="0" className="h-7 w-24" value={entry.monthlyDeposit || ""} onChange={(e) => onUpdate(entry.id, "monthlyDeposit", Math.max(0, Number(e.target.value)))} /></TableCell>
                  <TableCell><Input type="number" min="0" step="0.01" className="h-7 w-20" value={entry.accumulationFee || ""} onChange={(e) => onUpdate(entry.id, "accumulationFee", Math.max(0, Number(e.target.value)))} /></TableCell>
                  <TableCell><Input type="number" min="0" step="0.1" className="h-7 w-16" value={entry.annualReturn || ""} onChange={(e) => onUpdate(entry.id, "annualReturn", Math.max(0, Number(e.target.value)))} /></TableCell>
                  <TableCell><Input type="date" className="h-7 w-32" value={entry.openingDate ?? ""} onChange={(e) => onUpdate(entry.id, "openingDate", e.target.value)} /></TableCell>
                  <TableCell><TaxBadge openingDate={entry.openingDate} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows.has(entry.id) && (
                  <TableRow key={`${entry.id}-calc`}>
                    <TableCell colSpan={11} className="p-0">
                      <div className="px-4 pb-3">
                        <CompoundInterestCalculator
                          defaultOneTime={entry.balance}
                          defaultMonthly={entry.monthlyDeposit}
                          defaultRate={entry.annualReturn || 6}
                          defaultAccumulationFee={entry.accumulationFee}
                          fundName={entry.investmentTrack}
                          managingCompany={entry.provider}
                          taxRate={0}
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

type Tab = string; // שמות הבעלים + "ביחד"

const StudyFundSection = ({ entries, onChange, ownerOptions }: StudyFundSectionProps) => {
  const tabs: Tab[] = [...ownerOptions.map((o) => o.value), "ביחד"];
  const [activeTab, setActiveTab] = useState<Tab>(ownerOptions[0]?.value ?? "ביחד");

  const totalBalance = entries.reduce((s, e) => s + e.balance, 0);

  const addEntry = (ownerName?: string) => {
    const newEntry: StudyFundEntry = {
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
      openingDate: "",
    };
    onChange([...entries, newEntry]);
  };

  const deleteEntry = (id: string) => onChange(entries.filter((e) => e.id !== id));
  const updateEntry = (id: string, field: keyof StudyFundEntry, value: string | number) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  const renderOwnerView = (ownerName: string) => {
    const mine = entries.filter((e) => e.owner === ownerName);
    const myTotal = mine.reduce((s, e) => s + e.balance, 0);
    const exemptCount = mine.filter((e) => taxExemptionStatus(e.openingDate)?.exempt).length;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>סה״כ: <strong className="text-foreground">{formatCurrency(myTotal)}</strong></span>
          {exemptCount > 0 && (
            <span className="text-accent font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {exemptCount} קרן/ות פטורה/ות ממס
            </span>
          )}
        </div>
        <OwnerStudyTable
          entries={mine}
          ownerOptions={ownerOptions}
          onAdd={() => addEntry(ownerName)}
          onDelete={deleteEntry}
          onUpdate={updateEntry}
        />
      </div>
    );
  };

  const renderCombinedView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {ownerOptions.map((o) => {
          const mine = entries.filter((e) => e.owner === o.value);
          const total = mine.reduce((s, e) => s + e.balance, 0);
          const exempt = mine.filter((e) => taxExemptionStatus(e.openingDate)?.exempt);
          const pending = mine.filter((e) => {
            const s = taxExemptionStatus(e.openingDate);
            return s && !s.exempt;
          });
          return (
            <div key={o.value} className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="font-bold text-sm text-primary font-display">{o.label}</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {exempt.length > 0 && (
                  <p className="text-accent flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {exempt.length} פטורה/ות ממס: {formatCurrency(exempt.reduce((s, e) => s + e.balance, 0))}
                  </p>
                )}
                {pending.map((e) => {
                  const s = taxExemptionStatus(e.openingDate);
                  return s ? (
                    <p key={e.id} className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {e.provider || e.investmentTrack}: פטור ב-{s.exemptDate}
                    </p>
                  ) : null;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-center">
        <p className="text-sm text-muted-foreground">סה״כ משפחתי</p>
        <p className="text-2xl font-bold text-accent">{formatCurrency(totalBalance)}</p>
      </div>
    </div>
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-accent" />
          <CardTitle className="font-display text-xl">קרנות השתלמות</CardTitle>
          <span className="text-sm text-muted-foreground mr-2">
            סה״כ: {formatCurrency(totalBalance)}
          </span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-accent text-accent-foreground"
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

export default StudyFundSection;
export type { StudyFundEntry as StudyEntry };
