'use client';

import { useState, useEffect, useRef } from 'react';

// Metadata needs to be moved to a separate layout file for client components
// We'll handle this in a separate file

export default function ResumePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
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

  useEffect(() => {
    // Check if embed URL is available
    if (!embedUrl) {
      setLoadError('Resume URL not configured. Please check environment variables.');
      setIsLoading(false);
      return;
    }

    // Set up iframe load handlers
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsLoading(false);
        setLoadError(null);
      };

      const handleError = () => {
        setIsLoading(false);
        setLoadError('Failed to load resume. Please try refreshing the page.');
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      // Fallback timeout in case load event doesn't fire
      const timeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 5000);

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        clearTimeout(timeout);
      };
    }
  }, [embedUrl, isLoading]);
  
  const handleDownload = async () => {
    if (!downloadUrl) {
      alert('Download URL not configured. Please contact the administrator.');
      return;
    }

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

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError(null);
    
    // Force iframe reload
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
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
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : loadError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
            {isLoading ? 'Loading...' : loadError ? 'Error' : 'Live Document'}
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
            disabled={!downloadUrl}
            className="bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black px-6 py-3 rounded-lg flex items-center font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-primary/25"
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
            {embedUrl ? (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="w-full h-full"
                title="Resume PDF"
                allow="autoplay"
                frameBorder="0"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-600">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">Resume not available</p>
                  <p className="text-sm">Configuration required</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-400">Loading resume...</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {loadError && (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="text-red-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-4">{loadError}</p>
                <button 
                  onClick={handleRetry}
                  className="bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
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
    </div>
  );
} 