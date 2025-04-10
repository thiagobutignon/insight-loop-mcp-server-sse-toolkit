# InsightLoop Dynamic MCP Server SSE, MCP Client Inspector & Development Tools

## 🚀 Overview

This project provides a Model Context Protocol (MCP) server implementation using Server-Sent Events (SSE) for transport. It features dynamic loading of tools and prompts from dedicated directories (`./src/tools` and `./src/prompts`). The project also includes a command-line interface (CLI) for development assistance (like scaffolding and description enhancement) and a web-based frontend inspector for interacting with the running MCP server.

## 📚 Table of Contents

- [🚀 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🧩 Core Components](#-core-components)
- [⚙️ Getting Started](#️-getting-started)
  - [Prerequisites](#️-prerequisites)
  - [Installation](#️-installation)
  - [Environment Configuration](#-environment-configuration)
  - [Running the Project (Manual)](#-running-the-project-manual)
  - [🐳 Docker Setup](#-docker-setup)
    - [Using Docker Compose Directly](#using-docker-compose-directly)
    - [Using Makefile (Recommended)](#using-makefile-recommended)
- [🕹️ Usage](#️-usage)
- [🗺️ Roadmap](#️-roadmap)
- [❓ FAQ](#-faq)

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

  ![MCP Inspector Tools](docs/mcp-inspector-front-end-tools.png)

## 🧩 Core Components

1.  **`src/index.ts`**:

    - The main entry point for the MCP server.
    - Uses Express.js to handle HTTP requests and establish SSE connections at the `/sse` endpoint.
    - Manages client sessions and associated MCP server instances.
    - Orchestrates the dynamic loading of tools and prompts using helper functions (`registerToolsFromDirectoryRecursive`, `registerPromptsFromDirectoryRecursive`).
    - Includes dynamic CORS middleware.

![MCP Server with SSE](docs/mcp-server-with-sse.png)

2.  **`script/cli.ts`**:

    - A command-line utility designed to aid in the development and maintenance of tools and prompts.
    - Provides an interactive menu for creating new tool/prompt files from templates and improving existing tool descriptions (using an external LLM configured via environment variables).

![Example CLI usage](docs/script-cli.png)

3.  **`mcp-inspector-frontend/`**:
    - A standalone Next.js application serving as a graphical user interface for the MCP server.
    - Connects to the server's `/sse` endpoint using the `@modelcontextprotocol/sdk/client/sse.js` transport.
    - Provides a user-friendly way to inspect server capabilities (tools, prompts) and interact with them.

![MCP Inspector Prompts](docs/mcp-inspector-front-end-prompts.png)

## ⚙️ Getting Started

### Prerequisites

- Node.js (latest LTS recommended)
- Yarn (v1 or later)
- Docker & Docker Compose
- `make` (usually pre-installed on Linux/macOS; available for Windows)

### Installation

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

### Environment Configuration

1.  **Server:** Copy `.env.example` to `.env` in the project root. Fill in any necessary environment variables (e.g., API keys if your tools/CLI require them).
2.  **Frontend Inspector:** Create a `.env.local` file inside the `mcp-inspector-frontend/` directory. Add the URL of your running MCP server:
    ```plaintext
    # mcp-inspector-frontend/.env.local
    NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
    ```
    Replace `http://localhost:3001` if your server runs on a different port or host. Ensure this URL is accessible from where you run the frontend (e.g., use `http://host.docker.internal:3001` if running the frontend outside Docker but the server inside Docker on Docker Desktop, or `http://<your-docker-host-ip>:3001` if accessing from another machine). When using `make` or `docker-compose`, the services might be accessible via `http://localhost:<port>` directly depending on the configuration.

### Running the Project (Manual)

This method is useful if you don't want to use Docker.

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
    This command executes `build/script/cli.js` using `node`. Follow the interactive prompts in your terminal to manage tools and prompts.

### 🐳 Docker Setup

Using Docker is recommended for consistent environments and easier deployment. Ensure you have Docker and Docker Compose installed.

#### Using Docker Compose Directly

You can interact with Docker Compose directly using the provided YAML files:

1.  **For Development:**
    Builds and starts the containers defined in `docker-compose.dev.yml` (often with hot-reloading).

    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

    To stop: `docker-compose -f docker-compose.dev.yml down`

2.  **For Production:**
    Builds and starts the containers defined in `docker-compose.prod.yml` (optimized for production).
    ```bash
    docker-compose -f docker-compose.prod.yml up --build -d # -d runs in detached mode
    ```
    To stop: `docker-compose -f docker-compose.prod.yml down`

_Note: You might need to adjust the `NEXT_PUBLIC_MCP_SERVER_URL` in `mcp-inspector-frontend/.env.local` depending on your Docker networking setup._

#### Using Makefile (Recommended)

A `Makefile` is provided in the project root to simplify common Docker operations. Ensure `make` is installed on your system.

- **Development Environment:**

  - `make dev-up`: Builds images (if needed) and starts development containers using `docker-compose.dev.yml`.
  - `make dev-down`: Stops and removes the development containers.
  - `make dev-logs`: Tails the logs from the running development containers.

- **Production Environment:**

  - `make prod-up`: Builds images (if needed) and starts production containers using `docker-compose.prod.yml` in detached mode.
  - `make prod-down`: Stops and removes the production containers.
  - `make prod-logs`: Tails the logs from the running production containers.

- **Cleanup:**
  - `make clean`: Stops all project containers and removes associated volumes, networks, and potentially built images (use with caution, as it cleans thoroughly).

**Example Workflow (Development):**

1.  Start the development services: `make dev-up`
2.  Access the frontend inspector (usually `http://localhost:3000`) and the server (usually `http://localhost:3001`).
3.  View logs if needed: `make dev-logs`
4.  When finished, stop the services: `make dev-down`

## 🕹️ Usage

- **📡 MCP Server**: Runs in the background (started via `yarn start`, `yarn dev`, `docker-compose up`, or `make *-up`). Listens for SSE connections on the configured port (default: 3001).
- **💻 Development CLI**: Execute `yarn tool-manager` in your terminal (requires manual build/run or exec into the server container if using Docker).
- **✨ MCP Inspector**: Access the frontend application in your web browser (default: `http://localhost:3000` when run manually or via standard Docker setup). Connect to the server's URL specified in `NEXT_PUBLIC_MCP_SERVER_URL`. Use the interface to browse, inspect, and execute tools/prompts.

## 🗺️ Roadmap

- [x] Docker support (Basic setup added, Makefile provided)
- [ ] Improve layout Chat with LLM
- [ ] Python Example
- [ ] MCP Server Resources
- [ ] MCP Server Sampling
- [ ] MCP Server Roots
- [ ] How to deploy? (Expand Docker section, add guides for cloud/serverless)

## ❓ FAQ

<details>
<summary>1. What is the MCP SSE Server?</summary>

**Answer:** The MCP (Model Context Protocol) SSE Server is a real-time communication server that uses Server-Sent Events (SSE) to deliver messages to connected clients. It adheres to the MCP standard, facilitating a structured and scalable communication protocol for AI-driven tools and prompts. This design enables efficient updates and interactions, making it ideal for projects that require dynamic, live data streaming and command execution.

</details>

<details>
<summary>2. How does dynamic tool and prompt registration work?</summary>

**Answer:** Upon starting up or when a new client connection is established, the MCP server automatically scans dedicated directories (`./src/tools` and `./src/prompts`). It registers any new or updated TypeScript files found there. This dynamic discovery process ensures that any changes or additions to your tools and prompts are readily available to connected clients without needing to restart the server manually (or container, if using Docker).

</details>

<details>
<summary>3. What are Server-Sent Events (SSE) and why are they used?</summary>

**Answer:** Server-Sent Events (SSE) provide a mechanism for servers to push data to clients over a standard HTTP connection. Unlike WebSockets, which enable bi-directional communication, SSE focuses on one-way communication from server to client. This makes SSE particularly well-suited for live updates such as monitoring logs, showing dynamic tool execution status, or streaming notifications in real time.

</details>

<details>
<summary>4. How do I add or create new tools and prompts?</summary>

**Answer:** Add new TypeScript files to `./src/tools` or `./src/prompts`. If running manually with `yarn dev` or using a Docker setup with volume mounts and hot-reloading (`make dev-up`), changes should be reflected automatically. Alternatively, use the CLI tool `yarn tool-manager` (run manually or `docker exec <container_id> yarn tool-manager`) for guided scaffolding and description enhancement.

</details>

<details>
<summary>5. How do I configure the project?</summary>

**Answer:** Configure environment variables:

- Server: Copy `.env.example` to `.env` in the root directory. Update settings as needed. This `.env` file is typically used by both manual runs and Docker setups.
- Frontend Inspector: Create `mcp-inspector-frontend/.env.local` and set `NEXT_PUBLIC_MCP_SERVER_URL` (e.g., `http://localhost:3001`). Ensure this URL is correct for your setup (manual vs. Docker).

</details>

<details>
<summary>6. How do I run the MCP Server and Inspector?</summary>

**Answer:** Choose your method:

- **Manual:** `yarn build`, then `yarn start` for server, `cd mcp-inspector-frontend && yarn dev` for inspector.
- **Docker (Recommended):** Use the `Makefile` commands:
  - Development: `make dev-up` (starts both), `make dev-down` (stops). Access at `http://localhost:3000` (frontend) & `http://localhost:3001` (server).
  - Production: `make prod-up`, `make prod-down`.
- **Docker Compose:** Use `docker-compose -f <file> up/down` commands directly.

</details>

<details>
<summary>7. What is the role of the Development CLI?</summary>

**Answer:** The CLI (`yarn tool-manager`) assists development:

- Automated Scaffolding: Generates new tool/prompt files.
- LLM-Powered Enhancement: Improves tool descriptions.
- Prompt Listing: Lists available prompts.
  Run it manually or via `docker exec` if using containers.

</details>

<details>
<summary>8. How does the web-based MCP Inspector benefit me?</summary>

**Answer:** The MCP Inspector (`http://localhost:3000` typically) provides a GUI to:

- Inspect available tools/prompts and schemas.
- Execute tools/prompts via forms.
- Monitor connection status and logs in real-time.
  It simplifies interaction and debugging with the MCP server.

</details>

<details>
<summary>9. How can I contribute or seek support for this project?</summary>

**Answer:** Contributions are welcome!

- Issues/Requests: Use the GitHub issue tracker.
- Pull Requests: Follow contribution guidelines.
- Community: Engage via project forums or chat channels if available.

</details>

<details>
<summary>10. What are the future enhancements mentioned in the roadmap?</summary>

**Answer:** Future plans include:

- Enhanced Docker/Deployment: Improve container configs and add deployment guides.
- MCP Server Features: Add resource management, sampling.
- Examples & Integrations: Python examples, improved UI (chat).
- Refine existing features for scalability and ease of use.

</details>
