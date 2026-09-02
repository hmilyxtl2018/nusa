import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ChatTurn,
  Lang,
  Profile,
  ScanRecord,
  Tab,
} from "./types";
import { clearPhotos } from "./photo-db";

const DEFAULT_PROFILE: Profile = {
  diet: "any",
  health: [],
  allergies: [],
};

type NusaState = {
  hydrated: boolean;
  lang: Lang | null;
  onboarded: boolean;
  tab: Tab;
  profile: Profile;
  scans: ScanRecord[];
  setHydrated: (v: boolean) => void;
  setLang: (lang: Lang) => void;
  setOnboarded: (v: boolean) => void;
  setTab: (tab: Tab) => void;
  setProfile: (profile: Profile) => void;
  addScan: (scan: ScanRecord) => void;
  updateChat: (id: string, chat: ChatTurn[]) => void;
  removeScan: (id: string) => void;
  clearScans: () => void;
  resetAll: () => void;
  getScan: (id: string) => ScanRecord | undefined;
};

export const useNusa = create<NusaState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      lang: null,
      onboarded: false,
      tab: "home",
      profile: DEFAULT_PROFILE,
      scans: [],
      setHydrated: (v) => set({ hydrated: v }),
      setLang: (lang) => set({ lang }),
      setOnboarded: (v) => set({ onboarded: v }),
      setTab: (tab) => set({ tab }),
      setProfile: (profile) => set({ profile }),
      addScan: (scan) =>
        set({ scans: [scan, ...get().scans].slice(0, 24) }),
      updateChat: (id, chat) =>
        set({
          scans: get().scans.map((s) => (s.id === id ? { ...s, chat } : s)),
        }),
      removeScan: (id) =>
        set({ scans: get().scans.filter((s) => s.id !== id) }),
      clearScans: () => {
        void clearPhotos();
        set({ scans: [] });
      },
      resetAll: () => {
        void clearPhotos();
        set({
          lang: null,
          onboarded: false,
          tab: "home",
          profile: DEFAULT_PROFILE,
          scans: [],
        });
      },
      getScan: (id) => get().scans.find((s) => s.id === id),
    }),
    {
      name: "nusa-v1",
      partialize: (s) => ({
        lang: s.lang,
        onboarded: s.onboarded,
        profile: s.profile,
        scans: s.scans.map((scan) => ({
          ...scan,
          chat: scan.chat.slice(-12),
        })),
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<NusaState>;
        const byId = new Map(
          (p.scans ?? []).map((scan) => [scan.id, scan] as const),
        );
        for (const scan of current.scans) byId.set(scan.id, scan);
        return {
          ...current,
          ...p,
          lang: current.lang ?? p.lang ?? null,
          onboarded: current.onboarded || Boolean(p.onboarded),
          profile: current.profile ?? p.profile ?? DEFAULT_PROFILE,
          scans: [...byId.values()]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 24),
        };
      },
      onRehydrateStorage: () => () => {
        useNusa.setState({ hydrated: true });
      },
    },
  ),
);

