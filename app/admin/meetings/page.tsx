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
        if(response.status === 403) {
          throw new Error('Access denied: IP not authorized');
        }
        throw new Error('Failed to fetch meetings');
      }
      
      const data = await response.json();
      setMeetings(data.meetings || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
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
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-white">Meetings Administration</h1>
        
        <div className="mb-6">
          <label className="mr-2 text-gray-300">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="confirmed">Confirmed</option>
            <option value="canceled">Canceled</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="">All</option>
          </select>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4 text-gray-300">Loading meetings...</div>
        ) : error ? (
          <div className="text-red-400 py-4 bg-red-900/30 border border-red-500 rounded-lg px-4">{error}</div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-4 text-gray-400">No meetings found</div>
        ) : (
          <div className="overflow-x-auto bg-gray-900 rounded-lg">
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-gray-700 px-4 py-3 text-left text-gray-200">Name</th>
                  <th className="border border-gray-700 px-4 py-3 text-left text-gray-200">Email</th>
                  <th className="border border-gray-700 px-4 py-3 text-left text-gray-200">Date & Time</th>
                  <th className="border border-gray-700 px-4 py-3 text-left text-gray-200">Duration</th>
                  <th className="border border-gray-700 px-4 py-3 text-left text-gray-200">Status</th>
                  <th className="border border-gray-700 px-4 py-3 text-left text-gray-200">Created At</th>
                  <th className="border border-gray-700 px-4 py-3 text-left text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-800 transition-colors">
                    <td className="border border-gray-700 px-4 py-3 text-gray-100">{meeting.name}</td>
                    <td className="border border-gray-700 px-4 py-3 text-gray-100">{meeting.email}</td>
                    <td className="border border-gray-700 px-4 py-3 text-gray-100">
                      {format(new Date(meeting.dateTime), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="border border-gray-700 px-4 py-3 text-gray-100">{meeting.duration}min</td>
                    <td className="border border-gray-700 px-4 py-3">
                      <span 
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          meeting.status === 'confirmed' 
                            ? 'bg-green-900/50 text-green-300 border border-green-700' 
                            : meeting.status === 'canceled' 
                            ? 'bg-red-900/50 text-red-300 border border-red-700' 
                            : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                        }`}
                      >
                        {meeting.status}
                      </span>
                    </td>
                    <td className="border border-gray-700 px-4 py-3 text-gray-100">
                      {format(new Date(meeting.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="border border-gray-700 px-4 py-3">
                      <a 
                        href={`/admin/meetings/${meeting.id}`}
                        className="text-primary hover:text-primary/80 hover:underline mr-3 transition-colors"
                      >
                        View
                      </a>
                      <a 
                        href={meeting.meetLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 hover:underline transition-colors"
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
    </div>
  );
} 