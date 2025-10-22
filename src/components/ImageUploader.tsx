import React, { useState } from 'react';
import { UploadCloudIcon } from './Icons';

interface ImageUploaderProps {
  onFilesSelected: (images: File[]) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
      // Reset the input value to allow selecting the same file(s) again
      event.target.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Add Drone Images
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
          disabled ? 'bg-gray-100 cursor-not-allowed' :
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <div className="space-y-1 text-center">
          <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className={`relative rounded-md font-medium  focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${disabled ? 'text-gray-400' : 'text-blue-600 hover:text-blue-500 cursor-pointer'}`}
            >
              <span>Upload files</span>
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                className="sr-only" 
                multiple 
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                disabled={disabled}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
