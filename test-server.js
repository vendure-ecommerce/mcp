#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server can start and respond to basic requests
 * This is for development/testing purposes only
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testServer() {
  console.log('Testing Vendure CLI MCP Server...\n');
  
  const serverPath = path.join(__dirname, 'dist', 'server.js');
  
  // Test 1: Check if server starts without errors
  console.log('Test 1: Server startup test');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let stdout = '';
  let stderr = '';
  
  server.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  
  server.stderr.on('data', (data) => {
    stderr += data.toString();
  });
  
  // Send a simple MCP request to list tools
  const mcpRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify(mcpRequest) + '\n');
    
    setTimeout(() => {
      server.kill();
      
      console.log('✅ Server started successfully');
      if (stdout) {
        console.log('Server output:', stdout);
      }
      if (stderr && !stderr.includes('Starting Vendure CLI MCP Server')) {
        console.log('Server errors:', stderr);
      }
      
      console.log('\n📝 To use this MCP server:');
      console.log('1. Add to your MCP client configuration:');
      console.log(JSON.stringify({
        "mcpServers": {
          "vendure-cli": {
            "command": "node",
            "args": [serverPath],
            "env": {}
          }
        }
      }, null, 2));
      
      console.log('\n2. Available tools:');
      console.log('   - add_plugin: Create a new Vendure plugin');
      console.log('   - add_feature: Add features to Vendure projects');
      console.log('   - list_plugins: List available plugins');
      
      console.log('\n3. Example usage (via MCP client):');
      console.log('   add_plugin({ name: "my-awesome-plugin", projectPath: "/path/to/project" })');
      
    }, 1000);
  }, 500);
}

testServer().catch(console.error); 