import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, CheckCircle, AlertCircle, Loader2, Database } from "lucide-react";
import { createTransaction, getTransactionStatus, fetchPensionData, MislakaPolicy } from "@/services/mislakaApi";
import type { FundEntry } from "@/components/FundSection";

interface MislakaSyncProps {
  onImport: (pension: FundEntry[], study: FundEntry[], gemel: FundEntry[]) => void;
}

type Step = "idle" | "enter_id" | "waiting_sms" | "loading" | "success" | "error";

function policyToFundEntry(p: MislakaPolicy): FundEntry {
  return {
    id: crypto.randomUUID(),
    owner: p.owner || "ישי",
    provider: p.institutionName,
    investmentTrack: p.investmentTrack,
    balance: p.balance,
    depositFee: p.depositFee,
    accumulationFee: p.accumulationFee,
    annualReturn: p.annualReturn,
    monthlyDeposit: p.monthlyDeposit,
    lastUpdated: p.lastUpdated,
    fundType: p.productType,
  };
}

const MislakaSync = ({ onImport }: MislakaSyncProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [idNumber, setIdNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  const handleOpen = () => {
    setStep("enter_id");
    setIdNumber("");
    setTransactionId("");
    setError("");
    setOpen(true);
  };

  const handleSendSMS = async () => {
    if (!/^\d{9}$/.test(idNumber)) {
      setError("נא להזין תעודת זהות תקינה (9 ספרות)");
      return;
    }
    setError("");
    setStep("loading");
    try {
      const tx = await createTransaction(idNumber);
      setTransactionId(tx.id);
      setStep("waiting_sms");
    } catch (e: any) {
      setError(e.message ?? "שגיאה בשליחת הבקשה");
      setStep("enter_id");
    }
  };

  const handleFetchData = async () => {
    setError("");
    setStep("loading");
    try {
      // בדיקת סטטוס
      let status = await getTransactionStatus(transactionId);
      if (status.status === "failed") throw new Error("האישור נכשל — נסה שוב");

      // משיכת הנתונים
      const data = await fetchPensionData(transactionId);

      // מיון לפי סוג מוצר
      const pension: FundEntry[] = [];
      const study: FundEntry[] = [];
      const gemel: FundEntry[] = [];

      for (const p of data.policies) {
        const entry = policyToFundEntry(p);
        if (p.productType === "פנסיה") pension.push(entry);
        else if (p.productType === "קרן השתלמות") study.push(entry);
        else gemel.push(entry);
      }

      setImportedCount(data.policies.length);
      onImport(pension, study, gemel);
      setStep("success");
    } catch (e: any) {
      setError(e.message ?? "שגיאה במשיכת הנתונים");
      setStep("waiting_sms");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep("idle");
  };

  return (
    <>
      <Button onClick={handleOpen} variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
        <Database className="h-4 w-4" />
        סנכרן מהמסלקה הפנסיונית
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              סנכרון עם המסלקה הפנסיונית
            </DialogTitle>
            <DialogDescription>
              משיכת נתוני פנסיה, קרנות השתלמות וקופות גמל ישירות מהמסלקה הפנסיונית הלאומית
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">

            {/* שלב 1: הזנת ת"ז */}
            {(step === "enter_id" || step === "loading") && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">תעודת זהות</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="000000000"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                    disabled={step === "loading"}
                    className="text-center text-lg tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    יישלח קוד אימות ב-SMS למספר הרשום במסלקה
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </p>
                )}
                <Button onClick={handleSendSMS} disabled={step === "loading"} className="w-full">
                  {step === "loading" ? (
                    <><Loader2 className="h-4 w-4 animate-spin ml-2" />שולח בקשה...</>
                  ) : "שלח קוד SMS"}
                </Button>
              </div>
            )}

            {/* שלב 2: המתנה לאישור SMS */}
            {step === "waiting_sms" && (
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-4 text-center space-y-2">
                  <p className="text-sm font-medium">נשלח קוד SMS לטלפון שלך</p>
                  <p className="text-xs text-muted-foreground">
                    אשר את הקוד שקיבלת בטלפון, ואז לחץ "משוך נתונים"
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("enter_id")} className="flex-1">
                    חזרה
                  </Button>
                  <Button onClick={handleFetchData} className="flex-1">
                    משוך נתונים
                  </Button>
                </div>
              </div>
            )}

            {/* שלב 3: טעינה */}
            {step === "loading" && (
              <div className="text-center py-6 space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">מושך נתונים מהמסלקה...</p>
              </div>
            )}

            {/* שלב 4: הצלחה */}
            {step === "success" && (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="h-12 w-12 text-accent mx-auto" />
                <div>
                  <p className="font-bold text-lg">הנתונים יובאו בהצלחה!</p>
                  <p className="text-sm text-muted-foreground">
                    {importedCount} מוצרים יובאו לדשבורד
                  </p>
                </div>
                <Button onClick={handleClose} className="w-full">סגור</Button>
              </div>
            )}

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground text-center">
                הנתונים מגיעים ישירות מהמסלקה הפנסיונית הלאומית ·{" "}
                <span className="text-primary">מאובטח</span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MislakaSync;
