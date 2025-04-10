# Dynamic MCP SSE Server & Development Tools

## 🚀 Overview

This project provides a Model Context Protocol (MCP) server implementation using Server-Sent Events (SSE) for transport. It features dynamic loading of tools and prompts from dedicated directories (`./src/tools` and `./src/prompts`). The project also includes a command-line interface (CLI) for development assistance (like scaffolding and description enhancement) and a web-based frontend inspector for interacting with the running MCP server.

## ✨ Key Features

- **📡 MCP Server with SSE Transport**: Implements the MCP standard using efficient Server-Sent Events for real-time communication.
- **🧰 Dynamic Tool & Prompt Registration**: Automatically discovers and registers tools (`.ts` files in `./src/tools`) and prompts (`.ts` files in `./src/prompts`) upon server startup or new connection.
- **⚙️ Concurrent Client Handling**: Manages multiple simultaneous client connections via SSE, isolating server instances per connection.
- **💻 Development CLI**: Offers utilities to streamline development:
  - 🏗️ Automated scaffolding for new tools and prompts.
  - 🤖 LLM-powered enhancement of tool descriptions for better contextualization.
  - 📝 Listing available prompts.
- **✨ Web-based MCP Inspector**: A frontend application (built with Next.js and Shadcn UI) allowing users to:
  - 🔗 Connect to the running MCP SSE server.
  - 🔍 View lists of available tools and prompts with their schemas.
  - ⚡ Execute tools and prompts by providing parameters through a form.
  - 📊 Monitor connection status and view activity logs in real-time.

## 🧩 Core Components

1.  **`src/index.ts`**:

    - The main entry point for the MCP server.
    - Uses Express.js to handle HTTP requests and establish SSE connections at the `/sse` endpoint.
    - Manages client sessions and associated MCP server instances.
    - Orchestrates the dynamic loading of tools and prompts using helper functions (`registerToolsFromDirectoryRecursive`, `registerPromptsFromDirectoryRecursive`).
    - Includes dynamic CORS middleware.

2.  **`script/cli.ts`**:

    - A command-line utility designed to aid in the development and maintenance of tools and prompts.
    - Provides an interactive menu for creating new tool/prompt files from templates and improving existing tool descriptions (potentially using an external LLM configured via environment variables).

3.  **`mcp-inspector-frontend/`**:
    - A standalone Next.js application serving as a graphical user interface for the MCP server.
    - Connects to the server's `/sse` endpoint using the `@modelcontextprotocol/sdk/client/sse.js` transport.
    - Provides a user-friendly way to inspect server capabilities (tools, prompts) and interact with them.

## Getting Started

### ⚙️ Prerequisites

- Node.js (latest LTS recommended)
- Yarn (v1 or later)

### ⬇️ Installation

1.  **Clone the repository (if you haven't already).**
2.  **Install root dependencies:**
    ```bash
    yarn install
    ```
3.  **Install frontend dependencies:**
    ```bash
    cd mcp-inspector-frontend
    yarn install
    cd ..
    ```

### 🔑 Environment Configuration

1.  **Server:** Copy `.env.example` to `.env` in the project root. Fill in any necessary environment variables (e.g., API keys if your tools/CLI require them).
2.  **Frontend Inspector:** Create a `.env.local` file inside the `mcp-inspector-frontend/` directory. Add the URL of your running MCP server:
    ```plaintext
    # mcp-inspector-frontend/.env.local
    NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
    ```
    Replace `http://localhost:3001` if your server runs on a different port or host.

### 🚀 Running the Project

1.  **Build the server and CLI:**
    ```bash
    yarn build
    ```
2.  **Run the MCP Server:**

    ```bash
    yarn start
    ```

    _(Alternatively, use `yarn dev` if a development script with hot-reloading is configured)_

3.  **Run the Frontend Inspector:**

    ```bash
    cd mcp-inspector-frontend
    yarn dev
    ```

    The inspector will typically be available at `http://localhost:3000`.

4.  **Run the Tool Manager CLI:**
    ```bash
    yarn tool-manager
    ```
    This command executes `build/script/cli.js` using `node`. Follow the interactive prompts in your terminal to manage tools and prompts. The CLI provides options to:
    - Improve descriptions of existing tools
    - Create a new tool
    - Create a new prompt
    - List all prompts

## 🕹️ Usage

- **📡 MCP Server**: Runs in the background (started via `yarn start` or `yarn dev`). It listens for incoming SSE connections on the configured port (default: 3001). Tools and prompts defined in the respective directories will be available to connected clients.
- **💻 Development CLI**: Execute `node build/script/cli.js` in your terminal. Choose options from the menu to create new tools/prompts or improve descriptions.
- **✨ MCP Inspector**: Access the frontend application in your web browser (default: `http://localhost:3000`). It will attempt to connect to the `NEXT_PUBLIC_MCP_SERVER_URL`. Once connected, use the sidebar to browse available tools and prompts. Select one to view its details and input parameters, then execute it using the provided form. The log panel shows connection status and interaction history.
