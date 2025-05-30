import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
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
        <h1 className="text-2xl font-bold mb-4">About Zoom Recordings Library</h1>
        
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            The Zoom Recordings Library is a web application designed to make it easy to browse, search, and download Zoom recordings that have been uploaded through our Telegram bot.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-2">Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Browse all available Zoom recordings</li>
            <li>Search recordings by title or date</li>
            <li>View detailed information about each recording</li>
            <li>Download recordings directly from the browser</li>
            <li>Responsive design that works on desktop and mobile devices</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-2">How It Works</h2>
          <p>
            Our system consists of two main components:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Telegram Bot:</strong> Authorized users can send Zoom recording links to our Telegram bot, which automatically downloads and stores the recordings.
            </li>
            <li>
              <strong>Web Interface:</strong> This web application provides a user-friendly interface to browse and download the stored recordings.
            </li>
          </ol>
          
          <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
          <p>
            If you have any questions, issues, or feedback, please contact the administrator through the Telegram bot.
          </p>
        </div>
      </div>
    </div>
  );
}
