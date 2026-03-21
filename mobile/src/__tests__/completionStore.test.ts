import { useCompletionStore } from '../store/completionStore';
import type { CompletionRecord, StreakInfo } from '../api/completionApi';

const makeCompletion = (overrides: Partial<CompletionRecord> = {}): CompletionRecord => ({
  id: 'c1',
  reminder_id: 'r1',
  user_id: 'u1',
  scheduled_at: '2025-01-15T08:00:00Z',
  completed_at: '2025-01-15T08:05:00Z',
  status: 'done',
  snoozed_to: null,
  date_key: '2025-01-15',
  ...overrides,
});

const makeStreak = (overrides: Partial<StreakInfo> = {}): StreakInfo => ({
  current_streak: 5,
  longest_streak: 10,
  today_done: 3,
  today_total: 5,
  today_rate: 0.6,
  weekly_stats: [],
  ...overrides,
});

describe('useCompletionStore', () => {
  beforeEach(() => {
    useCompletionStore.setState({
      todayCompletions: [],
      streak: null,
    });
  });

  it('should initialize with empty state', () => {
    const state = useCompletionStore.getState();
    expect(state.todayCompletions).toEqual([]);
    expect(state.streak).toBeNull();
  });

  it('should set today completions', () => {
    const completions = [makeCompletion(), makeCompletion({ id: 'c2', reminder_id: 'r2' })];
    useCompletionStore.getState().setTodayCompletions(completions);

    expect(useCompletionStore.getState().todayCompletions).toHaveLength(2);
  });

  it('should add a new completion', () => {
    useCompletionStore.getState().setTodayCompletions([makeCompletion()]);
    useCompletionStore.getState().addCompletion(
      makeCompletion({ id: 'c2', reminder_id: 'r2', date_key: '2025-01-15' }),
    );

    expect(useCompletionStore.getState().todayCompletions).toHaveLength(2);
  });

  it('should replace existing completion for same reminder+date', () => {
    const original = makeCompletion({ status: 'done' });
    useCompletionStore.getState().setTodayCompletions([original]);

    const updated = makeCompletion({ id: 'c1-updated', status: 'skipped' });
    useCompletionStore.getState().addCompletion(updated);

    const state = useCompletionStore.getState();
    expect(state.todayCompletions).toHaveLength(1);
    expect(state.todayCompletions[0].status).toBe('skipped');
    expect(state.todayCompletions[0].id).toBe('c1-updated');
  });

  it('should not replace completion for different date_key', () => {
    const original = makeCompletion({ date_key: '2025-01-15' });
    useCompletionStore.getState().setTodayCompletions([original]);

    const different = makeCompletion({
      id: 'c2',
      date_key: '2025-01-16',
    });
    useCompletionStore.getState().addCompletion(different);

    expect(useCompletionStore.getState().todayCompletions).toHaveLength(2);
  });

  it('should not replace completion for different reminder_id', () => {
    const original = makeCompletion({ reminder_id: 'r1' });
    useCompletionStore.getState().setTodayCompletions([original]);

    const different = makeCompletion({
      id: 'c2',
      reminder_id: 'r2',
    });
    useCompletionStore.getState().addCompletion(different);

    expect(useCompletionStore.getState().todayCompletions).toHaveLength(2);
  });

  it('should set streak info', () => {
    const streak = makeStreak({ current_streak: 7, longest_streak: 15 });
    useCompletionStore.getState().setStreak(streak);

    const state = useCompletionStore.getState();
    expect(state.streak?.current_streak).toBe(7);
    expect(state.streak?.longest_streak).toBe(15);
    expect(state.streak?.today_done).toBe(3);
  });

  it('should handle streak with weekly_stats', () => {
    const streak = makeStreak({
      weekly_stats: [
        { date: '2025-01-14', total: 5, done: 5, skipped: 0, missed: 0, completion_rate: 1.0 },
        { date: '2025-01-15', total: 5, done: 3, skipped: 1, missed: 1, completion_rate: 0.6 },
      ],
    });
    useCompletionStore.getState().setStreak(streak);

    expect(useCompletionStore.getState().streak?.weekly_stats).toHaveLength(2);
    expect(useCompletionStore.getState().streak?.weekly_stats[0].completion_rate).toBe(1.0);
  });
});
