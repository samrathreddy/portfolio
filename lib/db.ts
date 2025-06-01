/**
 * MongoDB database utilities for meetings
 */
import mongoose, { Schema, Document, model, Model, connect } from 'mongoose';

/**
 * Database utilities for meetings
 * 
 * In a real application, you would implement these functions with a database like MongoDB or PostgreSQL
 */

// Type definitions
export interface Meeting {
  id: string;
  name: string;
  email: string;
  purpose?: string;
  dateTime: string;
  duration: number;
  eventId: string;
  meetLink: string;
  rescheduleToken: string;
  cancelToken: string;
  status: 'confirmed' | 'canceled' | 'rescheduled';
  createdAt: string;
  updatedAt?: string;
  canceledAt?: string;
  timezone?: string;
  adminDateTime?: string; // The meeting time in admin's timezone (IST)
  metadata?: Record<string, any>; // Additional metadata field
}

// MongoDB Meeting Interface (extends Document)
interface MeetingDocument extends Omit<Meeting, 'id'>, Document {
  id: string; // Redefine id to avoid conflict with Document's _id
}

// Meeting Schema
const meetingSchema = new Schema<MeetingDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    purpose: { type: String },
    dateTime: { type: String, required: true },
    duration: { type: Number, required: true },
    eventId: { type: String, required: true },
    meetLink: { type: String, required: true },
    rescheduleToken: { type: String, required: true },
    cancelToken: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['confirmed', 'canceled', 'rescheduled'],
      required: true,
      default: 'confirmed'
    },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
    canceledAt: { type: String },
    timezone: { type: String },
    adminDateTime: { type: String },
    metadata: { type: Schema.Types.Mixed } // Flexible metadata storage
  },
  { timestamps: true }
);

// Get Meeting model (or create it if it doesn't exist yet)
function getMeetingModel(): Model<MeetingDocument> {
  // Check if the model is already defined to prevent errors
  return mongoose.models.Meeting as Model<MeetingDocument> || 
    model<MeetingDocument>('Meeting', meetingSchema);
}

// Database connection handling
let isConnected = false;

/**
 * Connect to MongoDB
 */
export async function connectToDatabase(): Promise<void> {
  if (isConnected) return;

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
  
  try {
    if (!mongoose.connections[0].readyState) {
      await connect(MONGODB_URI);
      console.log('Connected to MongoDB');
      isConnected = true;
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Create a new meeting
 * @param meeting Meeting data
 * @returns Created meeting
 */
export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  try {
    await connectToDatabase();
    const MeetingModel = getMeetingModel();
    
    const newMeeting = new MeetingModel(meeting);
    await newMeeting.save();
    
    return meeting;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
}

/**
 * Get a meeting by ID
 * @param id Meeting ID
 * @returns Meeting or null if not found
 */
export async function getMeetingById(id: string): Promise<Meeting | null> {
  try {
    await connectToDatabase();
    const MeetingModel = getMeetingModel();
    
    const meeting = await MeetingModel.findOne({ id });
    return meeting ? meeting.toObject() : null;
  } catch (error) {
    console.error('Error getting meeting by ID:', error);
    throw error;
  }
}

/**
 * Get a meeting by tokens (reschedule or cancel)
 * @param tokenType Type of token ('reschedule' or 'cancel')
 * @param token The token value
 * @returns Meeting or null if not found
 */
export async function getMeetingByToken(
  tokenType: 'reschedule' | 'cancel',
  token: string
): Promise<Meeting | null> {
  try {
    await connectToDatabase();
    const MeetingModel = getMeetingModel();
    
    const query = tokenType === 'reschedule' 
      ? { rescheduleToken: token }
      : { cancelToken: token };
      
    const meeting = await MeetingModel.findOne(query);
    return meeting ? meeting.toObject() : null;
  } catch (error) {
    console.error(`Error getting meeting by ${tokenType} token:`, error);
    throw error;
  }
}

/**
 * Update a meeting
 * @param id Meeting ID
 * @param updates Partial meeting data to update
 * @returns Updated meeting
 */
export async function updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | null> {
  try {
    await connectToDatabase();
    const MeetingModel = getMeetingModel();
    
    // Add updatedAt timestamp
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    const meeting = await MeetingModel.findOneAndUpdate(
      { id },
      { $set: updatedData },
      { new: true } // Return the updated document
    );
    
    return meeting ? meeting.toObject() : null;
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
}

/**
 * Delete a meeting
 * @param id Meeting ID
 * @returns True if deleted, false if not found
 */
export async function deleteMeeting(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const MeetingModel = getMeetingModel();
    
    const result = await MeetingModel.deleteOne({ id });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
}

/**
 * List all meetings
 * @param filter Optional filter parameters
 * @returns Array of meetings
 */
export async function listMeetings(filter: Partial<Meeting> = {}): Promise<Meeting[]> {
  try {
    await connectToDatabase();
    const MeetingModel = getMeetingModel();
    
    const meetings = await MeetingModel.find(filter);
    return meetings.map(meeting => meeting.toObject());
  } catch (error) {
    console.error('Error listing meetings:', error);
    throw error;
  }
}

/**
 * Add metadata to a meeting
 * @param id Meeting ID
 * @param metadata Metadata object to add/update
 * @returns Updated meeting
 */
export async function addMeetingMetadata(
  id: string, 
  metadata: Record<string, any>
): Promise<Meeting | null> {
  try {
    await connectToDatabase();
    const MeetingModel = getMeetingModel();
    
    const meeting = await MeetingModel.findOne({ id });
    if (!meeting) return null;
    
    // Merge existing metadata with new metadata
    const updatedMetadata = {
      ...meeting.metadata,
      ...metadata,
    };
    
    meeting.metadata = updatedMetadata;
    meeting.updatedAt = new Date().toISOString();
    
    await meeting.save();
    return meeting.toObject();
  } catch (error) {
    console.error('Error adding meeting metadata:', error);
    throw error;
  }
} 