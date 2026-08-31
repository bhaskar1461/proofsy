import { create } from "zustand";
import { CanvasElement, ProofsyTemplate, ReconstructionReport } from "../types/template";
import { PREDEFINED_CERTIFICATE_VARIABLES } from "../types/variables";

export interface GuideLine {
  type: "x" | "y";
  position: number;
}

export interface DesignerState {
  template: ProofsyTemplate;
  selectedElementIds: string[];
  history: ProofsyTemplate[];
  historyIndex: number;
  zoom: number;
  panOffset: { x: number; y: number };
  snapToGuides: boolean;
  activeGuideLines: GuideLine[];
  reconstructionReport: ReconstructionReport | null;
  isAnalyzing: boolean;
  analysisProgressText: string;
  sampleData: Record<string, string>;
  viewMode: "artwork" | "hybrid" | "clean";

  // Actions
  setViewMode: (mode: "artwork" | "hybrid" | "clean") => void;
  setTemplate: (template: ProofsyTemplate, pushHistory?: boolean) => void;
  selectElement: (id: string, isMulti?: boolean) => void;
  clearSelection: () => void;
  updateElement: (id: string, changes: Partial<CanvasElement>) => void;
  addElement: (element: CanvasElement) => void;
  removeElement: (id: string) => void;
  duplicateSelected: () => void;
  reorderElement: (id: string, direction: "front" | "back" | "forward" | "backward") => void;
  alignSelected: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  bindVariable: (elementId: string, variableKey: string) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setActiveGuideLines: (guides: GuideLine[]) => void;
  setReconstructionReport: (report: ReconstructionReport | null) => void;
  setIsAnalyzing: (analyzing: boolean, progressText?: string) => void;
  setSampleData: (data: Record<string, string>) => void;
  applyVariableSuggestions: (accepted: { elementId: string; variableKey: string }[]) => void;
}

const DEFAULT_TEMPLATE: ProofsyTemplate = {
  schemaVersion: "2.0",
  id: `tpl_${Date.now().toString(36)}`,
  version: 1,
  name: "Untitled Certificate Template",
  page: {
    width: 1056,
    height: 746,
    unit: "px",
    dpi: 300,
    orientation: "landscape",
    standardFormat: "A4",
  },
  background: {
    type: "color",
    color: "#FFFFFF",
    opacity: 1.0,
  },
  elements: [
    {
      id: "el_title_default",
      type: "text",
      x: 528,
      y: 160,
      width: 700,
      height: 48,
      rotation: 0,
      opacity: 1.0,
      zIndex: 1,
      isLocked: false,
      isHidden: false,
      text: "CERTIFICATE OF APPRECIATION",
      fontFamily: "Cinzel",
      fontSize: 32,
      fontWeight: "bold",
      color: "#1E293B",
      textAlign: "center",
      letterSpacing: 2,
    },
    {
      id: "el_subtitle_default",
      type: "text",
      x: 528,
      y: 230,
      width: 600,
      height: 30,
      rotation: 0,
      opacity: 1.0,
      zIndex: 2,
      isLocked: false,
      isHidden: false,
      text: "PROUDLY PRESENTED TO",
      fontFamily: "Inter",
      fontSize: 14,
      fontWeight: "medium",
      color: "#64748B",
      textAlign: "center",
      letterSpacing: 3,
    },
    {
      id: "el_name_default",
      type: "variable_text",
      variableKey: "student_name",
      fallbackText: "Recipient Full Name",
      x: 528,
      y: 340,
      width: 750,
      height: 56,
      rotation: 0,
      opacity: 1.0,
      zIndex: 3,
      isLocked: false,
      isHidden: false,
      text: "{{student_name}}",
      fontFamily: "Great Vibes",
      fontSize: 48,
      fontWeight: "normal",
      color: "#0F172A",
      textAlign: "center",
    },
    {
      id: "el_course_default",
      type: "variable_text",
      variableKey: "course_name",
      fallbackText: "Course & Program Name",
      x: 528,
      y: 430,
      width: 800,
      height: 36,
      rotation: 0,
      opacity: 1.0,
      zIndex: 4,
      isLocked: false,
      isHidden: false,
      text: "{{course_name}}",
      fontFamily: "Inter",
      fontSize: 20,
      fontWeight: "medium",
      color: "#4F46E5",
      textAlign: "center",
    },
    {
      id: "el_qr_default",
      type: "qr_placeholder",
      x: 880,
      y: 580,
      width: 110,
      height: 110,
      rotation: 0,
      opacity: 1.0,
      zIndex: 5,
      isLocked: false,
      isHidden: false,
      qrConfig: {
        purpose: "certificate_verification",
        errorCorrectionLevel: "H",
        style: "circular_premium",
        showCenterLogo: true,
      },
    },
    {
      id: "el_sig_default",
      type: "signature_placeholder",
      x: 240,
      y: 590,
      width: 200,
      height: 70,
      rotation: 0,
      opacity: 1.0,
      zIndex: 6,
      isLocked: false,
      isHidden: false,
      signatureConfig: {
        signerRole: "Authorized Signatory",
        signerName: "Dean / Principal",
        signerDesignation: "Office of the Registrar",
        showBaseline: true,
      },
    },
  ],
  variables: PREDEFINED_CERTIFICATE_VARIABLES,
  fonts: [
    { family: "Inter", source: "google", fallbackFamily: "sans-serif" },
    { family: "Cinzel", source: "google", fallbackFamily: "serif" },
    { family: "Great Vibes", source: "google", fallbackFamily: "cursive" },
  ],
  assets: [],
};

const DEFAULT_SAMPLE_DATA: Record<string, string> = {
  student_name: "Bhaskar Sharma",
  course_name: "Advanced Software Engineering & Cryptographic Systems Certification 2026",
  issue_date: "August 15, 2026",
  completion_date: "August 15, 2026",
  certificate_id: "PROOF-2026-X89K9",
  organization_name: "Proofsy Institute of Technology",
  department_name: "Department of Computer Science",
  duration: "60 Hours",
  issuer_name: "Dr. Sarah Jenkins",
  issuer_designation: "Dean of Academic Affairs",
};

export const useDesignerStore = create<DesignerState>((set, get) => ({
  template: DEFAULT_TEMPLATE,
  selectedElementIds: [],
  history: [DEFAULT_TEMPLATE],
  historyIndex: 0,
  zoom: 1.0,
  panOffset: { x: 0, y: 0 },
  snapToGuides: true,
  activeGuideLines: [],
  reconstructionReport: null,
  isAnalyzing: false,
  analysisProgressText: "",
  sampleData: DEFAULT_SAMPLE_DATA,
  viewMode: "artwork",

  setViewMode: (mode) => set({ viewMode: mode }),

  setTemplate: (template, pushHistory = true) => {
    set((state) => {
      if (!pushHistory) return { template };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(template);
      return {
        template,
        history: newHistory.slice(-40), // Keep last 40 states
        historyIndex: newHistory.length - 1,
      };
    });
  },

  selectElement: (id, isMulti = false) => {
    set((state) => ({
      selectedElementIds: isMulti
        ? state.selectedElementIds.includes(id)
          ? state.selectedElementIds.filter((item) => item !== id)
          : [...state.selectedElementIds, id]
        : [id],
    }));
  },

  clearSelection: () => set({ selectedElementIds: [], activeGuideLines: [] }),

  updateElement: (id, changes) => {
    const state = get();
    const newElements = state.template.elements.map((el) => {
      if (el.id === id) {
        return { ...el, ...changes };
      }
      return el;
    });

    const newTemplate: ProofsyTemplate = {
      ...state.template,
      elements: newElements,
      updatedAt: new Date().toISOString(),
    };

    state.setTemplate(newTemplate, true);
  },

  addElement: (element) => {
    const state = get();
    const highestZ = state.template.elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
    const newElement = { ...element, zIndex: highestZ + 1 };

    const newTemplate: ProofsyTemplate = {
      ...state.template,
      elements: [...state.template.elements, newElement],
      updatedAt: new Date().toISOString(),
    };

    state.setTemplate(newTemplate, true);
    set({ selectedElementIds: [newElement.id] });
  },

  removeElement: (id) => {
    const state = get();
    const newElements = state.template.elements.filter((el) => el.id !== id);

    const newTemplate: ProofsyTemplate = {
      ...state.template,
      elements: newElements,
      updatedAt: new Date().toISOString(),
    };

    state.setTemplate(newTemplate, true);
    set({ selectedElementIds: [] });
  },

  duplicateSelected: () => {
    const state = get();
    const toDuplicate = state.template.elements.filter((el) => state.selectedElementIds.includes(el.id));
    if (toDuplicate.length === 0) return;

    let highestZ = state.template.elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
    const newElements = [...state.template.elements];
    const newSelectedIds: string[] = [];

    toDuplicate.forEach((el) => {
      highestZ++;
      const copy: CanvasElement = {
        ...el,
        id: `el_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        x: el.x + 20,
        y: el.y + 20,
        zIndex: highestZ,
      };
      newElements.push(copy);
      newSelectedIds.push(copy.id);
    });

    const newTemplate: ProofsyTemplate = {
      ...state.template,
      elements: newElements,
      updatedAt: new Date().toISOString(),
    };

    state.setTemplate(newTemplate, true);
    set({ selectedElementIds: newSelectedIds });
  },

  reorderElement: (id, direction) => {
    const state = get();
    const elements = [...state.template.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1) return;

    if (direction === "front") {
      const el = elements.splice(index, 1)[0];
      elements.push(el);
    } else if (direction === "back") {
      const el = elements.splice(index, 1)[0];
      elements.unshift(el);
    } else if (direction === "forward" && index < elements.length - 1) {
      const temp = elements[index];
      elements[index] = elements[index + 1];
      elements[index + 1] = temp;
    } else if (direction === "backward" && index > 0) {
      const temp = elements[index];
      elements[index] = elements[index - 1];
      elements[index - 1] = temp;
    }

    const reindexed = elements.map((el, i) => ({ ...el, zIndex: i + 1 }));
    state.setTemplate({ ...state.template, elements: reindexed }, true);
  },

  alignSelected: (alignment) => {
    const state = get();
    const selected = state.template.elements.filter((el) => state.selectedElementIds.includes(el.id));
    if (selected.length === 0) return;

    const pageW = state.template.page.width;
    const pageH = state.template.page.height;

    const newElements = state.template.elements.map((el) => {
      if (!state.selectedElementIds.includes(el.id)) return el;

      let { x, y } = el;
      if (alignment === "left") x = 60;
      else if (alignment === "center") x = pageW / 2;
      else if (alignment === "right") x = pageW - 60;
      else if (alignment === "top") y = 60;
      else if (alignment === "middle") y = pageH / 2 - el.height / 2;
      else if (alignment === "bottom") y = pageH - 60 - el.height;

      return { ...el, x, y };
    });

    state.setTemplate({ ...state.template, elements: newElements }, true);
  },

  bindVariable: (elementId, variableKey) => {
    const state = get();
    const varDef = state.template.variables.find((v) => v.key === variableKey);
    const newElements = state.template.elements.map((el) => {
      if (el.id === elementId) {
        return {
          ...el,
          type: "variable_text" as const,
          variableKey,
          text: `{{${variableKey}}}`,
          fallbackText: varDef?.label || "Variable Field",
        };
      }
      return el;
    });

    state.setTemplate({ ...state.template, elements: newElements }, true);
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      set({
        template: history[nextIndex],
        historyIndex: nextIndex,
        selectedElementIds: [],
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      set({
        template: history[nextIndex],
        historyIndex: nextIndex,
        selectedElementIds: [],
      });
    }
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.3, Math.min(2.5, zoom)) }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setActiveGuideLines: (activeGuideLines) => set({ activeGuideLines }),
  setReconstructionReport: (reconstructionReport) => set({ reconstructionReport }),
  setIsAnalyzing: (isAnalyzing, progressText = "") =>
    set({ isAnalyzing, analysisProgressText: progressText }),
  setSampleData: (sampleData) => set({ sampleData }),

  applyVariableSuggestions: (accepted) => {
    const state = get();
    let newElements = [...state.template.elements];

    accepted.forEach(({ elementId, variableKey }) => {
      newElements = newElements.map((el) => {
        if (el.id === elementId) {
          return {
            ...el,
            type: "variable_text",
            variableKey,
            text: `{{${variableKey}}}`,
          };
        }
        return el;
      });
    });

    state.setTemplate({ ...state.template, elements: newElements }, true);
  },
}));
