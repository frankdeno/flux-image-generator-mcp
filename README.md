# FLUX Image Generator MCP Server

An MCP (Model Context Protocol) server for generating images using Black Forest Lab's FLUX model. Uses the latest MCP SDK (v1.7.0).

## Features

- Generate images based on text prompts
- Customize image dimensions, prompt upsampling, and safety settings
- Save generated images locally
- Batch image generation from multiple prompts

## Prerequisites

- Node.js (v18.0.0 or higher)
- Black Forest Lab API key (get one at https://api.bfl.ml)

## Installation

### From Source

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example` and add your Black Forest Lab API key:

```
BFL_API_KEY=your_api_key_here
```

4. Build the project:

```bash
npm run build
```

### Using npm

```bash
npm install -g @modelcontextprotocol/server-flux-image-generator
```

## Usage

### Starting the MCP Server

Start the server with:

```bash
npm start
```

For development with auto-recompilation:

```bash
npm run watch
```

### Integrating with MCP Clients

To use this server with MCP clients (like Claude), add the following to your client's configuration:

```json
{
  "mcpServers": {
    "flux-image-generator": {
      "command": "mcp-server-flux-image-generator",
      "env": {
        "BFL_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### generateImage

Generates an image based on a text prompt with customizable settings.

**Parameters:**
- `prompt` (string, required): Text description of the image to generate
- `width` (number, optional, default: 1024): Width of the image in pixels
- `height` (number, optional, default: 1024): Height of the image in pixels
- `promptUpsampling` (boolean, optional, default: false): Enhance detail by upsampling the prompt
- `seed` (number, optional): Random seed for reproducible results
- `safetyTolerance` (number, optional, default: 3): Content moderation tolerance (1-5)

**Example:**
```json
{
  "prompt": "A serene lake at sunset with mountains in the background",
  "width": 1024,
  "height": 768,
  "promptUpsampling": true,
  "seed": 12345,
  "safetyTolerance": 3
}
```

### quickImage

A simplified tool for quickly generating images with default settings.

**Parameters:**
- `prompt` (string, required): Text description of the image to generate

**Example:**
```json
{
  "prompt": "A futuristic cityscape with flying cars"
}
```

### batchGenerateImages

Generates multiple images from a list of prompts.

**Parameters:**
- `prompts` (array of strings, required): List of text prompts (maximum 10)
- `width` (number, optional, default: 1024): Width of the images
- `height` (number, optional, default: 1024): Height of the images

**Example:**
```json
{
  "prompts": [
    "A serene lake at sunset",
    "A futuristic cityscape",
    "A magical forest with glowing plants"
  ],
  "width": 1024,
  "height": 768
}
```

## Output Format

All tools return responses in this format:

```json
{
  "image_url": "https://storage.example.com/generated_image.jpg",
  "local_path": "/path/to/output/flux_1234567890.png"
}
```

For errors:

```json
{
  "error": true,
  "message": "Error description"
}
```

The batch tool returns:

```json
{
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "prompt": "A serene lake at sunset",
      "success": true,
      "image_url": "https://storage.example.com/image1.jpg",
      "local_path": "/path/to/output/flux_batch_1234567890_0.png"
    },
    {
      "prompt": "A futuristic cityscape",
      "success": true,
      "image_url": "https://storage.example.com/image2.jpg",
      "local_path": "/path/to/output/flux_batch_1234567890_1.png"
    },
    {
      "prompt": "Prohibited content",
      "success": false,
      "error": "Content policy violation"
    }
  ]
}
```

## License

MIT