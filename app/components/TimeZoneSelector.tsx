'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// List of common time zones with user-friendly names
const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'America/New_York', label: 'US Eastern (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (PST/PDT)' },
  { value: 'Europe/London', label: 'UK (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Central Europe (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Australia Eastern (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST/NZDT)' },
];

// Get the user's system timezone
const getUserTimezone = () => {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const matchedTimezone = COMMON_TIMEZONES.find(tz => tz.value === systemTimezone);
  return matchedTimezone ? systemTimezone : 'Asia/Kolkata'; // Default to IST if not found
};

interface TimeZoneSelectorProps {
  onTimezoneChange: (timezone: string) => void;
  className?: string;
}

export default function TimeZoneSelector({ onTimezoneChange, className = '' }: TimeZoneSelectorProps) {
  // Initialize with user's timezone right away
  const [selectedTimezone, setSelectedTimezone] = useState<string>(getUserTimezone());

  // Run this effect only once on component mount
  useEffect(() => {
    // Notify parent of initial timezone
    onTimezoneChange(selectedTimezone);
  }, []);

  const handleTimezoneChange = (value: string) => {
    setSelectedTimezone(value);
    onTimezoneChange(value);
  };

  return (
    <div className={className}>
      <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select time zone" />
        </SelectTrigger>
        <SelectContent>
          {COMMON_TIMEZONES.map((timezone) => (
            <SelectItem key={timezone.value} value={timezone.value}>
              {timezone.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 