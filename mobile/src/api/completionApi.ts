import { apiClient } from './client';

export type CompletionStatus = 'done' | 'skipped' | 'missed' | 'snoozed';

export type CompletionRecord = {
  id: string;
  reminder_id: string;
  user_id: string;
  status: CompletionStatus;
  scheduled_at: string;
  completed_at: string;
  snoozed_to?: string | null;
  date_key: string;
};

export type DailyStats = {
  date: string;
  total: number;
  done: number;
  skipped: number;
  missed: number;
  completion_rate: number;
};

export type StreakInfo = {
  current_streak: number;
  longest_streak: number;
  today_done: number;
  today_total: number;
  today_rate: number;
  weekly_stats: DailyStats[];
};

export async function recordCompletion(
  reminderId: string,
  status: CompletionStatus,
  scheduledAt: string,
  snoozedTo?: string,
): Promise<CompletionRecord> {
  const payload: Record<string, unknown> = {
    reminder_id: reminderId,
    status,
    scheduled_at: scheduledAt,
  };
  if (snoozedTo) payload.snoozed_to = snoozedTo;
  const res = await apiClient.post<CompletionRecord>('/completions/', payload);
  return res.data;
}

export async function fetchTodayCompletions(): Promise<CompletionRecord[]> {
  const res = await apiClient.get<CompletionRecord[]>('/completions/today');
  return res.data;
}

export async function fetchStreakInfo(): Promise<StreakInfo> {
  const res = await apiClient.get<StreakInfo>('/completions/streak');
  return res.data;
}
