import React from 'react';

interface AnalysisMapProps {
  imageUrl: string;
}

const AnalysisMap: React.FC<AnalysisMapProps> = ({ imageUrl }) => {
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-700 mb-4">Stitched Orthomosaic Map</h3>
      <div 
        className="relative w-full aspect-video bg-gray-200 rounded-lg shadow-inner overflow-hidden border-2 border-gray-300"
      >
        <img 
          src={imageUrl}
          alt="Stitched drone imagery map"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default AnalysisMap;
