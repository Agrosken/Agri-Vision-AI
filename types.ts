// Fix: Define and export types to make this file a module.
export interface ImagePart {
  inlineData: {
    data: string; // base64 encoded string
    mimeType: string;
  };
}

export interface AnalysisReport {
  healthScore: number;
  healthSummary: string;
  detailedReport: string;
}
