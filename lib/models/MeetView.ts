import mongoose, { Schema } from 'mongoose';

export interface MeetView {
  ip: string;
  userAgent: string;
  referrer: string | null;
  createdAt: Date;
  meetingScheduled: boolean; // Similar to "downloaded" in ResumeView
  
  // Enhanced geolocation data from ipinfo API
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  org?: string; // ISP/Organization
  postal?: string;
  countryCode?: string;
  
  // Enhanced user agent parsing
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  device?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  
  // Session tracking
  sessionId?: string;
  viewDuration?: number; // Time spent on meet page in seconds
  
  // Meeting scheduling tracking
  scheduledAt?: Date;
  scheduleMethod?: 'form' | 'direct';
  selectedDuration?: number; // Meeting duration selected
  selectedTimezone?: string; // User's selected timezone
  
  // Meet page specific interactions
  step1Completed?: boolean; // Completed time selection
  step2Completed?: boolean; // Completed form submission
  step3Reached?: boolean; // Reached confirmation page
  
  // Additional meet page analytics
  timeSlotClicks?: number; // Number of time slots clicked
  timezoneChanges?: number; // Number of timezone changes
  dateChanges?: number; // Number of date changes
  durationChanges?: number; // Number of duration changes
}

const MeetViewSchema = new Schema<MeetView>({
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
  referrer: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  meetingScheduled: { type: Boolean, default: false },
  
  // Enhanced geolocation
  country: { type: String },
  city: { type: String },
  region: { type: String },
  timezone: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  org: { type: String },
  postal: { type: String },
  countryCode: { type: String },
  
  // Enhanced user agent
  browser: { type: String },
  browserVersion: { type: String },
  os: { type: String },
  osVersion: { type: String },
  device: { type: String },
  deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'] },
  
  // Session tracking
  sessionId: { type: String },
  viewDuration: { type: Number },
  
  // Meeting scheduling tracking
  scheduledAt: { type: Date },
  scheduleMethod: { type: String, enum: ['form', 'direct'] },
  selectedDuration: { type: Number },
  selectedTimezone: { type: String },
  
  // Meet page specific interactions
  step1Completed: { type: Boolean, default: false },
  step2Completed: { type: Boolean, default: false },
  step3Reached: { type: Boolean, default: false },
  
  // Additional meet page analytics
  timeSlotClicks: { type: Number, default: 0 },
  timezoneChanges: { type: Number, default: 0 },
  dateChanges: { type: Number, default: 0 },
  durationChanges: { type: Number, default: 0 }
});

// Check if the model is already defined to prevent OverwriteModelError in development with hot reload
const MeetViewModel = mongoose.models.MeetView || mongoose.model<MeetView>('MeetView', MeetViewSchema);

export default MeetViewModel; 