/**
 * Shared TypeScript types for Landslide Risk Monitoring System (NER)
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Coordinates {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface RiskFactors {
  rainfall24hMm: number;
  rainfall72hCumulativeMm: number;
  soilMoisturePercentage: number;
  slopeDegrees: number;
  insarDeformationMmPerYear?: number;
  ndviVegetationIndex?: number;
  geologyType?: string;
}

export interface ZoneRisk {
  zoneId: string;
  zoneName: string;
  state: 'Assam' | 'Meghalaya' | 'Sikkim' | 'Arunachal Pradesh' | 'Nagaland' | 'Manipur' | 'Mizoram' | 'Tripura';
  coordinates: Coordinates;
  riskScore: number; // 0.0 to 1.0
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  factors: RiskFactors;
  lastUpdated: string; // ISO 8601 string
}

export interface Alert {
  id: string;
  zoneId: string;
  zoneName: string;
  severity: RiskLevel;
  title: string;
  description: string;
  timestamp: string;
  evacuationRecommended: boolean;
  acknowledged: boolean;
}

export interface InSARDeformationData {
  zoneId: string;
  satellite: 'Sentinel-1' | 'NISAR';
  displacementRateMmYr: number;
  coherence: number;
  timestamp: string;
}

export interface NDVIAnalysisData {
  zoneId: string;
  satellite: 'Sentinel-2' | 'Landsat-9';
  meanNdvi: number;
  vegetationLossPercentage: number;
  timestamp: string;
}

export interface PredictionExplanation {
  zoneId: string;
  topContributingFeatures: Array<{
    feature: string;
    impact: number;
    description: string;
  }>;
  summary: string;
}
