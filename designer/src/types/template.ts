export type ElementType =
  | "text"
  | "variable_text"
  | "image"
  | "shape_rect"
  | "shape_ellipse"
  | "shape_line"
  | "qr_placeholder"
  | "signature_placeholder"
  | "seal_placeholder"
  | "svg";

export type TextAlignment = "left" | "center" | "right" | "justify";
export type FontWeight = "normal" | "medium" | "bold" | "800";
export type FontStyle = "normal" | "italic";
export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";

export interface QRConfig {
  purpose: "certificate_verification";
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  style: "circular_premium" | "standard_square";
  showCenterLogo: boolean;
  accentColor?: string;
}

export interface SignatureConfig {
  signerRole: string;
  signerName: string;
  signerDesignation: string;
  showBaseline: boolean;
  signatureAssetUrl?: string;
}

export interface SealConfig {
  sealType: "institutional_emboss" | "gold_stamp" | "custom_image";
  maskShape: "circle" | "none";
  sealAssetUrl?: string;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  isLocked: boolean;
  isHidden: boolean;

  // Text specific
  text?: string;
  variableKey?: string;
  fallbackText?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  color?: string;
  textAlign?: TextAlignment;
  letterSpacing?: number;
  lineHeight?: number;
  maxWidth?: number | null;
  textTransform?: TextTransform;

  // Image & Asset specific
  assetUrl?: string;
  assetId?: string;

  // Shapes
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;

  // Placeholders
  qrConfig?: QRConfig;
  signatureConfig?: SignatureConfig;
  sealConfig?: SealConfig;
}

export interface PageSettings {
  width: number;
  height: number;
  unit: "px" | "pt" | "mm" | "in";
  dpi: number;
  orientation: "landscape" | "portrait";
  standardFormat: "A4" | "Letter" | "Custom";
}

export interface BackgroundSettings {
  type: "image" | "pdf" | "color" | "gradient";
  url?: string;
  assetId?: string;
  color?: string;
  opacity: number;
}

export interface VariableDefinition {
  key: string;
  label: string;
  type: "string" | "date" | "number" | "code";
  sampleValue: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
}

export interface FontDefinition {
  family: string;
  source: "google" | "system" | "custom" | "embedded_pdf";
  url?: string;
  fallbackFamily: string;
  isAvailable?: boolean;
}

export interface AssetDefinition {
  id: string;
  type: "background" | "logo" | "signature" | "seal" | "icon";
  url: string;
  name?: string;
  mimeType?: string;
  fileSizeBytes?: number;
}

export interface ProofsyTemplate {
  schemaVersion: "2.0";
  id: string;
  version: number;
  name: string;
  description?: string;
  organizationId?: string;
  workspaceId?: string;
  page: PageSettings;
  background: BackgroundSettings;
  elements: CanvasElement[];
  variables: VariableDefinition[];
  fonts: FontDefinition[];
  assets: AssetDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export type ReconstructionClassification = "DETECTED" | "APPROXIMATED" | "RASTERIZED";

export interface ReconstructionReport {
  classification: ReconstructionClassification;
  overallQuality: number; // 0 to 100
  textFidelity: number;
  fontFidelity: number;
  layoutFidelity: number;
  assetFidelity: number;
  pageCount: number;
  extractedTextCount: number;
  extractedImageCount: number;
  detectedFonts: {
    fontName: string;
    matchedGoogleFont: string | null;
    isAvailable: boolean;
    substitutionUsed: string;
  }[];
  suggestedVariables: {
    elementId: string;
    detectedText: string;
    suggestedVariableKey: string;
    suggestedLabel: string;
    confidence: number;
    accepted: boolean;
  }[];
  isRasterFallbackUsed: boolean;
  warnings: string[];
}
