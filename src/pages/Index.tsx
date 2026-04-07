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

const DATA_VERSION = "13";

// נתוני ישי מהמסלקה הפנסיונית (SwiftNess 17/03/2026)
// נתוני מיכל מאלטשול (דוח שנתי 31/12/2025)
const DEFAULT_PENSION: FundEntry[] = [
  {
    id: "menora-yishai-1",
    owner: "ישי",
    provider: "מנורה מבטחים פנסיה וגמל",
    investmentTrack: "עוקב מדדי מניות",
    balance: 642074,
    depositFee: 0,
    accumulationFee: 0.10,
    annualReturn: 6,
    monthlyDeposit: 2500,
    lastUpdated: "2026-03-17",
    fundType: "פנסיה",
  },
  {
    // פוליסה 043393610 — S&P 500 (עם חלק קטן מסלול 50) — הופעלה אפריל 2025
    id: "altshul-michal-1",
    owner: "מיכל",
    provider: "אלטשול שחם פנסיה",
    investmentTrack: "S&P 500",
    balance: 230574,
    depositFee: 1.20,
    accumulationFee: 0.10,
    annualReturn: 7,
    monthlyDeposit: 3333,
    lastUpdated: "2025-12-31",
    fundType: "פנסיה",
  },
];

// נתוני ישי ממיטב — 5 חשבונות מתקופות עבודה שונות (SwiftNess 17/03/2026)
// סה"כ ישי: 75,600 + 30,234 + 27,278 + 7,022 + 23,349 = 163,483
// נתוני מיכל מכלל + אלטשול (דוח שנתי 31/12/2025)
// סה"כ מיכל: 46,597 + 13,878 + 13,617 = 74,092
const DEFAULT_STUDY: FundEntry[] = [
  {
    // תגלית (ישראל זכות מלידה) 2017–2019 — פטור ממס מ-מרץ 2023
    id: "mitav-yishai-1",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מניות סחיר — תגלית 2017–2019",
    balance: 75600,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 6,
    monthlyDeposit: 0,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2017-03-01",
  },
  {
    // טללים כנסים ואירועים 2019–2020 — פטור ממס מ-מרץ 2025
    id: "mitav-yishai-2",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מניות סחיר — טללים 2019–2020",
    balance: 30234,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 6,
    monthlyDeposit: 0,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2019-03-01",
  },
  {
    // בית יציב 2021–2022 — פטור ממס מ-יולי 2027
    id: "mitav-yishai-3",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מניות סחיר — בית יציב 2021–2022",
    balance: 27278,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 6,
    monthlyDeposit: 0,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2021-07-01",
  },
  {
    // מרכז לחינוך סייבר + ג'י הייצ' 2022–2025 — פטור ממס מ-נובמבר 2028
    id: "mitav-yishai-4",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מניות סחיר — סייבר/ג'י הייצ' 2022–2025",
    balance: 7022,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 6,
    monthlyDeposit: 0,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2022-11-01",
  },
  {
    // פיסגה 2025–כיום (פעיל) — פטור ממס מ-מרץ 2031
    id: "mitav-yishai-5",
    owner: "ישי",
    provider: "מיטב גמל ופנסיה",
    investmentTrack: "מניות סחיר — פיסגה 2025–כיום",
    balance: 23349,
    depositFee: 0,
    accumulationFee: 0.08,
    annualReturn: 6,
    monthlyDeposit: 2000,
    lastUpdated: "2026-03-17",
    fundType: "קרן השתלמות",
    openingDate: "2025-03-01",
  },
  {
    // כלל חשבון 10403415 — פטורה ממס מ-31/01/2024 (6 שנים מ-01/01/2018)
    id: "clal-michal-1",
    owner: "מיכל",
    provider: "כלל פנסיה וגמל",
    investmentTrack: "S&P 500",
    balance: 46597,
    depositFee: 0,
    accumulationFee: 0.48,
    annualReturn: 7,
    monthlyDeposit: 0,
    lastUpdated: "2025-12-31",
    fundType: "קרן השתלמות",
    openingDate: "2018-01-01",
  },
  {
    // כלל חשבון 10401987 — פטורה ממס מ-30/08/2029 (6 שנים מ-01/08/2023)
    id: "clal-michal-2",
    owner: "מיכל",
    provider: "כלל פנסיה וגמל",
    investmentTrack: "S&P 500",
    balance: 13878,
    depositFee: 0,
    accumulationFee: 0.48,
    annualReturn: 7,
    monthlyDeposit: 0,
    lastUpdated: "2025-12-31",
    fundType: "קרן השתלמות",
    openingDate: "2023-08-01",
  },
  {
    // אלטשול חשבון 44445400 (פעיל) — פטורה ממס מ-31/03/2031 (6 שנים מ-01/03/2025)
    id: "altshul-michal-study-1",
    owner: "מיכל",
    provider: "אלטשול שחם פנסיה",
    investmentTrack: "S&P 500",
    balance: 13617,
    depositFee: 0,
    accumulationFee: 0.66,
    annualReturn: 7,
    monthlyDeposit: 1571,
    lastUpdated: "2025-12-31",
    fundType: "קרן השתלמות",
    openingDate: "2025-03-01",
  },
];

// נתוני משכנתא מדוח בנק לאומי 06/04/2026 — 2 חשבונות, 6 מסלולים
// סה"כ יתרה: ₪1,293,313 | תשלום חודשי: ₪6,526/חודש
// ⚠️ מסלול 3: שינוי ריבית ב-10/04/2026 (עוד 4 ימים מתאריך הדוח!)
const DEFAULT_MORTGAGE: MortgageData = {
  tracks: [
    {
      id: "mortgage-track-1",
      label: "פריים − 0.60%",
      balance: 409074,
      monthlyPayment: 2220,
      interestRate: 4.90,
      yearsRemaining: 25,
      isIndexed: false,
      rateFormula: "פריים − 0.60%",
      nextRateChangeDate: undefined,
    },
    {
      id: "mortgage-track-2",
      label: "קבועה לא צמודה (70K)",
      balance: 59922,
      monthlyPayment: 330,
      interestRate: 2.95,
      yearsRemaining: 20,
      isIndexed: false,
      rateFormula: "2.95% קבוע",
      nextRateChangeDate: undefined,
    },
    {
      // ⚠️ דחוף: ריבית קבועה צמודה → פריים+3.5% ב-10/04/2026
      // קנס פירעון מוקדם: כנראה 0 (ריבית שוק > ריבית מסלול)
      id: "mortgage-track-3",
      label: "קבועה צמודה → פריים+3.5%",
      balance: 250299,
      monthlyPayment: 1108,
      interestRate: 2.44,
      yearsRemaining: 25,
      isIndexed: true,
      rateFormula: 'עד 10/04/2026: 2.44%; אח"כ פריים+3.50%',
      nextRateChangeDate: "2026-04-10",
    },
    {
      id: "mortgage-track-4",
      label: "קבועה צמודה",
      balance: 197814,
      monthlyPayment: 993,
      interestRate: 1.95,
      yearsRemaining: 20,
      isIndexed: true,
      rateFormula: "1.95% קבוע + מדד",
      nextRateChangeDate: undefined,
    },
    {
      id: "mortgage-track-5",
      label: "פריים+3.5% (60 חודש)",
      balance: 179314,
      monthlyPayment: 790,
      interestRate: 9.00,
      yearsRemaining: 25,
      isIndexed: true,
      rateFormula: "פריים + 3.50%",
      nextRateChangeDate: "2031-03-10",
    },
    {
      id: "mortgage-track-6",
      label: "קבועה לא צמודה (230K)",
      balance: 196890,
      monthlyPayment: 1085,
      interestRate: 2.95,
      yearsRemaining: 20,
      isIndexed: false,
      rateFormula: "2.95% קבוע",
      nextRateChangeDate: undefined,
    },
  ],
};
const DEFAULT_EMERGENCY: EmergencyFundData = { balance: 12567, target: 70000, monthlyDeposit: 600, monthlyExpenses: 14000 };
const DEFAULT_CHILD_SAVINGS: ChildSavingsData = {
  children: [
    {
      name: "מתן",
      birthDate: new Date(2012, 4, 18),
      age30: {
        balance: 38023,
        monthlyDeposit: 200,
        targetYear: 2042,
        fundName: "מור גמל להשקעה",
        fundNumber: "233720",
        managingCompany: "מור גמל ופנסיה",
      },
    },
    {
      name: "אורי",
      birthDate: new Date(2016, 3, 13),
      barMitzvah: {
        balance: 4417,
        monthlyDeposit: 462,
        target: 30000,
        targetDate: new Date(2029, 3, 1),
        fundName: "מור גמל להשקעה",
        fundNumber: "1134961",
        managingCompany: "מור גמל ופנסיה",
      },
      age30: {
        balance: 28704,
        monthlyDeposit: 200,
        targetYear: 2046,
        fundName: "מור גמל להשקעה",
        fundNumber: "233685",
        managingCompany: "מור גמל ופנסיה",
      },
    },
    {
      name: "דניאל",
      birthDate: new Date(2022, 3, 11),
      barMitzvah: {
        balance: 2406,
        monthlyDeposit: 240,
        target: 30000,
        targetDate: new Date(2035, 3, 1),
        fundName: "מור גמל להשקעה",
        fundNumber: "1134985",
        managingCompany: "מור גמל ופנסיה",
      },
      age30: {
        balance: 4669,
        monthlyDeposit: 200,
        targetYear: 2052,
        fundName: "מור גמל להשקעה",
        fundNumber: "900761",
        managingCompany: "מור גמל ופנסיה",
      },
    },
  ],
};

const DEFAULT_OWNER_CONFIGS: OwnerConfig[] = [
  // מקדם קצבה לישי: נגזר מהחישוב של מנורה מבטחים עצמה — 2,918,941 ÷ 7,380 ≈ 395
  // officialMonthlyPension: קצבה רשמית לפי מנורה (KITZVAT-HODSHIT-TZFUYA מה-XML)
  { name: "ישי", birthYear: 1983, retirementAge: 67, annuityFactor: 395, officialMonthlyPension: 7380 },
  // מקדם קצבה למיכל: ברירת מחדל לאישה גיל 65 — יש לעדכן לפי חישוב קרן הפנסיה שלה
  // officialMonthlyPension: קצבה רשמית לפי אלטשול (דוח שנתי 31/12/2025, צפי לגיל 67)
  { name: "מיכל", birthYear: 1986, retirementAge: 65, annuityFactor: 420, officialMonthlyPension: 2822 },
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
