import { GoogleGenAI } from "@google/genai";
import axios from 'axios';

interface ImageGenerateOptions {
  prompt: string;
}

// Initialize the AI client
let ai: GoogleGenAI | null = null;

const initializeAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
    return null;
  }

  try {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    return null;
  }
};

export const isImageGenerationAvailable = (): boolean => {
  if (!ai) {
    ai = initializeAI();
  }
  return ai !== null;
};

export const generateImage = async (options: ImageGenerateOptions): Promise<string> => {
  if (!isImageGenerationAvailable()) {
    throw new Error('Image generation service is not available. Please check your API key configuration.');
  }

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: options.prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    });

    // Extract image data from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates returned from image generation');
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error('No parts returned from image generation');
    }

    // Find the image part
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        // Convert base64 data to data URL
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64Data}`;
      }
    }

    throw new Error('No image data found in response');
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image. Please try again.');
  }
};

/**
 * Uploads a base64 image (data URL) to Cloudinary and returns the image URL.
 * @param dataUrl The image as a data URL (e.g., 'data:image/png;base64,...')
 * @returns The Cloudinary image URL
 */
export const uploadToCloudinary = async (dataUrl: string): Promise<string> => {
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!uploadPreset || !cloudName) {
    throw new Error('Cloudinary config missing. Please set VITE_CLOUDINARY_UPLOAD_PRESET and VITE_CLOUDINARY_CLOUD_NAME.');
  }

  // Extract base64 string from data URL
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Invalid data URL for image upload');

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', dataUrl); // Cloudinary supports data URLs directly
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.secure_url;
  } catch (error: unknown) {
    console.error('Cloudinary upload failed:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

// For backward compatibility, create a service object
export const imageService = {
  isAvailable: isImageGenerationAvailable,
  generateImage,
  uploadToCloudinary,
};

export default imageService; 