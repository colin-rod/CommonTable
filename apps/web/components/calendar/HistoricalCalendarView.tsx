'use client';

import type { CookingEvent } from '@commontable/types';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Box, Button, CircularProgress, IconButton, Paper, Stack, Typography } from '@mui/material';
import { useState, useMemo } from 'react';

import { useHistoricalCalendar } from '@/hooks/useHistoricalCalendar';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface DayEvent {
  date: Date;
  events: CookingEvent[];
}

export function HistoricalCalendarView() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12

  const { events, loading, error } = useHistoricalCalendar(currentYear, currentMonth);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CookingEvent[]>();

    events.forEach((event) => {
      const dateKey = event.cooked_at.toISOString().split('T')[0] ?? '';
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      const dayEvents = grouped.get(dateKey);
      if (dayEvents) dayEvents.push(event);
    });

    return grouped;
  }, [events]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (DayEvent | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dateKey = date.toISOString().split('T')[0] ?? '';
      const dayEvents = eventsByDate.get(dateKey) || [];

      days.push({
        date,
        events: dayEvents,
      });
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate]);

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography color="error">Failed to load cooking history</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Month Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={handleToday}>
            Today
          </Button>
          <IconButton onClick={handlePreviousMonth} aria-label="Previous month">
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={handleNextMonth} aria-label="Next month">
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Calendar Grid */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1,
          }}
        >
          {/* Day Headers */}
          {DAYS_OF_WEEK.map((day) => (
            <Box
              key={day}
              sx={{
                textAlign: 'center',
                fontWeight: 500,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2">{day}</Typography>
            </Box>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((dayData, index) => {
            if (!dayData) {
              return <Box key={`empty-${index}`} sx={{ minHeight: 80 }} />;
            }

            const isToday =
              dayData.date.getDate() === today.getDate() &&
              dayData.date.getMonth() === today.getMonth() &&
              dayData.date.getFullYear() === today.getFullYear();

            const hasEvents = dayData.events.length > 0;

            return (
              <Paper
                key={dayData.date.toISOString()}
                elevation={0}
                sx={{
                  minHeight: 80,
                  p: 1,
                  border: 1,
                  borderColor: isToday ? 'primary.main' : 'divider',
                  bgcolor: isToday ? 'action.hover' : 'background.paper',
                }}
              >
                <Stack spacing={0.5}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 600 : 400,
                      color: isToday ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {dayData.date.getDate()}
                  </Typography>

                  {hasEvents && (
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                        }}
                      >
                        {dayData.events.length} {dayData.events.length === 1 ? 'recipe' : 'recipes'}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Paper>
    </Stack>
  );
}
