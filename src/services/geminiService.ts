import type { ImagePart } from '../types';

export const stitchImages = async (
  images: ImagePart[],
  baseImage: ImagePart | null = null,
): Promise<string> => {
  const response = await fetch('/api/stitch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images, baseImage }),
  });

  const result = await response.json();

  if (!response.ok) {
    // Forward the specific error message from the serverless function.
    throw new Error(result.error || 'Failed to communicate with the stitching service.');
  }

  if (result.imageUrl) {
    return result.imageUrl;
  }

  throw new Error("The stitching service did not return a valid image URL.");
};
