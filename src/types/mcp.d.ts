declare module '@modelcontextprotocol/sdk' {
  export class Server {
    constructor(meta: { name: string; version: string; description?: string });
    
    setRequestHandler<T>(schema: any, handler: (request: Request<T>) => Promise<any>): void;
    
    listen(transport: any): Promise<void>;
    
    on(event: string, handler: Function): void;
  }
  
  export interface Request<T> {
    method: string;
    params: T;
  }
  
  export interface Response<T> {
    status: string;
    result: T;
  }
  
  export class Client {
    constructor(options: { transport: any });
    
    connect(): Promise<void>;
    
    listTools(): Promise<any[]>;
    
    callTool(name: string, args: any): Promise<any>;
    
    disconnect(): Promise<void>;
  }
  
  export interface CallToolParams {
    name: string;
    arguments: any;
  }
  
  export const CallToolRequestSchema: any;
  
  export const ListToolsRequestSchema: {
    type: 'object';
    properties: {};
  };
  
  export interface Tool {
    name: string;
    description: string;
    inputSchema: any;
  }
}

declare module '@modelcontextprotocol/sdk/transports' {
  export class StdioServerTransport {
    constructor();
  }
  
  export class SpawnTransport {
    constructor(options: { command: string; args: string[]; env: any });
  }
}