import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      {/* Fix: Update loader text to be generic for AI processing. */}
      <p className="text-lg font-semibold text-gray-700">Stitching images with AI...</p>
      <p className="text-sm text-gray-500">This may take a few moments.</p>
    </div>
  );
};

export default Loader;
