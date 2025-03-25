/**
 * Schema definitions for FLUX Image Generator MCP Server
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool definition for Generate Image
 */
export const GENERATE_IMAGE_TOOL: Tool = {
  name: "generateImage",
  description: "Generate an image using Black Forest Lab's FLUX model based on a text prompt",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the image to generate"
      },
      width: {
        type: "number",
        description: "Width of the image in pixels",
        default: 1024
      },
      height: {
        type: "number",
        description: "Height of the image in pixels",
        default: 1024
      },
      promptUpsampling: {
        type: "boolean",
        description: "Enhance detail by upsampling the prompt",
        default: false
      },
      seed: {
        type: "number",
        description: "Random seed for reproducible results"
      },
      safetyTolerance: {
        type: "number",
        description: "Content moderation tolerance (1-5)",
        default: 3
      },
      customPath: {
        type: "string",
        description: "Custom path to save the generated image"
      }
    },
    required: ["prompt"]
  }
};

/**
 * Tool definition for Quick Image
 */
export const QUICK_IMAGE_TOOL: Tool = {
  name: "quickImage",
  description: "Quickly generate an image based on a text prompt with default settings",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the image to generate"
      },
      customPath: {
        type: "string",
        description: "Custom path to save the generated image"
      }
    },
    required: ["prompt"]
  }
};

/**
 * Tool definition for Batch Generate Images
 */
export const BATCH_GENERATE_IMAGES_TOOL: Tool = {
  name: "batchGenerateImages",
  description: "Generate multiple images from a list of prompts",
  inputSchema: {
    type: "object",
    properties: {
      prompts: {
        type: "array",
        items: {
          type: "string"
        },
        description: "List of text prompts"
      },
      width: {
        type: "number",
        description: "Width of the images",
        default: 1024
      },
      height: {
        type: "number",
        description: "Height of the images",
        default: 1024
      },
      customPath: {
        type: "string",
        description: "Custom path to save the generated images"
      }
    },
    required: ["prompts"]
  }
};