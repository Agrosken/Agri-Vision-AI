import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-semibold text-gray-700">{message || 'Processing with AI...'}</p>
      <p className="text-sm text-gray-500">This may take a few moments.</p>
    </div>
  );
};

export default Loader;
