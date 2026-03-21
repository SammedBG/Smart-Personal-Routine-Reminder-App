import { create } from 'zustand';
import type { CompletionRecord, StreakInfo } from '../api/completionApi';

type CompletionState = {
  todayCompletions: CompletionRecord[];
  streak: StreakInfo | null;
  setTodayCompletions: (records: CompletionRecord[]) => void;
  addCompletion: (record: CompletionRecord) => void;
  setStreak: (info: StreakInfo | null) => void;
};

export const useCompletionStore = create<CompletionState>((set) => ({
  todayCompletions: [],
  streak: null,
  setTodayCompletions: (records) => set({ todayCompletions: records }),
  addCompletion: (record) =>
    set((state) => {
      // Replace existing record for same reminder+date, or add
      const filtered = state.todayCompletions.filter(
        (c) =>
          !(c.reminder_id === record.reminder_id && c.date_key === record.date_key),
      );
      return { todayCompletions: [...filtered, record] };
    }),
  setStreak: (info) => set({ streak: info }),
}));
