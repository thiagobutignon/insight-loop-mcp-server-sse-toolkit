# Contributing to Insight Loop Agentic Framework

Thank you for your interest in contributing to the Insight Loop project!

This framework was built to enable real-time, agentic, and modular orchestration systems — with a focus on dynamic reasoning, prompt-driven intelligence, and tool-based automation via CLI and LLMs.

---

## Overview

Insight Loop is based on 4 atomic pillars:

- **Tools**: Executable atomic functions used by agents
- **Prompts**: Reasoning templates created by users or agents
- **Resources**: Data or documents consumed by the system
- **AgentMesh**: A coordination layer between agents, tools, and logic chains

---

## How to Contribute

### 1. Before You Begin

- Read the [README.md](./README.md) for context and architecture
- Review the [LICENSE](./LICENSE) — Non-commercial usage only until April 10, 2040

### 2. What You Can Contribute

- Bug fixes
- New tools (must be atomic and well-documented)
- New prompt templates (with clear use cases)
- CLI improvements or enhancements
- Documentation improvements
- Unit tests or usage examples

> ⚠️ Please **avoid contributions** that introduce heavy dependencies or break the atomic and composable structure of the system.

### 3. How to Submit a Contribution

1. Fork this repository
2. Create a new branch:
   ```bash
   git checkout -b feat/new-image-tool
   Make atomic commits with descriptive messages:
   ```

arduino
Copy
Edit
feat: add tool for image generation using Midjourney API
Open a pull request and fill out the PR template

Code Style Guidelines
Use TypeScript

Use absolute imports (@/core, @/cli, @/tools, etc.)

Use eslint + prettier (configured in the repo)

Prefer atomic and reusable design patterns

Tests should be written using Vitest or Jest

Communication
Open an issue for bugs, feature suggestions, or architecture discussions

For larger collaborations or commercial partnership inquiries, contact us at:
contact@insightloop.ai

We’re building one of the most advanced and flexible agentic frameworks in the world.
Thank you for being part of this journey.
Together, we're redefining how humans and machines reason and act — in real time.

— The Insight Loop Team
