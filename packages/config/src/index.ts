/**
 * System configuration constants for AI-Based Early Warning and Landslide Risk Monitoring (NER)
 */

export const APP_CONFIG = {
  appName: "Parvaah - Landslide Early Warning System",
  region: "North Eastern Region (NER), India",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  refreshIntervalMs: 30000,
  defaultCoordinates: {
    lat: 25.5788,
    lng: 91.8933, // Shillong, Meghalaya
    zoom: 8
  },
  riskThresholds: {
    low: 0.3,
    medium: 0.6,
    high: 0.85
  }
} as const;

export type AppConfig = typeof APP_CONFIG;
