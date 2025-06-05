import mongoose, { Schema } from 'mongoose';

export interface ResumeView {
  ip: string;
  userAgent: string;
  referrer: string | null;
  createdAt: Date;
  downloaded: boolean;
  
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
  viewDuration?: number; // Time spent on resume page in seconds
  
  // Download tracking
  downloadedAt?: Date;
  downloadMethod?: 'button' | 'direct';
}

const ResumeViewSchema = new Schema<ResumeView>({
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
  referrer: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  downloaded: { type: Boolean, default: false },
  
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
  
  // Download tracking
  downloadedAt: { type: Date },
  downloadMethod: { type: String, enum: ['button', 'direct'] }
});

// Check if the model is already defined to prevent OverwriteModelError in development with hot reload
const ResumeViewModel = mongoose.models.ResumeView || mongoose.model<ResumeView>('ResumeView', ResumeViewSchema);

export default ResumeViewModel; 