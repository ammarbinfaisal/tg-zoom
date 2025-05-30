'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import RecordingsList from '@/components/RecordingsList';
import type { Recording } from '@/components/RecordingsList';

export default function Home() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        const url = searchQuery 
          ? `/api/recordings?query=${encodeURIComponent(searchQuery)}`
          : '/api/recordings';
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recordings');
        }
        
        const data = await response.json();
        setRecordings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching recordings:', err);
        setError('Failed to load recordings. Please try again later.');
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Zoom Recordings Library</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and download Zoom recordings
        </p>
      </div>
      
      <SearchBar onSearch={handleSearch} />
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {searchQuery 
                ? `Search Results for "${searchQuery}"` 
                : 'All Recordings'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {recordings.length} recording{recordings.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <RecordingsList recordings={recordings} />
        </>
      )}
    </div>
  );
}
