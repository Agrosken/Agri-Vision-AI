import React, { useState } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import AnalysisMap from './components/AnalysisMap';
import Loader from './components/Loader';
// Fix: Use geminiService for image stitching instead of the WebODM simulation.
import { stitchImages } from './services/geminiService';
import { AlertTriangle, ImageIcon } from './components/Icons';
import { ImagePart } from './types';

// Fix: Add helper function to convert File to base64 string for the API.
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // result is a data URL (e.g., "data:image/jpeg;base64,..."). We only need the base64 part.
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [stitchedImage, setStitchedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStitch = async () => {
    if (images.length < 2) {
      setError('Please upload at least two images to stitch.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStitchedImage(null);

    try {
      // Fix: Convert images to the format expected by the Gemini API.
      const imageParts: ImagePart[] = await Promise.all(
        images.map(async (file) => {
          const base64Data = await fileToBase64(file);
          return {
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          };
        }),
      );
      // Fix: Call the stitchImages function from geminiService.
      const resultUrl = await stitchImages(imageParts);
      setStitchedImage(resultUrl);
    } catch (err) {
      console.error('Stitching failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to stitch images. ${errorMessage} Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const canStitch = images.length > 1 && !isLoading;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col space-y-6 h-fit">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Image Stitching</h2>
            {/* Fix: Update description text to reflect AI processing. */}
            <p className="text-sm text-gray-600">Upload multiple overlapping, top-down drone images. We'll process them with our AI to create a single map.</p>
            <ImageUploader images={images} onImagesChange={setImages} />
            <button
              onClick={handleStitch}
              disabled={!canStitch}
              className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
                canStitch
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {/* Fix: Update button text to reflect AI processing. */}
              {isLoading ? 'Processing with AI...' : 'Stitch Images with AI'}
            </button>
             {images.length > 0 && images.length < 2 && (
              <p className="text-center text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md">
                Please add at least one more image to enable stitching.
              </p>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">Results</h2>
            <div className="min-h-[600px] flex flex-col justify-center items-center">
              {isLoading && <Loader />}
              {error && (
                <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg flex flex-col items-center">
                  <AlertTriangle className="w-12 h-12 mb-2" />
                  <p className="font-semibold">An Error Occurred</p>
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && !stitchedImage && (
                 <div className="text-center text-gray-500">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold">Ready to Stitch</h3>
                    <p>Your stitched map will appear here.</p>
                </div>
              )}
              {stitchedImage && (
                <div className="w-full">
                  <AnalysisMap imageUrl={stitchedImage} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
