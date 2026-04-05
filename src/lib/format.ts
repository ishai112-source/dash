export const formatCurrency = (v: number) =>
  new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(v);

export const formatNumber = (v: number) =>
  new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 }).format(v);

export const formatPercent = (v: number, decimals = 1) =>
  `${v.toFixed(decimals)}%`;
