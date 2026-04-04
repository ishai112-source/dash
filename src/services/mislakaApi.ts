const BASE_URL = "https://mislaka-api.co.il/api";
const API_KEY = import.meta.env.VITE_MISLAKA_API_KEY ?? "";

const headers = () => ({
  "Accept": "application/json",
  "Content-Type": "application/json",
  "Authorization": `token ${API_KEY}`,
});

export interface MislakaTransaction {
  id: string;
  status: "pending" | "waiting_auth" | "completed" | "failed";
  actionCode?: string;
}

export interface MislakaPolicy {
  institutionName: string;       // שם המוסד
  productType: string;           // סוג מוצר (פנסיה, השתלמות, גמל)
  balance: number;               // יתרה
  monthlyDeposit: number;        // הפקדה חודשית
  accumulationFee: number;       // דמי ניהול מצבירה
  depositFee: number;            // דמי ניהול מהפקדה
  annualReturn: number;          // תשואה שנתית
  investmentTrack: string;       // מסלול השקעה
  owner: string;                 // שם בעלים
  lastUpdated: string;           // תאריך עדכון
}

export interface MislakaData {
  policies: MislakaPolicy[];
}

/** שלב 1: יצירת טרנזקציה — שולח SMS עם קוד לבעל ת"ז */
export async function createTransaction(idNumber: string): Promise<MislakaTransaction> {
  const res = await fetch(`${BASE_URL}/transaction`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "harBituach",
      idNumber,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `שגיאה ביצירת בקשה (${res.status})`);
  }

  const data = await res.json();
  return {
    id: data.transactionId ?? data.id,
    status: "waiting_auth",
  };
}

/** שלב 2: בדיקת סטטוס הטרנזקציה */
export async function getTransactionStatus(transactionId: string): Promise<MislakaTransaction> {
  const res = await fetch(`${BASE_URL}/transaction/${transactionId}`, {
    headers: headers(),
  });

  if (!res.ok) throw new Error(`שגיאה בקבלת סטטוס (${res.status})`);

  const data = await res.json();
  return {
    id: transactionId,
    status: data.status,
    actionCode: data.actionCode,
  };
}

/** שלב 3: משיכת נתוני הר הביטוח לאחר אישור */
export async function fetchPensionData(transactionId: string): Promise<MislakaData> {
  const res = await fetch(`${BASE_URL}/transaction/harBituach/${transactionId}`, {
    headers: headers(),
  });

  if (!res.ok) throw new Error(`שגיאה במשיכת הנתונים (${res.status})`);

  const data = await res.json();
  return parsePolicies(data);
}

/** מיפוי נתוני ה-API למבנה האפליקציה */
function parsePolicies(raw: any): MislakaData {
  const policies: MislakaPolicy[] = [];

  const items: any[] = raw?.policies ?? raw?.data ?? raw?.items ?? [];

  for (const item of items) {
    const productType = detectProductType(item.productType ?? item.type ?? "");
    policies.push({
      institutionName: item.institutionName ?? item.companyName ?? "",
      productType,
      balance: Number(item.balance ?? item.currentBalance ?? 0),
      monthlyDeposit: Number(item.monthlyDeposit ?? item.deposit ?? 0),
      accumulationFee: Number(item.accumulationFee ?? item.managementFee ?? 0),
      depositFee: Number(item.depositFee ?? 0),
      annualReturn: Number(item.annualReturn ?? item.yield ?? 0),
      investmentTrack: item.investmentTrack ?? item.track ?? "",
      owner: item.ownerName ?? item.name ?? "",
      lastUpdated: item.lastUpdated ?? new Date().toISOString().split("T")[0],
    });
  }

  return { policies };
}

function detectProductType(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("pension") || lower.includes("פנסי")) return "פנסיה";
  if (lower.includes("hashtalm") || lower.includes("השתלמות")) return "קרן השתלמות";
  if (lower.includes("gemel") || lower.includes("גמל")) return "קופת גמל";
  return raw || "אחר";
}
