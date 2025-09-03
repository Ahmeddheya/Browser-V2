export type Tab = {
  id: string;
  title: string;
  url: string;
  faviconUrl?: string;
  screenshotUrl?: string;
  createdAt: number;
  isActive: boolean;
};

export type ClosedTab = Omit<Tab, 'isActive'> & { closedAt: number };

export interface TabsState {
  activeTabs: Tab[];
  closedTabs: ClosedTab[];
  currentTabId?: string;
}

export interface TabsActions {
  createNewTab: (url?: string) => string;
  closeTab: (id: string) => void;
  closeAllActive: () => void;
  restoreClosedTab: (id: string) => void;
  clearAllClosed: () => void;
  updateTabUrl: (id: string, url: string) => void;
  setActiveTab: (id: string) => void;
  loadTabs: () => Promise<void>;
  saveTabs: () => Promise<void>;
}