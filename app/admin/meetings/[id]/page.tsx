'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';

interface Meeting {
  id: string;
  name: string;
  email: string;
  purpose?: string;
  dateTime: string;
  duration: number;
  eventId: string;
  meetLink: string;
  status: 'confirmed' | 'canceled' | 'rescheduled';
  createdAt: string;
  updatedAt?: string;
  canceledAt?: string;
  timezone?: string;
  adminDateTime?: string;
  metadata?: Record<string, any>;
}

export default function MeetingDetailPage() {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Extract meeting ID from pathname
  const pathname = usePathname();
  const id = pathname.split('/').pop();

  // Fetch meeting details
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/meetings/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch meeting details');
        }
        
        const data = await response.json();
        setMeeting(data.meeting);
        setError(null);
      } catch (err) {
        setError('Failed to load meeting details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto p-4 text-center text-gray-300">Loading meeting details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto p-4 text-center">
          <div className="text-red-400 bg-red-900/30 border border-red-500 rounded-lg px-4 py-3">{error}</div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto p-4 text-center text-gray-400">Meeting not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <a href="/admin/meetings" className="text-primary hover:text-primary/80 hover:underline transition-colors">
            &larr; Back to all meetings
          </a>
        </div>
        
        <div className="bg-gray-900 shadow-xl rounded-lg p-6 mb-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Meeting with {meeting.name}</h1>
            <span 
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                meeting.status === 'confirmed' 
                  ? 'bg-green-900/50 text-green-300 border border-green-700' 
                  : meeting.status === 'canceled' 
                  ? 'bg-red-900/50 text-red-300 border border-red-700' 
                  : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
              }`}
            >
              {meeting.status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-200">Meeting Information</h2>
              <dl className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">ID:</dt>
                  <dd className="col-span-2 text-gray-100">{meeting.id}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Name:</dt>
                  <dd className="col-span-2 text-gray-100">{meeting.name}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Email:</dt>
                  <dd className="col-span-2 text-gray-100">{meeting.email}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Purpose:</dt>
                  <dd className="col-span-2 text-gray-100">{meeting.purpose || 'Not specified'}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Date & Time:</dt>
                  <dd className="col-span-2 text-gray-100">
                    {format(new Date(meeting.dateTime), 'MMMM d, yyyy h:mm a')}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Duration:</dt>
                  <dd className="col-span-2 text-gray-100">{meeting.duration} minutes</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Timezone:</dt>
                  <dd className="col-span-2 text-gray-100">{meeting.timezone || 'Not specified'}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Admin Time:</dt>
                  <dd className="col-span-2 text-gray-100">
                    {meeting.adminDateTime 
                      ? format(new Date(meeting.adminDateTime), 'MMMM d, yyyy h:mm a')
                      : 'Not specified'}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-200">Calendar Information</h2>
              <dl className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Event ID:</dt>
                  <dd className="col-span-2 break-all text-gray-100">{meeting.eventId}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Meet Link:</dt>
                  <dd className="col-span-2 break-all">
                    <a 
                      href={meeting.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {meeting.meetLink}
                    </a>
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-medium text-gray-300">Created At:</dt>
                  <dd className="col-span-2 text-gray-100">{format(new Date(meeting.createdAt), 'MMMM d, yyyy h:mm a')}</dd>
                </div>
                {meeting.updatedAt && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="font-medium text-gray-300">Updated At:</dt>
                    <dd className="col-span-2 text-gray-100">{format(new Date(meeting.updatedAt), 'MMMM d, yyyy h:mm a')}</dd>
                  </div>
                )}
                {meeting.canceledAt && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="font-medium text-gray-300">Canceled At:</dt>
                    <dd className="col-span-2 text-gray-100">{format(new Date(meeting.canceledAt), 'MMMM d, yyyy h:mm a')}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Metadata</h2>
            {!meeting.metadata ? (
              <div className="text-gray-400">No metadata available</div>
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <pre className="whitespace-pre-wrap overflow-x-auto text-gray-100 text-sm">
                  {JSON.stringify(meeting.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <a 
              href={meeting.meetLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-black font-medium rounded-md transition-colors"
            >
              Join Meeting
            </a>
            <button 
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              onClick={() => window.history.back()}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 