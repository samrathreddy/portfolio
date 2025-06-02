"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { addDays, format, setHours, setMinutes, isAfter, isBefore, startOfDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, User, Mail, MessageSquare, Check } from "lucide-react";
import TimeZoneSelector from "@/app/components/TimeZoneSelector";

// Duration options for meetings
const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
];

// Type definition for time slots
interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  adminStart?: string;
  adminEnd?: string;
  displayTimezone?: string;
  adminTimezone?: string;
}

export default function MeetPage() {
  const [step, setStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [displayTime, setDisplayTime] = useState<Date | null>(null); // For UI display in user's timezone
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    purpose: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [meetLink, setMeetLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load time slots when date, duration, or timezone changes
  useEffect(() => {
    async function fetchAvailableSlots() {
      if (!selectedDate || !selectedTimezone) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/available-slots?date=${selectedDate.toISOString()}&duration=${selectedDuration}&timezone=${selectedTimezone}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch available slots');
        }
        
        const data = await response.json();
        
        if (data.availableSlots && Array.isArray(data.availableSlots)) {
          setTimeSlots(data.availableSlots);
        } else {
          console.error('Invalid available slots data:', data);
          setTimeSlots([]);
        }
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setError('Could not load available slots. Please try again.');
        setTimeSlots([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAvailableSlots();
  }, [selectedDate, selectedDuration, selectedTimezone]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset selected time when date changes
    setDisplayTime(null); // Reset display time as well
  };

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    // Use the adminStart time for booking (already in admin timezone)
    // but store the display time (user's timezone) for showing in the UI
    setSelectedTime(new Date(slot.adminStart || slot.start));
    setDisplayTime(new Date(slot.start)); // Set display time in user's timezone
  };

  const handleTimezoneChange = (timezone: string) => {
    setSelectedTimezone(timezone);
    setSelectedTime(null); // Reset selected time when timezone changes
    setDisplayTime(null); // Reset display time as well
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    if (step === 1 && selectedTime) {
      setStep(2);
    } else if (step === 2 && formData.name && formData.email) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/book-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          purpose: formData.purpose,
          dateTime: selectedTime?.toISOString(),
          duration: selectedDuration,
          timezone: selectedTimezone
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book meeting');
      }
      
      const data = await response.json();
      
      // Set the Google Meet link from the response
      setMeetLink(data.meetLink);
      setBookingComplete(true);
      setStep(3);
    } catch (error) {
      console.error("Error booking meeting:", error);
      setError(error instanceof Error ? error.message : 'Failed to book meeting');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatTimeSlot = (dateStr: string) => {
    // Format UTC time in the user's selected timezone
    if (!selectedTimezone) return format(new Date(dateStr), "h:mm a");
    return formatInTimeZone(new Date(dateStr), selectedTimezone, "h:mm a");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-2">Schedule a call</h1>
          <p className="text-gray-400 mb-8">Select a time to chat about projects, ideas, or questions.</p>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex flex-row mb-8 space-x-2 sm:space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-black' : 'bg-gray-800'}`}>
                1
              </div>
              <span className="ml-2 text-xs sm:text-base">Select Time</span>
            </div>
            <div className="border-t border-gray-700 flex-1 self-center mx-2 sm:mx-4"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-black' : 'bg-gray-800'}`}>
                2
              </div>
              <span className="ml-2 text-xs sm:text-base">Your Details</span>
            </div>
            <div className="border-t border-gray-700 flex-1 self-center mx-2 sm:mx-4"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-primary text-black' : 'bg-gray-800'}`}>
                3
              </div>
              <span className="ml-2 text-xs sm:text-base">Confirmation</span>
            </div>
          </div>

          {/* Step 1: Select Time */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CalendarIcon className="mr-2" size={20} />
                  Select a Date
                </h2>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < startOfDay(new Date())}
                    className="border-0"
                  />
                </div>
                
                <h3 className="text-lg font-medium mt-6 mb-3 flex items-center">
                  <Clock className="mr-2" size={20} />
                  Select Duration
                </h3>
                <div className="flex space-x-3 mb-6">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleDurationSelect(option.value)}
                      className={`py-2 px-4 rounded-lg border ${
                        selectedDuration === option.value
                          ? 'border-primary bg-gray-800 text-primary'
                          : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <h3 className="text-lg font-medium mt-6 mb-3 flex items-center">
                  <Clock className="mr-2" size={20} />
                  Time Zone
                </h3>
                <TimeZoneSelector 
                  onTimezoneChange={handleTimezoneChange} 
                  className="mb-6" 
                />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="mr-2" size={20} />
                  Select a Time
                </h2>
                {selectedDate ? (
                  <div className="bg-gray-800 p-4 rounded-lg h-[360px] overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : timeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot, i) => (
                          <button
                            key={i}
                            disabled={!slot.available}
                            onClick={() => handleTimeSelect(slot)}
                            className={`py-3 px-4 rounded-lg text-center transition-colors ${
                              displayTime && 
                              new Date(slot.start).getTime() === displayTime.getTime()
                                ? 'bg-primary text-black font-medium'
                                : slot.available
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {formatTimeSlot(slot.start)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-400 my-8">No available time slots for this date.</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-800 p-4 rounded-lg h-[360px] flex items-center justify-center">
                    <p className="text-gray-400">Please select a date first</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Your Details */}
          {step === 2 && (
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-6">Your Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Meeting Purpose
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="What would you like to discuss? (optional)"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Meeting Summary</h3>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Date:</span>
                  <span>{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Time:</span>
                  <span>{displayTime && selectedTimezone ? formatInTimeZone(displayTime, selectedTimezone, "h:mm a") : ""}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Timezone:</span>
                  <span>{selectedTimezone.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span>{selectedDuration} minutes</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={32} />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Meeting Scheduled!</h2>
              <p className="text-gray-400 mb-6">
                You're all set! Please check google calendar for the meeting details.
              </p>
              
              <div className="bg-gray-800 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium mb-4">Meeting Details</h3>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Date:</span>
                  <span>{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Time:</span>
                  <span>{displayTime && selectedTimezone ? formatInTimeZone(displayTime, selectedTimezone, "h:mm a") : ""}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Timezone:</span>
                  <span>{selectedTimezone.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-400">Duration:</span>
                  <span>{selectedDuration} minutes</span>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-400 mb-2">Google Meet Link:</p>
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary break-all hover:underline"
                  >
                    {meetLink}
                  </a>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Reset everything and go back to step 1
                    setStep(1);
                    setSelectedDate(new Date());
                    setSelectedTime(null);
                    setFormData({ name: "", email: "", purpose: "" });
                    setBookingComplete(false);
                  }}
                >
                  Book Another Meeting
                </Button>
                
                <Button
                  variant="default"
                  onClick={() => {
                    // Add to calendar functionality would go here
                    window.open('https://calendar.google.com/calendar', '_blank');
                  }}
                >
                  Check Calendar
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 3 && (
            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2" size={16} />
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button
                onClick={handleContinue}
                disabled={
                  (step === 1 && !selectedTime) || 
                  (step === 2 && (!formData.name || !formData.email)) ||
                  isSubmitting || isLoading
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    {step === 1 ? "Continue" : "Schedule Meeting"}
                    <ChevronRight className="ml-2" size={16} />
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 