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
    return <div className="container mx-auto p-4 text-center">Loading meeting details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">{error}</div>;
  }

  if (!meeting) {
    return <div className="container mx-auto p-4 text-center">Meeting not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <a href="/admin/meetings" className="text-blue-500 hover:underline">
          &larr; Back to all meetings
        </a>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Meeting with {meeting.name}</h1>
          <span 
            className={`px-3 py-1 rounded-full text-sm ${
              meeting.status === 'confirmed' 
                ? 'bg-green-100 text-green-800' 
                : meeting.status === 'canceled' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {meeting.status}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Meeting Information</h2>
            <dl className="space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">ID:</dt>
                <dd className="col-span-2">{meeting.id}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Name:</dt>
                <dd className="col-span-2">{meeting.name}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Email:</dt>
                <dd className="col-span-2">{meeting.email}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Purpose:</dt>
                <dd className="col-span-2">{meeting.purpose || 'Not specified'}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Date & Time:</dt>
                <dd className="col-span-2">
                  {format(new Date(meeting.dateTime), 'MMMM d, yyyy h:mm a')}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Duration:</dt>
                <dd className="col-span-2">{meeting.duration} minutes</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Timezone:</dt>
                <dd className="col-span-2">{meeting.timezone || 'Not specified'}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Admin Time:</dt>
                <dd className="col-span-2">
                  {meeting.adminDateTime 
                    ? format(new Date(meeting.adminDateTime), 'MMMM d, yyyy h:mm a')
                    : 'Not specified'}
                </dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Calendar Information</h2>
            <dl className="space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Event ID:</dt>
                <dd className="col-span-2 break-all">{meeting.eventId}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Meet Link:</dt>
                <dd className="col-span-2 break-all">
                  <a 
                    href={meeting.meetLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {meeting.meetLink}
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="font-medium">Created At:</dt>
                <dd className="col-span-2">{format(new Date(meeting.createdAt), 'MMMM d, yyyy h:mm a')}</dd>
              </div>
              {meeting.updatedAt && (
                <div className="grid grid-cols-3 gap-1">
                  <dt className="font-medium">Updated At:</dt>
                  <dd className="col-span-2">{format(new Date(meeting.updatedAt), 'MMMM d, yyyy h:mm a')}</dd>
                </div>
              )}
              {meeting.canceledAt && (
                <div className="grid grid-cols-3 gap-1">
                  <dt className="font-medium">Canceled At:</dt>
                  <dd className="col-span-2">{format(new Date(meeting.canceledAt), 'MMMM d, yyyy h:mm a')}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Metadata</h2>
          {!meeting.metadata ? (
            <div className="text-gray-500">No metadata available</div>
          ) : (
            <div className="bg-gray-50 p-4 rounded">
              <pre className="whitespace-pre-wrap overflow-x-auto">
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
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Join Meeting
          </a>
          <button 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            onClick={() => window.history.back()}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
} 