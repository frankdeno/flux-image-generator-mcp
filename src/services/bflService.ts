/**
 * Black Forest Lab API service for image generation
 * Provides a service to generate images using the Black Forest Lab FLUX API
 */
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';

// Define the API endpoint for Black Forest Lab's FLUX model
const BFL_API_ENDPOINT = 'https://api.bfl.ml/v1/flux-pro-1.1';

/**
 * Options for image generation
 */
export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  promptUpsampling?: boolean;
  seed?: number;
  safetyTolerance?: number;
  saveImage?: boolean;
  filename?: string;
  outputDir?: string;
  customPath?: string;
  maxPollingAttempts?: number;
  pollingInterval?: number;
}

/**
 * Result from image generation
 */
export interface ImageGenerationResult {
  image_url: string;
  local_path: string | null;
}

/**
 * Polls for the result of an image generation request
 * 
 * @param {string} pollingUrl - URL to poll for results
 * @param {string} apiKey - API key for authentication
 * @param {number} maxAttempts - Maximum number of polling attempts
 * @param {number} interval - Interval between polling attempts in milliseconds
 * @returns {Promise<any>} - The completed generation result
 * @throws Will throw an error if polling fails or times out
 */
async function pollForResults(
  pollingUrl: string,
  apiKey: string,
  maxAttempts: number = 30,
  interval: number = 2000
): Promise<any> {
  console.error(`[INFO] Polling ${pollingUrl} for results...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.error(`[INFO] Polling attempt ${attempt}/${maxAttempts}...`);
      
      const response = await axios.get(pollingUrl, {
        headers: {
          'X-Key': apiKey
        }
      });
      
      // Check if we have a result with a sample URL - this is the actual image URL
      if (response.data.result && response.data.result.sample) {
        console.error(`[INFO] Image ready! Found sample URL in result`);
        // Add image_url for compatibility with the rest of the code
        response.data.image_url = response.data.result.sample;
        return response.data;
      } else if (response.data.status === 'completed') {
        console.error(`[INFO] Generation completed successfully`);
        return response.data;
      } else if (response.data.status === 'ready' && response.data.image_url) {
        // Some API versions might use 'ready' status when the image is actually ready
        console.error(`[INFO] Image is ready with 'ready' status and has image_url`);
        return response.data;
      } else if (response.data.status === 'failed') {
        throw new Error(`Generation failed: ${response.data.error || 'Unknown error'}`);
      }
      
      console.error(`[INFO] Status: ${response.data.status}, waiting ${interval/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      console.error(`[ERROR] Error polling for results: ${errorMsg}`);
      throw new Error(`Failed to poll for results: ${errorMsg}`);
    }
  }
  
  throw new Error(`Timed out after ${maxAttempts} polling attempts`);
}

/**
 * Generates an image using the Black Forest Lab API
 * 
 * @param {string} prompt - Text description of the image
 * @param {ImageGenerationOptions} options - Additional options for image generation
 * @returns {Promise<ImageGenerationResult>} - Object containing image URL and local path if saved
 * @throws Will throw an error if the API request fails
 */
export async function generateImage(
  prompt: string, 
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const apiKey = process.env.BFL_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key is required. Set BFL_API_KEY environment variable.');
  }
  
  // Build the request payload
  const payload = {
    prompt,
    width: options.width || 1024,
    height: options.height || 1024,
    prompt_upsampling: options.promptUpsampling || false,
    safety_tolerance: options.safetyTolerance || 3,
    ...(options.seed !== undefined && { seed: options.seed })
  };
  
  let pollingUrl;
  try {
    // Make the initial API request
    console.error(`[INFO] Sending request to FLUX API for prompt: "${prompt}"`);
    const response = await axios.post(BFL_API_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Key': apiKey
      }
    });
    
    // Check if we need to poll for results
    if (response.data.polling_url) {
      pollingUrl = response.data.polling_url;
      console.error(`[INFO] Got polling URL: ${pollingUrl}`);
    } else if (response.data.image_url) {
      // If we got an image URL directly, no need to poll
      console.error(`[INFO] Got image URL directly: ${response.data.image_url}`);
      
      const result: ImageGenerationResult = {
        image_url: response.data.image_url,
        local_path: null
      };
      
      // Save the image locally if requested
      if (options.saveImage) {
        try {
          const filename = options.filename || `flux_${Date.now()}.png`;
          const savePath = await downloadImage(
            result.image_url, 
            filename, 
            options.outputDir || process.env.OUTPUT_DIR || './output',
            options.customPath
          );
          result.local_path = savePath;
        } catch (downloadError: any) {
          console.error(`[ERROR] Error saving image: ${downloadError.message}`);
          // Continue with the operation even if download fails
        }
      }
      
      return result;
    } else {
      throw new Error('Invalid response from Black Forest Lab API: No polling URL or image URL');
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`[ERROR] Error calling Black Forest Lab API: ${errorMsg}`);
    throw new Error(`Failed to generate image: ${errorMsg}`);
  }
  
  // If we have a polling URL, poll for the result
  try {
    const maxPollingAttempts = options.maxPollingAttempts || 30;
    const pollingInterval = options.pollingInterval || 2000;
    
    const pollResult = await pollForResults(
      pollingUrl, 
      apiKey, 
      maxPollingAttempts, 
      pollingInterval
    );
    
    // Check if we have a direct image_url or need to extract it from result.sample
    if (!pollResult.image_url && pollResult.result && pollResult.result.sample) {
      pollResult.image_url = pollResult.result.sample;
    }
    
    if (!pollResult.image_url) {
      throw new Error('No image URL in completed result');
    }
    
    const result: ImageGenerationResult = {
      image_url: pollResult.image_url,
      local_path: null
    };
    
    // Save the image locally if requested
    if (options.saveImage) {
      try {
        const filename = options.filename || `flux_${Date.now()}.png`;
        const savePath = await downloadImage(
          result.image_url, 
          filename, 
          options.outputDir || process.env.OUTPUT_DIR || './output',
          options.customPath
        );
        result.local_path = savePath;
      } catch (downloadError: any) {
        console.error(`[ERROR] Error saving image: ${downloadError.message}`);
        // Continue with the operation even if download fails
      }
    }
    
    return result;
  } catch (error: any) {
    console.error(`[ERROR] Error in polling process: ${error.message}`);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

/**
 * Downloads an image from a URL and saves it to the local filesystem
 * 
 * @param {string} url - URL of the image
 * @param {string} filename - Name to save the file as
 * @param {string} outputDir - Directory to save in (default: ./output)
 * @param {string} customPath - Full custom path to save the image (overrides outputDir and filename)
 * @returns {Promise<string>} - Path where the image was saved
 * @throws Will throw an error if the download or file operations fail
 */
export async function downloadImage(
  url: string, 
  filename: string, 
  outputDir: string = './output',
  customPath?: string
): Promise<string> {
  try {
    console.error(`[INFO] Downloading image from ${url}`);
    
    // Get the image data
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    if (!response.data) {
      throw new Error('Failed to download image: Empty response');
    }
    
    // Determine file path (use customPath if provided)
    let filePath: string;
    let targetDir: string;
    
    if (customPath) {
      filePath = customPath;
      // Extract directory part to ensure it exists
      targetDir = path.dirname(customPath);
    } else {
      filePath = path.join(outputDir, filename);
      targetDir = outputDir;
    }
    
    // Ensure output directory exists
    await fs.mkdir(targetDir, { recursive: true });
    
    // Save the image
    await fs.writeFile(filePath, Buffer.from(response.data));
    console.error(`[INFO] Image saved to ${filePath}`);
    
    return filePath;
  } catch (error: any) {
    console.error(`[ERROR] Error downloading image: ${error.message}`);
    throw new Error(`Failed to save image: ${error.message}`);
  }
}