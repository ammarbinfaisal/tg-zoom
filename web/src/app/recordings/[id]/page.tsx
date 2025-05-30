'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, formatFileSize } from '@/lib/utils';

interface Recording {
  id: number;
  title: string;
  date: string;
  zoomUrl: string;
  passcode: string;
  filePath: string | null;
  fileId: string | null;
  uploadedBy: number;
  status: string;
  createdAt: string;
}

export default function RecordingDetailPage({ params }: { params: { id: string } }) {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  useEffect(() => {
    const fetchRecording = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/recordings/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Recording not found');
          }
          throw new Error('Failed to fetch recording');
        }
        
        const data = await response.json();
        setRecording(data);
        
        // If there's a file path, try to get the file size
        if (data.filePath) {
          try {
            const fileInfoResponse = await fetch(`/api/file-info/${params.id}`);
            if (fileInfoResponse.ok) {
              const fileInfo = await fileInfoResponse.json();
              setFileSize(fileInfo.size);
            }
          } catch (err) {
            console.error('Error fetching file info:', err);
            // Don't set an error, just continue without file size
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching recording:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setRecording(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecording();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to recordings
        </Link>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Recording not found</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to recordings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:underline flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          Back to recordings
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">{recording.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Recording Details</h2>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Date:</span> {formatDate(recording.date)}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs ${
                  recording.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : recording.status === 'downloading' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : recording.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {recording.status}
                </span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Added:</span> {formatDate(recording.createdAt)}
              </p>
              {fileSize !== null && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">File Size:</span> {formatFileSize(fileSize)}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Zoom Information</h2>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400 break-words">
                <span className="font-medium">Zoom URL:</span>{' '}
                <a 
                  href={recording.zoomUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {recording.zoomUrl}
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Passcode:</span> {recording.passcode}
              </p>
            </div>
          </div>
        </div>
        
        {recording.status === 'completed' && recording.filePath && (
          <div className="mt-6">
            <a 
              href={`/api/download/${recording.id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                />
              </svg>
              Download Recording
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
