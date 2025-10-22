import type { ImagePart } from '../types';

// This function now calls our secure backend endpoint instead of Google's API directly.
export const stitchImages = async (
  images: ImagePart[],
): Promise<string> => {
  // We send a request to our own serverless function.
  const response = await fetch('/api/stitch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // The body contains the image data to be forwarded to the Gemini API.
    body: JSON.stringify({ images }),
  });

  const result = await response.json();

  if (!response.ok) {
    // If the serverless function returned an error, we throw it to be caught by the UI.
    throw new Error(result.error || 'Failed to communicate with the stitching service.');
  }

  if (result.imageUrl) {
    return result.imageUrl;
  }

  throw new Error("The stitching service did not return a valid image URL.");
};
