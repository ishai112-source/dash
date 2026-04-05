import { useState, useEffect } from "react";
import SummaryCards from "@/components/SummaryCards";
import { FundEntry } from "@/components/FundSection";
import PensionSection, { OwnerConfig } from "@/components/PensionSection";
import StudyFundSection from "@/components/StudyFundSection";
import PensionCharts from "@/components/PensionCharts";
import MortgageSection, { MortgageData } from "@/components/MortgageSection";
import ChildSavingsSection, { ChildSavingsData } from "@/components/ChildSavingsSection";
import EmergencyFundSection, { EmergencyFundData } from "@/components/EmergencyFundSection";
const ADULT_OWNERS = [
  { value: "ישי", label: "ישי" },
  { value: "מיכל", label: "מיכל" },
];

const sumBalance = (entries: FundEntry[]) => entries.reduce((s, e) => s + e.balance, 0);

const DATA_VERSION = "7";

// נתוני ישי מהמסלקה הפנסיונית (SwiftNess 17/03/2026)
const DEFAULT_PENSION: FundEntry[] = [
  {
    id: "menora-yishai-1",
    owner: "ישי",
    provider: "מנורה מבטחים פנסיה וגמל",
    investmentTrack: "עוקב מדדי מניות",
    balance: 642074,
    depositFee: 0,
    accumulationFee: 0.10,
    annualReturn: 3.71,
    monthlyDeposit: 2500,
    lastUpdated: "2026-03-17",
    fundType: "פנסיה",
  },
];

// נתוני ישי ממיטב — 5 חשבונות מתקופות עבודה שונות (SwiftNess 17/03/2026)
// סה"כ: 75,600 + 30,234 + 27,278 + 7,022 + 23,349 = 163,483
const DEFAULT_STUDY: FundEntry[] = [
  {
    // תקופת עבודה ראשונה — פתוח מרץ 2017, פטור ממס מ-מרץ 2023
    id: "mitav-yishai-1",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מיטב השתלמות מניות סחיר",
    balance: 75600,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 2.39,
    monthlyDeposit: 0,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2017-03-01",
  },
  {
    // תקופת עבודה שנייה — פתוח מרץ 2019, פטור ממס מ-מרץ 2025
    id: "mitav-yishai-2",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מיטב השתלמות מניות סחיר",
    balance: 30234,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 2.39,
    monthlyDeposit: 0,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2019-03-01",
  },
  {
    // תקופת עבודה שלישית — פתוח יולי 2021, פטור ממס מ-יולי 2027
    id: "mitav-yishai-3",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מיטב השתלמות מניות סחיר",
    balance: 27278,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 2.39,
    monthlyDeposit: 0,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2021-07-01",
  },
  {
    // תקופת עבודה רביעית — פתוח נובמבר 2022, פטור ממס מ-נובמבר 2028
    id: "mitav-yishai-4",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מיטב השתלמות מניות סחיר",
    balance: 7022,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 2.39,
    monthlyDeposit: 0,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2022-11-01",
  },
  {
    // חשבון פעיל — מעסיק נוכחי, פתוח מרץ 2025, פטור ממס מ-מרץ 2031
    id: "mitav-yishai-5",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מיטב השתלמות מניות סחיר",
    balance: 23349,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 2.39,
    monthlyDeposit: 2000,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2025-03-01",
  },
];

const DEFAULT_MORTGAGE: MortgageData = { tracks: [] };
const DEFAULT_EMERGENCY: EmergencyFundData = { balance: 12567, target: 70000, monthlyDeposit: 600, monthlyExpenses: 14000 };
const DEFAULT_CHILD_SAVINGS: ChildSavingsData = {
  children: [
    {
      name: "מתן",
      birthDate: new Date(2012, 4, 18),
      age30: { balance: 38601, monthlyDeposit: 200, targetYear: 2042 },
    },
    {
      name: "אורי",
      birthDate: new Date(2016, 3, 13),
      barMitzvah: { balance: 5479, monthlyDeposit: 462, target: 30000, targetDate: new Date(2029, 3, 1) },
      age30: { balance: 29237, monthlyDeposit: 200, targetYear: 2046 },
    },
    {
      name: "דניאל",
      birthDate: new Date(2022, 3, 11),
      barMitzvah: { balance: 3028, monthlyDeposit: 240, target: 30000, targetDate: new Date(2035, 3, 1) },
      age30: { balance: 5087, monthlyDeposit: 200, targetYear: 2052 },
    },
  ],
};

const DEFAULT_OWNER_CONFIGS: OwnerConfig[] = [
  // מקדם קצבה לישי: נגזר מהחישוב של מנורה מבטחים עצמה — 2,918,941 ÷ 7,380 ≈ 395
  // officialMonthlyPension: קצבה רשמית לפי מנורה (KITZVAT-HODSHIT-TZFUYA מה-XML)
  { name: "ישי", birthYear: 1983, retirementAge: 67, annuityFactor: 395, officialMonthlyPension: 7380 },
  // מקדם קצבה למיכל: ברירת מחדל לאישה גיל 65 — יש לעדכן לפי חישוב קרן הפנסיה שלה
  { name: "מיכל", birthYear: 1986, retirementAge: 65, annuityFactor: 420 },
];

function isVersioned(): boolean {
  return localStorage.getItem("dataVersion") === DATA_VERSION;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    if (!isVersioned()) return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadChildSavings(): ChildSavingsData {
  try {
    if (!isVersioned()) return DEFAULT_CHILD_SAVINGS;
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
  const [pensionEntries, setPensionEntries] = useState<FundEntry[]>(() => loadJSON("pension", DEFAULT_PENSION));
  const [studyEntries, setStudyEntries] = useState<FundEntry[]>(() => loadJSON("study", DEFAULT_STUDY));
  const [mortgageData, setMortgageData] = useState<MortgageData>(() => loadJSON("mortgage", DEFAULT_MORTGAGE));
  const [childSavings, setChildSavings] = useState<ChildSavingsData>(loadChildSavings);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFundData>(() => loadJSON("emergency", DEFAULT_EMERGENCY));
  const [ownerConfigs, setOwnerConfigs] = useState<OwnerConfig[]>(() => loadJSON("ownerConfigs", DEFAULT_OWNER_CONFIGS));

  useEffect(() => { localStorage.setItem("dataVersion", DATA_VERSION); }, []);
  useEffect(() => { localStorage.setItem("pension", JSON.stringify(pensionEntries)); }, [pensionEntries]);
  useEffect(() => { localStorage.setItem("study", JSON.stringify(studyEntries)); }, [studyEntries]);
  useEffect(() => { localStorage.setItem("mortgage", JSON.stringify(mortgageData)); }, [mortgageData]);
  useEffect(() => { localStorage.setItem("childSavings", JSON.stringify(childSavings)); }, [childSavings]);
  useEffect(() => { localStorage.setItem("emergency", JSON.stringify(emergencyFund)); }, [emergencyFund]);
  useEffect(() => { localStorage.setItem("ownerConfigs", JSON.stringify(ownerConfigs)); }, [ownerConfigs]);

  const totalChildSavings = childSavings.children.reduce(
    (s, c) => s + (c.barMitzvah?.balance || 0) + c.age30.balance, 0
  );

  const allEntries = [
    ...pensionEntries.map((e) => ({ ...e, fundType: "פנסיה" })),
    ...studyEntries.map((e) => ({ ...e, fundType: "קרן השתלמות" })),
  ];

  const totalMortgageBalance = (mortgageData.tracks ?? []).reduce((s, t) => s + t.balance, 0);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-display">לוח בקרה פיננסי משפחת רוזנבאום</h1>
          <p className="text-muted-foreground">ניהול נכסים, פנסיה ומשכנתא במקום אחד</p>
        </header>

        <SummaryCards
          totalPension={sumBalance(pensionEntries)}
          totalStudyFunds={sumBalance(studyEntries)}
          totalChildSavings={totalChildSavings}
          emergencyFund={emergencyFund.balance}
          mortgageBalance={totalMortgageBalance}
        />

        {/* פנסיה — עם הפרדה לבעלים + קצבה צפויה */}
        <PensionSection
          pensionEntries={pensionEntries}
          studyEntries={studyEntries}
          onPensionChange={setPensionEntries}
          ownerOptions={ADULT_OWNERS}
          ownerConfigs={ownerConfigs}
          onOwnerConfigsChange={setOwnerConfigs}
        />

        {/* קרנות השתלמות — עם הפרדה לבעלים + פטור ממס */}
        <StudyFundSection
          entries={studyEntries}
          onChange={setStudyEntries}
          ownerOptions={ADULT_OWNERS}
        />

        <ChildSavingsSection data={childSavings} onChange={setChildSavings} />
        <EmergencyFundSection data={emergencyFund} onChange={setEmergencyFund} />

        <PensionCharts entries={allEntries} />
        <MortgageSection data={mortgageData} onChange={setMortgageData} />
      </div>
    </div>
  );
};

export default Index;
