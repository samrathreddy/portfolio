'use client';

import { useState, useEffect } from 'react';

// Metadata needs to be moved to a separate layout file for client components
// We'll handle this in a separate file

export default function ResumePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const embedUrl = process.env.NEXT_PUBLIC_RESUME_EMBED_URL || '';
  const downloadUrl = process.env.NEXT_PUBLIC_RESUME_DOWNLOAD_URL || '';
  
  useEffect(() => {
    // Track page view when component mounts
    async function trackView() {
      try {
        const response = await fetch('/api/resume-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
        }
      } catch (error) {
        console.error('Error tracking resume view:', error);
      }
    }
    
    trackView();
  }, []);
  
  const handleDownload = async () => {
    try {
      // Track download with session ID
      await fetch('/api/resume-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          downloadMethod: 'button'
        })
      });
    } catch (error) {
      console.error('Error tracking download:', error);
    }
    
    // Open download link in new tab
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-zinc-900 rounded-lg shadow-xl p-8 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📄 My Resume</h1>
            <p className="text-gray-400">Software Engineer & Full Stack Developer</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Document
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <div className="mb-4 md:mb-0">
            <p className="text-lg text-gray-300 mb-1">
              View my latest resume below or download a copy
            </p>
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <button 
            onClick={handleDownload}
            className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-lg flex items-center font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-primary/25"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Resume
          </button>
        </div>
        
        {/* Resume Container */}
        <div className="relative">
          <div className="aspect-[3/4] w-full max-h-[900px] bg-white border border-gray-700 rounded-lg overflow-hidden shadow-2xl">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              title="Resume PDF"
              allow="autoplay"
              frameBorder="0"
              loading="lazy"
            ></iframe>
          </div>
          
          {/* Loading overlay */}
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center rounded-lg" id="pdf-loading">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400">Loading resume...</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>📍 Available for remote opportunities</span>
              <span>💼 Open to full-time positions</span>
            </div>
            <span>Session: {sessionId ? sessionId.slice(-8) : 'Loading...'}</span>
          </div>
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('load', function() {
            setTimeout(function() {
              const loadingOverlay = document.getElementById('pdf-loading');
              if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
              }
            }, 2000);
          });
        `
      }} />
    </div>
  );
} 