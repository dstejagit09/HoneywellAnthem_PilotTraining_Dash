// T1.16 — UI store: active tab, active panel, numpad state

import { create } from 'zustand';

type Tab = 'cockpit' | 'drills' | 'assessment';
type Panel = 'flight-plan' | 'radios';

interface UIStore {
  activeTab: Tab;
  activePanel: Panel;
  numpadOpen: boolean;
  numpadTarget: string | null;

  setActiveTab: (tab: Tab) => void;
  setActivePanel: (panel: Panel) => void;
  openNumpad: (target: string) => void;
  closeNumpad: () => void;
  reset: () => void;
}

const defaultState = {
  activeTab: 'cockpit' as Tab,
  activePanel: 'flight-plan' as Panel,
  numpadOpen: false,
  numpadTarget: null as string | null,
};

export const useUIStore = create<UIStore>((set) => ({
  ...defaultState,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  openNumpad: (target) => set({ numpadOpen: true, numpadTarget: target }),

  closeNumpad: () => set({ numpadOpen: false, numpadTarget: null }),

  reset: () => set(defaultState),
}));
