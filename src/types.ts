export interface ImagePart {
  inlineData: {
    data: string; // base64 encoded string
    mimeType: string;
  };
}
