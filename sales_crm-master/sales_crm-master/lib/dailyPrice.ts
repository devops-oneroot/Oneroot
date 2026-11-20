export const DAILY_PRICE_LOCATIONS = [
  { id: "gundlupete", label: "Gundlupete" },
  { id: "erode", label: "Erode" },
  { id: "salem", label: "Salem" },
  { id: "sangli", label: "Sangli" },
  { id: "nizamabad", label: "Nizamabad" },
] as const;

export const DAILY_PRICE_ROWS = [
  { id: "unpolish", label: "Unpolish" },
  { id: "singlePolish", label: "Single polish" },
  { id: "doublePolish", label: "Double polish" },
  { id: "unpolishBulb", label: "Unpolish bulb" },
  { id: "singlePolishBulb", label: "Single polish bulb" },
  { id: "doublePolishBulb", label: "Double polish bulb" },
] as const;

export const DAILY_PRICE_FARMING_METHODS = [
  { id: "conventional", label: "Conventional price" },
  { id: "ipm", label: "IPM price" },
  { id: "organic", label: "Organic price" },
] as const;

export type DailyPriceLocationId =
  (typeof DAILY_PRICE_LOCATIONS)[number]["id"];
export type DailyPriceRowId = (typeof DAILY_PRICE_ROWS)[number]["id"];
export type DailyPriceFarmingMethodId =
  (typeof DAILY_PRICE_FARMING_METHODS)[number]["id"];

export type LocationPrices = Partial<
  Record<DailyPriceLocationId, number | undefined>
>;

export type DailyPriceGrid = Record<DailyPriceRowId, LocationPrices>;

export type DailyPriceByMethod = Record<
  DailyPriceFarmingMethodId,
  DailyPriceGrid
>;

export interface LocationColumnMeta {
  addedBy?: string;
  addedByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  approved?: boolean;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejected?: boolean;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
}

export type MethodPriceMeta = Record<DailyPriceLocationId, LocationColumnMeta>;

export type DailyPriceMetaByMethod = Record<
  DailyPriceFarmingMethodId,
  MethodPriceMeta
>;

export interface DailyPriceEntry {
  _id: string;
  date: string;
  createdBy: string;
  addedByName: string;
  updatedBy?: string;
  updatedByName?: string;
  prices: DailyPriceByMethod;
  priceMeta?: DailyPriceMetaByMethod;
  createdAt: string;
  updatedAt: string;
}

export function emptyMethodPriceMeta(): MethodPriceMeta {
  return Object.fromEntries(
    DAILY_PRICE_LOCATIONS.map((loc) => [loc.id, {}])
  ) as MethodPriceMeta;
}

export function getMethodPriceMeta(
  entry: DailyPriceEntry,
  methodId: DailyPriceFarmingMethodId
): MethodPriceMeta {
  const base = emptyMethodPriceMeta();
  const fromEntry = entry.priceMeta?.[methodId];
  if (!fromEntry) return base;
  return { ...base, ...fromEntry };
}

const ROW_IDS = DAILY_PRICE_ROWS.map((r) => r.id);
const METHOD_IDS = DAILY_PRICE_FARMING_METHODS.map((m) => m.id);

export function emptyDailyPriceGrid(): DailyPriceGrid {
  const row = Object.fromEntries(
    DAILY_PRICE_LOCATIONS.map((loc) => [loc.id, undefined])
  ) as LocationPrices;

  return Object.fromEntries(
    DAILY_PRICE_ROWS.map((r) => [r.id, { ...row }])
  ) as DailyPriceGrid;
}

export function emptyDailyPriceByMethod(): DailyPriceByMethod {
  return Object.fromEntries(
    DAILY_PRICE_FARMING_METHODS.map((m) => [m.id, emptyDailyPriceGrid()])
  ) as DailyPriceByMethod;
}

function isLegacyPrices(
  prices: Record<string, unknown>
): prices is Record<string, LocationPrices> {
  const hasMethod = METHOD_IDS.some((m) => prices[m] != null);
  if (hasMethod) return false;
  return ROW_IDS.some((id) => prices[id] != null);
}

/** Normalize API payload — legacy flat grids map to conventional only. */
export function normalizeDailyPriceByMethod(
  prices: DailyPriceByMethod | DailyPriceGrid | Record<string, unknown>
): DailyPriceByMethod {
  const base = emptyDailyPriceByMethod();

  if (!prices || typeof prices !== "object") return base;

  if (isLegacyPrices(prices as Record<string, unknown>)) {
    return {
      ...base,
      conventional: {
        ...emptyDailyPriceGrid(),
        ...(prices as DailyPriceGrid),
      },
    };
  }

  for (const method of DAILY_PRICE_FARMING_METHODS) {
    const grid = (prices as DailyPriceByMethod)[method.id];
    if (grid) {
      base[method.id] = {
        ...emptyDailyPriceGrid(),
        ...grid,
      };
    }
  }

  return base;
}

export function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}
