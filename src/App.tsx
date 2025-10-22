import React, { useState } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import AnalysisMap from './components/AnalysisMap';
import Loader from './components/Loader';
import { stitchImages } from './services/geminiService';
import { AlertTriangle, ImageIcon, XCircle } from './components/Icons';
import { ImagePart } from './types';

const MAX_DIMENSION = 1920;
const BATCH_SIZE_LIMIT_BYTES = 3.8 * 1024 * 1024; // 3.8MB for safety
const COST_PER_IMAGE_INPUT = 0.0025; // Estimated cost for Gemini Flash Image input

const resizeAndEncodeImage = (file: File): Promise<ImagePart> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) return reject(new Error("Couldn't read file"));
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.85);
        resolve({
          inlineData: { data: dataUrl.split(',')[1], mimeType },
        });
      };
      img.onerror = () => reject(new Error('Corrupted image file.'));
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
  });
};

const getPayloadSize = (payload: object): number => {
    const jsonString = JSON.stringify(payload);
    return new TextEncoder().encode(jsonString).length;
};

const App: React.FC = () => {
  const [processedImages, setProcessedImages] = useState<ImagePart[]>([]);
  const [processingErrors, setProcessingErrors] = useState<{fileName: string; message: string}[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [totalFilesToProcess, setTotalFilesToProcess] = useState<number>(0);
  const [stitchedImage, setStitchedImage] = useState<string | null>(null);
  const [isStitching, setIsStitching] = useState<boolean>(false);
  const [stitchError, setStitchError] = useState<string | null>(null);
  const [stitchProgressMessage, setStitchProgressMessage] = useState<string>('');
  const [estimation, setEstimation] = useState<{ batches: number; cost: string } | null>(null);

  const processAllFiles = async (files: File[]) => {
    // Reset all states for a new upload session
    setIsProcessingFiles(true);
    setTotalFilesToProcess(files.length);
    setProcessedCount(0);
    setProcessedImages([]);
    setProcessingErrors([]);
    setStitchedImage(null);
    setStitchError(null);
    setEstimation(null);

    const successfulImages: ImagePart[] = [];
    const failedFiles: {fileName: string; message: string}[] = [];

    // Process files one by one and update progress
    for (const file of files) {
        try {
            const imagePart = await resizeAndEncodeImage(file);
            successfulImages.push(imagePart);
        } catch (err) {
            failedFiles.push({
                fileName: file.name,
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        }
        // Use a functional update to correctly increment the counter inside the loop
        setProcessedCount(prevCount => prevCount + 1);
    }
    
    // Set final results after the loop
    setProcessedImages(successfulImages);
    setProcessingErrors(failedFiles);
    setIsProcessingFiles(false);

    // --- Cost Estimation Logic ---
    if (successfulImages.length > 1) {
      let batches = 0;
      let remainingForEst = [...successfulImages];
      let currentStitchedImagePartForEst: ImagePart | null = null;
      while(remainingForEst.length > 0) {
        batches++;
        const batchToSendForEst: ImagePart[] = [];
        for (const nextImage of remainingForEst) {
            const potentialPayload = {
                images: [...batchToSendForEst, nextImage],
                baseImage: currentStitchedImagePartForEst,
            };
            if (getPayloadSize(potentialPayload) > BATCH_SIZE_LIMIT_BYTES) break;
            batchToSendForEst.push(nextImage);
        }
        if (batchToSendForEst.length === 0) { 
          setStitchError("An image is too large to process. Please try smaller images.");
          setEstimation(null);
          return;
        }
        remainingForEst = remainingForEst.slice(batchToSendForEst.length);
        if (remainingForEst.length > 0) {
          // Simulate the next stitched image for accurate sizing
          // A more accurate simulation would be to use the largest image in the batch
          currentStitchedImagePartForEst = batchToSendForEst.reduce((largest, current) => 
            (current.inlineData.data.length > largest.inlineData.data.length) ? current : largest
          );
        }
      }
      const totalCost = successfulImages.length * COST_PER_IMAGE_INPUT;
      setEstimation({ batches, cost: totalCost.toFixed(4) });
    }
    // --- End of Estimation Logic ---
  };

  const handleStitch = async () => {
    if (processedImages.length < 2) {
      setStitchError('Please provide at least two valid images to stitch.');
      return;
    }

    setIsStitching(true);
    setStitchError(null);
    setStitchedImage(null);
    setStitchProgressMessage('Initiating stitching process...');

    try {
      let remainingImages = [...processedImages];
      let currentStitchedImagePart: ImagePart | null = null;
      let batchNumber = 1;
      const totalBatches = estimation?.batches || 1;
      
      while (remainingImages.length > 0) {
        const batchToSend: ImagePart[] = [];
        
        for (const nextImage of remainingImages) {
            const potentialPayload = {
                images: [...batchToSend, nextImage],
                baseImage: currentStitchedImagePart,
            };
            if (getPayloadSize(potentialPayload) > BATCH_SIZE_LIMIT_BYTES) break;
            batchToSend.push(nextImage);
        }
        
        if (batchToSend.length === 0) {
            throw new Error(`An image is too large to process with the current map size.`);
        }
        
        setStitchProgressMessage(`Stitching Batch ${batchNumber}/${totalBatches}...`);
        
        const resultUrl = await stitchImages(batchToSend, currentStitchedImagePart);
        
        remainingImages = remainingImages.slice(batchToSend.length);

        if (remainingImages.length === 0) {
          setStitchedImage(resultUrl);
        } else {
          const base64Data = resultUrl.split(',')[1];
          const mimeType = resultUrl.substring(resultUrl.indexOf(':') + 1, resultUrl.indexOf(';'));
          currentStitchedImagePart = { inlineData: { data: base64Data, mimeType } };
        }
        batchNumber++;
      }

    } catch (err) {
      console.error('Stitching failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setStitchError(`Failed to stitch images. ${errorMessage}`);
    } finally {
      setIsStitching(false);
      setStitchProgressMessage('');
    }
  };

  const allFilesProcessed = !isProcessingFiles && totalFilesToProcess > 0;
  const canStitch = processedImages.length > 1 && !isStitching && allFilesProcessed;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col space-y-6 h-fit">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Image Stitching</h2>
            <p className="text-sm text-gray-600">Upload multiple overlapping, top-down drone images. We'll optimize them and use AI to create a single map.</p>
            <ImageUploader onFilesSelected={processAllFiles} disabled={isProcessingFiles || isStitching} />

            {totalFilesToProcess > 0 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-gray-700">File Pre-processing</p>
                      <p className="text-sm text-gray-500">{processedCount} / {totalFilesToProcess}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${totalFilesToProcess > 0 ? (processedCount / totalFilesToProcess) * 100 : 0}%` }} />
                    </div>
                </div>
            )}

            {processingErrors.length > 0 && allFilesProcessed && (
              <div className="space-y-2">
                  <p className="font-semibold text-red-600 text-sm">Processing failed for {processingErrors.length} file(s):</p>
                  <ul className="text-xs text-red-500 bg-red-50 p-3 rounded-md space-y-1 max-h-24 overflow-y-auto">
                      {processingErrors.map(err => <li key={err.fileName} className="flex items-center"><XCircle className="w-3 h-3 mr-2 flex-shrink-0"/>{err.fileName}</li>)}
                  </ul>
              </div>
            )}
            
            {estimation && allFilesProcessed && (
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
                <p className="font-semibold">Stitching Estimate:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><span className="font-medium">{estimation.batches} API call(s)</span> required.</li>
                  <li>Estimated cost: <span className="font-medium">${estimation.cost}</span> (at ${COST_PER_IMAGE_INPUT}/image).</li>
                </ul>
              </div>
            )}
            
            <button
              onClick={handleStitch}
              disabled={!canStitch}
              className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ${canStitch ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {isStitching ? 'Stitching...' : `Stitch ${processedImages.length > 0 ? processedImages.length : ''} Images`}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">Results</h2>
            <div className="min-h-[600px] flex flex-col justify-center items-center">
              {isStitching && <Loader message={stitchProgressMessage} />}
              {stitchError && (
                <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg flex flex-col items-center max-w-lg">
                  <AlertTriangle className="w-12 h-12 mb-2" />
                  <p className="font-semibold">An Error Occurred</p>
                  <p>{stitchError}</p>
                </div>
              )}
              {!isStitching && !stitchError && !stitchedImage && (
                 <div className="text-center text-gray-500">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold">Ready to Stitch</h3>
                    <p>Your stitched map will appear here.</p>
                </div>
              )}
              {stitchedImage && <AnalysisMap imageUrl={stitchedImage} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;