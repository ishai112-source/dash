import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Home, Wallet, GraduationCap, Baby, ShieldCheck, BarChart3 } from "lucide-react";

interface SummaryCardsProps {
  totalPension: number;
  totalStudyFunds: number;
  totalChildSavings: number;
  emergencyFund: number;
  mortgageBalance: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(value);

const SummaryCards = ({ totalPension, totalStudyFunds, totalChildSavings, emergencyFund, mortgageBalance }: SummaryCardsProps) => {
  const totalPensionAssets = totalPension + totalStudyFunds;
  const totalAssets = totalPensionAssets + totalChildSavings + emergencyFund;
  const netWorth = totalAssets - mortgageBalance;

  const cards = [
    { label: "סך פנסיות", value: totalPension, icon: Wallet, colorClass: "text-primary" },
    { label: "סך קרנות השתלמות", value: totalStudyFunds, icon: GraduationCap, colorClass: "text-accent" },
    { label: "סך חסכונות ילדים", value: totalChildSavings, icon: Baby, colorClass: "text-primary" },
    { label: "קרן חירום", value: emergencyFund, icon: ShieldCheck, colorClass: "text-accent" },
    { label: "יתרת משכנתא", value: mortgageBalance, icon: Home, colorClass: "text-destructive" },
    { label: "הון פנסיוני כולל", value: totalAssets, icon: BarChart3, colorClass: "text-primary" },
    { label: "הון משפחתי נטו", value: netWorth, icon: TrendingUp, colorClass: netWorth >= 0 ? "text-accent" : "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-display leading-tight">{card.label}</span>
              <card.icon className={`h-3.5 w-3.5 ${card.colorClass} shrink-0`} />
            </div>
            <p className={`text-sm font-bold font-display ${card.colorClass}`}>
              {formatCurrency(card.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;
