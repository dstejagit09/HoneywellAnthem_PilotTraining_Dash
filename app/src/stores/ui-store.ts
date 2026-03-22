// UI store: MFD tab, sidebar width, numpad state, assessment overlay

import { create } from 'zustand';

export type MFDTab = 'home' | 'radios' | 'flightplan' | 'map' | 'checklists' | 'messages';
type Panel = 'flight-plan' | 'radios';

const MFD_MIN_WIDTH = 300;
const MFD_MAX_WIDTH = 600;

interface UIStore {
  // MFD sidebar
  mfdWidth: number;
  mfdTab: MFDTab;
  setMfdWidth: (width: number) => void;
  setMfdTab: (tab: MFDTab) => void;

  // Assessment overlay
  showAssessment: boolean;
  setShowAssessment: (show: boolean) => void;

  // Legacy panel selector (used by numpad target logic)
  activePanel: Panel;
  setActivePanel: (panel: Panel) => void;

  // Numpad (legacy full-screen modal)
  numpadOpen: boolean;
  numpadTarget: string | null;
  openNumpad: (target: string) => void;
  closeNumpad: () => void;

  // Inline frequency numpad (MFD embedded)
  inlineNumpadCollapsed: boolean;
  setInlineNumpadCollapsed: (collapsed: boolean) => void;
  toggleInlineNumpad: () => void;

  reset: () => void;
}

const defaultState = {
  mfdWidth: 420,
  mfdTab: 'home' as MFDTab,
  showAssessment: false,
  activePanel: 'flight-plan' as Panel,
  numpadOpen: false,
  numpadTarget: null as string | null,
  inlineNumpadCollapsed: true,
};

export const useUIStore = create<UIStore>((set) => ({
  ...defaultState,

  setMfdWidth: (width) =>
    set({ mfdWidth: Math.max(MFD_MIN_WIDTH, Math.min(MFD_MAX_WIDTH, width)) }),

  setMfdTab: (tab) => set({ mfdTab: tab }),

  setShowAssessment: (show) => set({ showAssessment: show }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  openNumpad: (target) => set({ numpadOpen: true, numpadTarget: target }),

  closeNumpad: () => set({ numpadOpen: false, numpadTarget: null }),

  setInlineNumpadCollapsed: (collapsed) => set({ inlineNumpadCollapsed: collapsed }),

  toggleInlineNumpad: () =>
    set((state) => ({ inlineNumpadCollapsed: !state.inlineNumpadCollapsed })),

  reset: () => set(defaultState),
}));
