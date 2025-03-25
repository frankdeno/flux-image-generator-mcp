# CLAUDE.md for MCP FLUX Image Generator

## Build & Run Commands
- Build: `npm run build`
- Start server: `npm start`
- Dev mode: `npm run dev`
- Watch mode: `npm run watch`
- Add to Claude: `claude mcp add flux -- /path/to/mcp-flux/dist/index.js`

## Code Style Guidelines
- **TypeScript**: Use strict typing with interface definitions
- **Imports**: Use explicit `.js` extensions for local imports in ES modules
- **MCP Tools**: Define with proper inputSchema objects using standard JSON Schema format
- **Error handling**: Always catch and properly format errors in handlers
- **Naming**: Use camelCase for variables/functions, PascalCase for types/interfaces
- **Environment**: Use dotenv for configuration, required BFL_API_KEY for API access
- **Logging**: Log to stderr with meaningful prefix tags like [INFO], [ERROR]
- **File structure**: /src for source files, /dist for compiled output

## Important Notes
- MCP server uses the latest v1.7.0 SDK
- The server exposes three tools: generateImage, quickImage, and batchGenerateImages
- Images output directory configurable via OUTPUT_DIR environment variable
