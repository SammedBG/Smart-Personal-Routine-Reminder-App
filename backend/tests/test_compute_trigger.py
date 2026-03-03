"""Unit tests for compute_next_trigger function."""

from datetime import date, datetime, time, timezone

import pytest

from backend.app.services.reminder_service import compute_next_trigger


# Freeze "now" for deterministic results by using a far-future start_date
# so the function always uses start_date as effective_today.


class TestDailyReminder:
    def test_daily_future_time(self):
        """Daily reminder with future start_date should return trigger on start_date."""
        start = date(2099, 6, 15)
        result = compute_next_trigger(
            time_of_day=time(8, 0),
            repeat_type="daily",
            custom_days=None,
            start_date=start,
        )
        assert result is not None
        assert result.date() == start
        assert result.time() == time(8, 0)

    def test_daily_with_end_date_past(self):
        """Daily reminder with end_date in the past should return None."""
        result = compute_next_trigger(
            time_of_day=time(8, 0),
            repeat_type="daily",
            custom_days=None,
            end_date=date(2020, 1, 1),
        )
        assert result is None


class TestOnceReminder:
    def test_once_future(self):
        start = date(2099, 12, 25)
        result = compute_next_trigger(
            time_of_day=time(9, 30),
            repeat_type="once",
            custom_days=None,
            start_date=start,
        )
        assert result is not None
        assert result.date() == start


class TestWeeklyReminder:
    def test_weekly_specific_days(self):
        """Weekly reminder on Mon (1) and Wed (3) with far-future start."""
        # 2099-06-15 is a Monday (weekday()=0, JS=1)
        start = date(2099, 6, 15)
        result = compute_next_trigger(
            time_of_day=time(7, 0),
            repeat_type="weekly",
            custom_days={"days": [1, 3]},  # Mon, Wed in JS convention (0=Sun)
            start_date=start,
        )
        assert result is not None
        # 2099-06-15 is Monday (JS=1), which is in [1,3], so trigger is same day
        assert result.date() == date(2099, 6, 15)

    def test_weekly_no_days_specified(self):
        """Weekly with empty days list should still produce a trigger."""
        start = date(2099, 6, 15)
        result = compute_next_trigger(
            time_of_day=time(7, 0),
            repeat_type="weekly",
            custom_days={"days": []},
            start_date=start,
        )
        assert result is not None

    def test_custom_days(self):
        """Custom days [0, 6] = Sun and Sat."""
        # 2099-06-15 is Monday => next Sat is 2099-06-20, next Sun is 2099-06-21
        start = date(2099, 6, 15)
        result = compute_next_trigger(
            time_of_day=time(10, 0),
            repeat_type="custom",
            custom_days={"days": [0, 6]},  # Sun, Sat
            start_date=start,
        )
        assert result is not None
        # Sat = JS 6 => Python weekday 5 => offset from Mon: +5 = 2099-06-20
        assert result.date() == date(2099, 6, 20)

    def test_end_date_bounds(self):
        """Trigger should be None if next candidate is past end_date."""
        start = date(2099, 6, 15)
        result = compute_next_trigger(
            time_of_day=time(7, 0),
            repeat_type="weekly",
            custom_days={"days": [0]},  # Sunday only
            start_date=start,
            end_date=date(2099, 6, 16),  # Tue+1 = Wed, before next Sun
        )
        assert result is None
