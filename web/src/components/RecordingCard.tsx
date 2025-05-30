import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface RecordingCardProps {
  id: number;
  title: string;
  date: string;
  status: string;
}

const RecordingCard: React.FC<RecordingCardProps> = ({ id, title, date, status }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-2 truncate">{title}</h3>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {formatDate(date)}
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-xs px-2 py-1 rounded-full ${
          status === 'completed' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : status === 'downloading' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : status === 'failed'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }`}>
          {status}
        </span>
        <Link 
          href={`/recordings/${id}`}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          View details
        </Link>
      </div>
    </div>
  );
};

export default RecordingCard;
