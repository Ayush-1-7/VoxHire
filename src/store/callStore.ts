import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface CallState {
  activeCallId: string | null;
  isCallModalOpen: boolean;
  preferredVolume: number;

  setActiveCall: (callId: string) => void;
  clearActiveCall: () => void;
  setCallModalOpen: (open: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useCallStore = create<CallState>()(
  devtools(
    persist(
      (set) => ({
        activeCallId: null,
        isCallModalOpen: false,
        preferredVolume: 0.8,

        setActiveCall: (callId) => set({ activeCallId: callId }),
        clearActiveCall: () => set({ activeCallId: null }),
        setCallModalOpen: (open) => set({ isCallModalOpen: open }),
        setVolume: (volume) => set({ preferredVolume: volume }),
      }),
      {
        name: "call-storage",
        partialize: (state) => ({
          preferredVolume: state.preferredVolume,
        }),
      }
    )
  )
);
