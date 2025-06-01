'use client';

import { useState, useEffect } from 'react';
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

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('confirmed');

  // Fetch meetings with filters
  const fetchMeetings = async (filter: string = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings${filter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }
      
      const data = await response.json();
      setMeetings(data.meetings || []);
      setError(null);
    } catch (err) {
      setError('Failed to load meetings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    
    const queryParam = value ? `?status=${value}` : '';
    fetchMeetings(queryParam);
  };

  // Load meetings on component mount
  useEffect(() => {
    fetchMeetings(statusFilter ? `?status=${statusFilter}` : '');
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Meetings Administration</h1>
      
      <div className="mb-6">
        <label className="mr-2">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="border rounded p-2"
        >
          <option value="confirmed">Confirmed</option>
          <option value="canceled">Canceled</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="">All</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Loading meetings...</div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-4">No meetings found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Date & Time</th>
                <th className="border px-4 py-2">Duration</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Created At</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{meeting.name}</td>
                  <td className="border px-4 py-2">{meeting.email}</td>
                  <td className="border px-4 py-2">
                    {format(new Date(meeting.dateTime), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="border px-4 py-2">{meeting.duration}min</td>
                  <td className="border px-4 py-2">
                    <span 
                      className={`px-2 py-1 rounded text-xs ${
                        meeting.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : meeting.status === 'canceled' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {meeting.status}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    {format(new Date(meeting.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="border px-4 py-2">
                    <a 
                      href={`/admin/meetings/${meeting.id}`}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      View
                    </a>
                    <a 
                      href={meeting.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Join
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 