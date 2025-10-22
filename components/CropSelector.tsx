
import React from 'react';
import { CROP_TYPES } from '../constants';

interface CropSelectorProps {
  selectedCrop: string;
  onCropChange: (crop: string) => void;
}

const CropSelector: React.FC<CropSelectorProps> = ({ selectedCrop, onCropChange }) => {
  return (
    <div>
      <label htmlFor="crop-type" className="block text-sm font-medium text-gray-700 mb-2">
        Crop Type
      </label>
      <select
        id="crop-type"
        value={selectedCrop}
        onChange={(e) => onCropChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        {CROP_TYPES.map((crop) => (
          <option key={crop} value={crop}>
            {crop}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CropSelector;
