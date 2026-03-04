import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  value: string | null;          // 'YYYY-MM-DD' or null / ''
  onChange: (date: string) => void;
  colors: any;
  minDate?: string;               // 'YYYY-MM-DD' earliest selectable
  label?: string;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseYMD(s: string | null): { year: number; month: number; day: number } | null {
  if (!s || s.length < 10) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

export const DatePickerInline: React.FC<Props> = ({
  value,
  onChange,
  colors,
  minDate,
  label,
}) => {
  const parsed = parseYMD(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfWeek(viewYear, viewMonth);

  const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());
  const minParsed = parseYMD(minDate ?? null);

  function isDisabled(day: number): boolean {
    if (!minParsed) return false;
    const cellStr = toYMD(viewYear, viewMonth, day);
    return cellStr < (minDate as string);
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {/* Month nav */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{'\u276E'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{'\u276F'}</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week header */}
      <View style={styles.row}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={styles.dayCell}>
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) {
            return <View key={`e-${i}`} style={styles.dayCell} />;
          }
          const cellStr = toYMD(viewYear, viewMonth, day);
          const selected = cellStr === value;
          const isToday = cellStr === todayStr;
          const disabled = isDisabled(day);
          return (
            <TouchableOpacity
              key={cellStr}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                selected && { backgroundColor: colors.primary },
              ]}
              onPress={() => !disabled && onChange(cellStr)}
              disabled={disabled}>
              <Text
                style={[
                  styles.dayNum,
                  isToday && { color: colors.primary, fontWeight: '700' as const },
                  selected && { color: '#fff', fontWeight: '700' as const },
                  disabled && { color: colors.textTertiary, opacity: 0.4 },
                ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Clear / Today shortcuts */}
      <View style={styles.shortcuts}>
        <TouchableOpacity onPress={() => onChange(todayStr)} style={styles.shortcutBtn}>
          <Text style={[styles.shortcutText, { color: colors.primary }]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { onChange(''); }} style={styles.shortcutBtn}>
          <Text style={[styles.shortcutText, { color: colors.danger }]}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      padding: 12,
      marginTop: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    navBtn: { padding: 8 },
    navText: { fontSize: 18, color: colors.primary, fontWeight: '700' },
    monthText: { fontSize: 16, fontWeight: '700', color: colors.text },
    row: { flexDirection: 'row' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
    },
    dayLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
    dayNum: { fontSize: 14, color: colors.text },
    todayCell: {
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    shortcuts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    shortcutBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    shortcutText: { fontSize: 13, fontWeight: '600' },
  });
