import { useState } from "react";
import SummaryCards from "@/components/SummaryCards";
import FundSection, { FundEntry } from "@/components/FundSection";
import PensionCharts from "@/components/PensionCharts";
import MortgageSection, { MortgageData } from "@/components/MortgageSection";
import ChildSavingsSection, { ChildSavingsData } from "@/components/ChildSavingsSection";
import EmergencyFundSection, { EmergencyFundData } from "@/components/EmergencyFundSection";
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

const Index = () => {
  const [pensionEntries, setPensionEntries] = useState<FundEntry[]>([]);
  const [studyEntries, setStudyEntries] = useState<FundEntry[]>([]);
  const [gemelEntries, setGemelEntries] = useState<FundEntry[]>([]);
  const [mortgageData, setMortgageData] = useState<MortgageData>({
    balance: 0, monthlyPayment: 0, interestRate: 0, yearsRemaining: 0,
  });
  const [childSavings, setChildSavings] = useState<ChildSavingsData>({
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
  });
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFundData>({ balance: 0, target: 0 });

  const totalChildSavings = childSavings.children.reduce(
    (s, c) => s + (c.barMitzvah?.balance || 0) + c.age30.balance, 0
  );

  const allEntries = [...pensionEntries, ...studyEntries, ...gemelEntries];

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
          totalGemel={sumBalance(gemelEntries)}
          totalChildSavings={totalChildSavings}
          emergencyFund={emergencyFund.balance}
          mortgageBalance={mortgageData.balance}
        />

        <FundSection title="פנסיה" icon={Wallet} entries={pensionEntries} onChange={setPensionEntries} ownerOptions={ADULT_OWNERS} />
        <FundSection title="קרנות השתלמות" icon={GraduationCap} entries={studyEntries} onChange={setStudyEntries} ownerOptions={ADULT_OWNERS} />
        <FundSection title="קופות גמל" icon={PiggyBank} entries={gemelEntries} onChange={setGemelEntries} ownerOptions={GEMEL_OWNERS} />

        <ChildSavingsSection data={childSavings} onChange={setChildSavings} />
        <EmergencyFundSection data={emergencyFund} onChange={setEmergencyFund} />

        <PensionCharts entries={allEntries as any} />
        <MortgageSection data={mortgageData} onChange={setMortgageData} />
      </div>
    </div>
  );
};

export default Index;
