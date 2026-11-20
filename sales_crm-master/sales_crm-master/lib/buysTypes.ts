export type BuysMatchField =
  | "polish"
  | "material"
  | "curcumin"
  | "price"
  | "origin";

export interface BuysLeadMatch {
  leadId: string;
  leadName: string;
  leadType: "export" | "domestic";
  leadStatus: string;
  responsiblePerson: string;
  matchScore: number;
  matchedFields: BuysMatchField[];
  unmatchedFields: BuysMatchField[];
  breakdown: Partial<Record<BuysMatchField, number>>;
  supplierSnapshot: {
    polishLevel?: string;
    materialType?: string;
    curcuminPercent?: number;
    price?: number;
    origin?: string;
  };
  leadSnapshot: {
    polishLevel?: string;
    materialType?: string;
    minCurcumin?: number;
    maxPrice?: number;
    preferredOrigin?: string;
  };
}

export interface BuysSupplierRow {
  supplierId: string;
  supplierName: string;
  supplierDetails: {
    supplierNumber?: string;
    polishLevel?: string;
    materialType?: string;
    curcuminPercent?: number;
    price?: number;
    region?: string;
    variety?: string;
    grade?: string;
    quantityKg?: number;
  };
  matchCount: number;
  bestMatch: BuysLeadMatch | null;
  matches: BuysLeadMatch[];
}

export interface BuysMatchesResponse {
  suppliers: BuysSupplierRow[];
  summary: {
    supplierCount: number;
    buyerCount: number;
    suppliersWithMatches: number;
    avgBestScore: number;
  };
}

export interface BuysSupplierMatch {
  supplierId: string;
  supplierName: string;
  supplierDetails: BuysSupplierRow["supplierDetails"];
  leadId: string;
  leadName: string;
  leadType: "export" | "domestic";
  leadStatus: string;
  responsiblePerson: string;
  matchScore: number;
  matchedFields: BuysMatchField[];
  unmatchedFields: BuysMatchField[];
  breakdown: Partial<Record<BuysMatchField, number>>;
  supplierSnapshot: BuysLeadMatch["supplierSnapshot"];
  leadSnapshot: BuysLeadMatch["leadSnapshot"];
}

export interface BuysLeadRow {
  leadId: string;
  leadName: string;
  leadType: "export" | "domestic";
  leadStatus: string;
  responsiblePerson: string;
  leadDetails: {
    polishLevel?: string;
    materialType?: string;
    minCurcumin?: number;
    maxPrice?: number;
    preferredOrigin?: string;
    acceptGrade?: string;
    quantityNeededKg?: number;
  };
  matchCount: number;
  bestMatch: BuysSupplierMatch | null;
  matches: BuysSupplierMatch[];
}

export interface BuysLeadMatchesResponse {
  leads: BuysLeadRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    supplierCount: number;
    buyerCount: number;
    leadsWithMatches: number;
    leadsWithoutMatches: number;
    avgBestScore: number;
  };
}

export const BUYS_FIELD_LABELS: Record<BuysMatchField, string> = {
  polish: "Polish level",
  material: "Material type",
  curcumin: "Curcumin %",
  price: "Price",
  origin: "Origin",
};

export const BUYS_FIELD_WEIGHTS: Record<BuysMatchField, number> = {
  polish: 30,
  material: 25,
  curcumin: 20,
  price: 15,
  origin: 10,
};
