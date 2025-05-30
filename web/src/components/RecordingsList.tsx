import React from 'react';
import RecordingCard from './RecordingCard';

export interface Recording {
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

interface RecordingsListProps {
  recordings: Recording[];
}

const RecordingsList: React.FC<RecordingsListProps> = ({ recordings }) => {
  if (recordings.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">No recordings found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recordings.map((recording) => (
        <RecordingCard
          key={recording.id}
          id={recording.id}
          title={recording.title}
          date={recording.date}
          status={recording.status}
        />
      ))}
    </div>
  );
};

export default RecordingsList;
