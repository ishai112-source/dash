import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CompoundInterestCalculator from "./CompoundInterestCalculator";

export interface FundEntry {
  id: string;
  owner: string;
  provider: string;
  investmentTrack: string;
  balance: number;
  depositFee: number;
  accumulationFee: number;
  annualReturn: number;
  monthlyDeposit: number;
  lastUpdated: string;
  fundType?: string;
}

interface FundSectionProps {
  title: string;
  icon: LucideIcon;
  entries: FundEntry[];
  onChange: (entries: FundEntry[]) => void;
  ownerOptions: { value: string; label: string }[];
  defaultTaxRate?: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(v);

type ColumnDef = {
  key: keyof FundEntry;
  label: string;
  type: "select" | "text" | "number" | "date";
  width: string;
  options?: { value: string; label: string }[];
  step?: string;
};

const FundSection = ({ title, icon: Icon, entries, onChange, ownerOptions, defaultTaxRate = 0.25 }: FundSectionProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const columns: ColumnDef[] = [
    { key: "owner", label: "בעלים", type: "select", width: "w-28", options: ownerOptions },
    { key: "provider", label: "חברה", type: "text", width: "w-36" },
    { key: "investmentTrack", label: "מסלול השקעה", type: "text", width: "w-52" },
    { key: "balance", label: "יתרה ₪", type: "number", width: "w-32" },
    { key: "depositFee", label: "דמי ניהול מהפקדה %", type: "number", width: "w-32", step: "0.01" },
    { key: "accumulationFee", label: "דמי ניהול מצבירה %", type: "number", width: "w-32", step: "0.01" },
    { key: "annualReturn", label: "תשואה %", type: "number", width: "w-28", step: "0.1" },
    { key: "monthlyDeposit", label: "הפקדה חודשית ₪", type: "number", width: "w-36" },
    { key: "lastUpdated", label: "תאריך עדכון", type: "date", width: "w-36" },
  ];

  const totalBalance = entries.reduce((sum, e) => sum + e.balance, 0);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addEntry = () => {
    const newEntry: FundEntry = {
      id: crypto.randomUUID(),
      owner: ownerOptions[0]?.value ?? "",
      provider: "",
      investmentTrack: "",
      balance: 0,
      depositFee: 0,
      accumulationFee: 0,
      annualReturn: 0,
      monthlyDeposit: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    onChange([...entries, newEntry]);
  };

  const updateEntry = (id: string, field: keyof FundEntry, value: string | number) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const deleteEntry = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  const renderCell = (entry: FundEntry, col: ColumnDef) => {
    const value = entry[col.key];
    if (col.type === "select") {
      return (
        <Select value={value as string} onValueChange={(v) => updateEntry(entry.id, col.key, v)}>
          <SelectTrigger className={`h-8 ${col.width}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            {(col.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        className={`h-8 ${col.width}`}
        type={col.type === "date" ? "date" : col.type === "number" ? "number" : "text"}
        step={col.step}
        min={col.type === "number" ? "0" : undefined}
        value={col.type === "number" ? ((value as number) || "") : (value as string)}
        placeholder={col.key === "investmentTrack" ? "לדוגמה: מסלול מניות" : undefined}
        onChange={(e) => updateEntry(entry.id, col.key, col.type === "number" ? Math.max(0, Number(e.target.value)) : e.target.value)}
      />
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="font-display text-xl">{title}</CardTitle>
          <span className="text-sm text-muted-foreground mr-2">
            סה״כ: {formatCurrency(totalBalance)}
          </span>
        </div>
        <Button size="sm" onClick={addEntry} className="gap-1">
          <Plus className="h-4 w-4" /> הוסף מסלול
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-10"></TableHead>
                {columns.map((col) => (
                  <TableHead key={col.key} className="text-right">{col.label}</TableHead>
                ))}
                <TableHead className="text-right w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center text-muted-foreground py-8">
                    לחץ "הוסף מסלול" כדי להתחיל
                  </TableCell>
                </TableRow>
              )}
              {entries.map((entry) => (
                <>
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRow(entry.id)}>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedRows.has(entry.id) ? "rotate-180" : ""}`} />
                      </Button>
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key}>{renderCell(entry, col)}</TableCell>
                    ))}
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(entry.id) && (
                    <TableRow key={`${entry.id}-calc`}>
                      <TableCell colSpan={columns.length + 2} className="p-0">
                        <div className="px-4 pb-4">
                          <CompoundInterestCalculator
                            defaultOneTime={entry.balance}
                            defaultMonthly={entry.monthlyDeposit}
                            defaultRate={entry.annualReturn || 6}
                            defaultAccumulationFee={entry.accumulationFee}
                            fundName={entry.investmentTrack}
                            managingCompany={entry.provider}
                            taxRate={defaultTaxRate}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default FundSection;
