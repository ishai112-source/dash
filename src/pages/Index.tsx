import { useState, useEffect } from "react";
import SummaryCards from "@/components/SummaryCards";
import FundSection, { FundEntry } from "@/components/FundSection";
import PensionCharts from "@/components/PensionCharts";
import MortgageSection, { MortgageData } from "@/components/MortgageSection";
import ChildSavingsSection, { ChildSavingsData } from "@/components/ChildSavingsSection";
import EmergencyFundSection, { EmergencyFundData } from "@/components/EmergencyFundSection";
import MislakaSync from "@/components/MislakaSync";
import { Wallet, GraduationCap, PiggyBank } from "lucide-react";

const ADULT_OWNERS = [
  { value: "ישי", label: "ישי" },
  { value: "מיכל", label: "מיכל" },
];

const GEMEL_OWNERS = [
  { value: "ישי", label: "ישי" },
  { value: "מיכל", label: "מיכל" },
];

const sumBalance = (entries: FundEntry[]) => entries.reduce((s, e) => s + e.balance, 0);

const DEFAULT_MORTGAGE: MortgageData = { balance: 0, monthlyPayment: 0, interestRate: 0, yearsRemaining: 0 };
const DEFAULT_EMERGENCY: EmergencyFundData = { balance: 0, target: 0 };
const DEFAULT_CHILD_SAVINGS: ChildSavingsData = {
  children: [
    {
      name: "מתן",
      birthDate: new Date(2012, 4, 18),
      age30: { balance: 0, monthlyDeposit: 200, targetYear: 2042 },
    },
    {
      name: "אורי",
      birthDate: new Date(2016, 3, 13),
      barMitzvah: { balance: 0, monthlyDeposit: 0, target: 30000, targetDate: new Date(2029, 3, 1) },
      age30: { balance: 0, monthlyDeposit: 200, targetYear: 2046 },
    },
    {
      name: "דניאל",
      birthDate: new Date(2022, 3, 11),
      barMitzvah: { balance: 0, monthlyDeposit: 0, target: 30000, targetDate: new Date(2035, 3, 1) },
      age30: { balance: 0, monthlyDeposit: 200, targetYear: 2052 },
    },
  ],
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadChildSavings(): ChildSavingsData {
  try {
    const raw = localStorage.getItem("childSavings");
    if (!raw) return DEFAULT_CHILD_SAVINGS;
    const data = JSON.parse(raw);
    return {
      children: data.children.map((c: any) => ({
        ...c,
        birthDate: new Date(c.birthDate),
        barMitzvah: c.barMitzvah
          ? { ...c.barMitzvah, targetDate: new Date(c.barMitzvah.targetDate) }
          : undefined,
      })),
    };
  } catch {
    return DEFAULT_CHILD_SAVINGS;
  }
}

const Index = () => {
  const [pensionEntries, setPensionEntries] = useState<FundEntry[]>(() => loadJSON("pension", []));
  const [studyEntries, setStudyEntries] = useState<FundEntry[]>(() => loadJSON("study", []));
  const [gemelEntries, setGemelEntries] = useState<FundEntry[]>(() => loadJSON("gemel", []));
  const [mortgageData, setMortgageData] = useState<MortgageData>(() => loadJSON("mortgage", DEFAULT_MORTGAGE));
  const [childSavings, setChildSavings] = useState<ChildSavingsData>(loadChildSavings);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFundData>(() => loadJSON("emergency", DEFAULT_EMERGENCY));

  useEffect(() => { localStorage.setItem("pension", JSON.stringify(pensionEntries)); }, [pensionEntries]);
  useEffect(() => { localStorage.setItem("study", JSON.stringify(studyEntries)); }, [studyEntries]);
  useEffect(() => { localStorage.setItem("gemel", JSON.stringify(gemelEntries)); }, [gemelEntries]);
  useEffect(() => { localStorage.setItem("mortgage", JSON.stringify(mortgageData)); }, [mortgageData]);
  useEffect(() => { localStorage.setItem("childSavings", JSON.stringify(childSavings)); }, [childSavings]);
  useEffect(() => { localStorage.setItem("emergency", JSON.stringify(emergencyFund)); }, [emergencyFund]);

  const totalChildSavings = childSavings.children.reduce(
    (s, c) => s + (c.barMitzvah?.balance || 0) + c.age30.balance, 0
  );

  const allEntries = [
    ...pensionEntries.map((e) => ({ ...e, fundType: "פנסיה" })),
    ...studyEntries.map((e) => ({ ...e, fundType: "קרן השתלמות" })),
    ...gemelEntries.map((e) => ({ ...e, fundType: "קופת גמל" })),
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-display">לוח בקרה פיננסי משפחת רוזנבאום</h1>
          <p className="text-muted-foreground">ניהול נכסים, פנסיה ומשכנתא במקום אחד</p>
          <div className="flex justify-center pt-2">
            <MislakaSync
              onImport={(pension, study, gemel) => {
                if (pension.length) setPensionEntries((prev) => [...prev, ...pension]);
                if (study.length) setStudyEntries((prev) => [...prev, ...study]);
                if (gemel.length) setGemelEntries((prev) => [...prev, ...gemel]);
              }}
            />
          </div>
        </header>

        <SummaryCards
          totalPension={sumBalance(pensionEntries)}
          totalStudyFunds={sumBalance(studyEntries)}
          totalGemel={sumBalance(gemelEntries)}
          totalChildSavings={totalChildSavings}
          emergencyFund={emergencyFund.balance}
          mortgageBalance={mortgageData.balance}
        />

        <FundSection title="פנסיה" icon={Wallet} entries={pensionEntries} onChange={setPensionEntries} ownerOptions={ADULT_OWNERS} defaultTaxRate={0.25} />
        <FundSection title="קרנות השתלמות" icon={GraduationCap} entries={studyEntries} onChange={setStudyEntries} ownerOptions={ADULT_OWNERS} defaultTaxRate={0} />
        <FundSection title="קופות גמל" icon={PiggyBank} entries={gemelEntries} onChange={setGemelEntries} ownerOptions={GEMEL_OWNERS} defaultTaxRate={0.25} />

        <ChildSavingsSection data={childSavings} onChange={setChildSavings} />
        <EmergencyFundSection data={emergencyFund} onChange={setEmergencyFund} />

        <PensionCharts entries={allEntries} />
        <MortgageSection data={mortgageData} onChange={setMortgageData} />
      </div>
    </div>
  );
};

export default Index;
