#!/usr/bin/env node

/**
 * MCP Server for Black Forest Lab FLUX image generation
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from 'dotenv';
import { generateImage } from './services/bflService.js';
import {
  GENERATE_IMAGE_TOOL,
  QUICK_IMAGE_TOOL,
  BATCH_GENERATE_IMAGES_TOOL
} from './schemas.js';

// Load environment variables
dotenv.config();

// Retrieve the Black Forest Lab API key from environment variables
const BFL_API_KEY = process.env.BFL_API_KEY;
if (!BFL_API_KEY) {
  console.error("Error: BFL_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize the server with tool metadata and capabilities
const server = new Server(
  {
    name: "flux-image-generator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Registers a handler for listing available tools.
 * When the client requests a list of tools, this handler returns all available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    GENERATE_IMAGE_TOOL,
    QUICK_IMAGE_TOOL,
    BATCH_GENERATE_IMAGES_TOOL
  ],
}));

/**
 * Registers a handler for calling a specific tool.
 * Processes requests by validating input and invoking the appropriate tool.
 * 
 * @param {object} request - The incoming tool call request.
 * @returns {Promise<object>} The response containing the tool's result or an error.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    if (!args) {
      throw new Error("No arguments provided");
    }

    switch (name) {
      case "generateImage": {
        // Validate parameters
        if (typeof args.prompt !== 'string') {
          throw new Error("Invalid prompt: must be a string");
        }

        // Use the full image generation capabilities
        const options = {
          width: typeof args.width === 'number' ? args.width : 1024,
          height: typeof args.height === 'number' ? args.height : 1024,
          promptUpsampling: typeof args.promptUpsampling === 'boolean' ? args.promptUpsampling : false,
          seed: typeof args.seed === 'number' ? args.seed : undefined,
          safetyTolerance: typeof args.safetyTolerance === 'number' ? args.safetyTolerance : 3,
          saveImage: true,
          filename: `flux_${Date.now()}.png`,
          customPath: typeof args.customPath === 'string' ? args.customPath : undefined
        };
        
        const result = await generateImage(args.prompt, options);
        
        // Return a plain text response with the image URL and save location
        let textContent = `Image generated\nLink: ${result.image_url}`;
        
        // Add information about where the image was saved
        if (result.local_path) {
          textContent += `\nImage saved to: ${result.local_path}`;
        }
        
        return {
          content: [
            { type: "text", text: textContent }
          ],
          isError: false,
        };
      }
      
      case "quickImage": {
        // Validate parameters
        if (typeof args.prompt !== 'string') {
          throw new Error("Invalid prompt: must be a string");
        }

        // Simple version with just a prompt
        const result = await generateImage(args.prompt, {
          saveImage: true,
          filename: `flux_quick_${Date.now()}.png`,
          customPath: typeof args.customPath === 'string' ? args.customPath : undefined
        });
        
        // Return a plain text response with the image URL and save location
        let textContent = `Image generated\nLink: ${result.image_url}`;
        
        // Add information about where the image was saved
        if (result.local_path) {
          textContent += `\nImage saved to: ${result.local_path}`;
        }
        
        return {
          content: [
            { type: "text", text: textContent }
          ],
          isError: false,
        };
      }
      
      case "batchGenerateImages": {
        if (!Array.isArray(args.prompts)) {
          throw new Error("Invalid arguments for batchGenerateImages: 'prompts' must be an array");
        }
        
        // Process multiple prompts
        const results = [];
        let htmlOutput = "";
        
        for (const prompt of args.prompts) {
          if (typeof prompt !== 'string') {
            throw new Error("Invalid prompt in array: each prompt must be a string");
          }
          
          try {
            const result = await generateImage(prompt, {
              width: typeof args.width === 'number' ? args.width : 1024,
              height: typeof args.height === 'number' ? args.height : 1024,
              saveImage: true,
              filename: `flux_batch_${Date.now()}_${args.prompts.indexOf(prompt)}.png`,
              customPath: typeof args.customPath === 'string' ? 
                // If customPath ends with .png or .jpg, use it as is for the first image
                // Otherwise treat it as a directory and append the generated filename
                (args.prompts.length === 1 && /\.(png|jpg|jpeg)$/i.test(args.customPath) ? 
                  args.customPath : 
                  args.customPath ? `${args.customPath}/flux_batch_${Date.now()}_${args.prompts.indexOf(prompt)}.png` : undefined) : 
                undefined
            });
            
            // Add text output for this result with save location info
            htmlOutput += `Prompt: "${prompt}"\n`;
            htmlOutput += `Image generated\nLink: ${result.image_url}\n`;
            
            // Add information about where the image was saved
            if (result.local_path) {
              htmlOutput += `Image saved to: ${result.local_path}\n`;
            }
            
            htmlOutput += `\n`;
            
            results.push({
              prompt,
              success: true,
              image_url: result.image_url,
              local_path: result.local_path
            });
          } catch (error: any) {
            // Add error message for failed generations
            htmlOutput += `Failed to generate image for prompt: "${prompt}"\nError: ${error.message}\n\n`;
            
            results.push({
              prompt,
              success: false,
              error: error.message
            });
          }
        }
        
        return {
          content: [
            { type: "text", text: htmlOutput }
          ],
          isError: false,
        };
      }
      
      default:
        // Respond with an error if an unknown tool is requested
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    // Return error details in the response
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Initializes and runs the server using standard I/O for communication.
 * Logs an error and exits if the server fails to start.
 */
async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("FLUX Image Generator MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

// Start the server and catch any startup errors
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});