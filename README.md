# DevPilot — AI Coding Agent for Your Terminal

**Plan tasks, explore codebases, and make AI-assisted code changes with a human-in-the-loop workflow.**

DevPilot is a TypeScript-based CLI AI coding agent built with Bun, the Vercel AI SDK, and OpenRouter. It provides three interactive modes—Ask, Plan, and Agent—to help developers understand code, break down tasks, and perform file operations with review and approval.

## Overview

Working with an unfamiliar codebase often means searching through files, understanding existing implementations, researching solutions, and carefully applying changes.

DevPilot brings these workflows into an interactive terminal experience. It combines LLM-powered tool calling with filesystem utilities, web research, and staged file operations so developers can review proposed changes before applying them.

## Features

### Ask Mode
- Ask questions and explore the existing codebase.
- Use workspace tools to inspect files and understand project structure.
- Get AI-generated explanations through an interactive CLI.

### Plan Mode
- Generate a structured plan from a natural-language goal.
- Review and select individual steps for execution.
- Use coding tools alongside web search and webpage scraping.
- Review staged mutations before applying them.

### Agent Mode
- Delegate coding tasks using natural-language instructions.
- Read, create, modify, and delete files.
- List and search workspace files and analyze codebase structure.
- Queue shell commands for approval before execution.
- Review staged operations, inspect diffs, and approve or reject changes.

### Human-in-the-loop workflow
- Stage file mutations instead of immediately writing them.
- Preview changes using diffs.
- Approve all changes or review operations individually.
- Track operations and their statuses through an action-tracking system.

### Web research
- Search the web using Firecrawl.
- Scrape webpages into Markdown.
- Retrieve webpage content for research.
- Use web research in Plan Mode when Firecrawl is configured.

## Demo

**Coming soon:** A real terminal walkthrough demonstrating Ask, Plan, and Agent modes, tool execution, diff previews, and approval.

- Demo video: _Add link_
- Product website: _Add link_

## Architecture

DevPilot uses a modular architecture that separates the CLI interface, AI configuration, mode orchestration, tool execution, and terminal rendering.

```text
index.ts
   |
   v
tui/wakeup.ts
   |
   v
modes/cli.ts
   |
   +----------------+----------------+
   |                |                |
   v                v                v
 Ask Mode        Plan Mode       Agent Mode
   |                |                |
   +----------------+----------------+
                    |
                    v
              AI Tool Calling
                    |
                    v
             Workspace Tools
                    |
          +---------+----------+
          |                    |
          v                    v
     Read / Search       Staged Mutations
                               |
                               v
                        Review and Approval
                               |
                               v
                       Apply Approved Changes
```

### Key components

- **AI layer:** Configures the OpenRouter model used by the AI workflows.
- **Mode orchestrators:** Coordinate Ask, Plan, and Agent behavior.
- **Agent tools:** Define structured tools and their input schemas using the Vercel AI SDK and Zod.
- **Tool executor:** Performs workspace operations and manages staged changes.
- **Action tracker:** Records operations and their statuses.
- **Approval flow:** Presents pending operations for review before applying approved mutations.
- **Terminal UI:** Provides interactive prompts, formatted Markdown, and diff output.

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | Application implementation |
| Bun | JavaScript runtime and package management |
| Vercel AI SDK | Agent orchestration and tool calling |
| OpenRouter | LLM provider integration |
| Zod | Tool input validation schemas |
| Firecrawl | Web search and webpage scraping |
| Commander | CLI command structure |
| Clack | Interactive terminal prompts |
| Chalk | Terminal styling |
| Marked + marked-terminal | Markdown rendering in the terminal |
| `diff` | File-change diff generation |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- An OpenRouter API key
- A model available through OpenRouter that supports the operations required by the selected workflow
- A Firecrawl API key for web research features

### 1. Clone the repository

```bash
git clone https://github.com/DENIM-CODING/devPilot.git
cd devPilot
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_DEFAULT_MODEL=your_supported_model_id

# Optional: enables web research tools
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Optional: configure skill directories
SKILLS_DIRS=/path/to/skills
```

Replace the example values with your own credentials and configuration.

Keep `.env` out of version control. Never commit API keys or other secrets.

### 4. Start DevPilot

```bash
bun run index.ts wakeup
```

Follow the interactive prompts to enter CLI Mode and select Ask, Plan, or Agent.

## Usage

### Ask Mode

Use Ask Mode to ask questions about your project and inspect relevant code.

Example:

```text
Explain how this project organizes its AI tools.
```

### Plan Mode

Describe a goal, review the generated plan, select the steps you want to execute, and confirm execution.

Example:

```text
Analyze this codebase and propose a plan to improve error handling.
```

### Agent Mode

Describe a coding task. The agent can inspect relevant files, call available tools, and stage file changes for review.

Example:

```text
Read README.md and add a section describing the project architecture.
```

Before staged mutations are applied, review the proposed operations and their diffs. Approve only the changes you intend to make.

## Project Structure

```text
devPilot/
├── ai/
│   ├── ai.config.ts
│   └── index.ts
├── modes/
│   ├── agent/
│   │   ├── action-tracker.ts
│   │   ├── agent-tools.ts
│   │   ├── approval.ts
│   │   ├── diff-view.ts
│   │   ├── orchestrator.ts
│   │   ├── tool-executor.ts
│   │   └── types.ts
│   ├── ask/
│   │   └── orchestrator.ts
│   ├── plan/
│   │   ├── orchestrator.ts
│   │   ├── planner.ts
│   │   ├── selection.ts
│   │   ├── types.ts
│   │   └── web-tools.ts
│   └── cli.ts
├── tui/
│   ├── terminal-md.ts
│   └── wakeup.ts
├── index.ts
├── package.json
└── tsconfig.json
```

- `ai/` — AI provider configuration.
- `modes/agent/` — Agent orchestration, tools, execution, action tracking, diffs, and approvals.
- `modes/ask/` — Ask Mode orchestration.
- `modes/plan/` — Planning, step selection, execution, and web tools.
- `modes/cli.ts` — Interactive CLI mode selection.
- `tui/` — Startup interface and terminal Markdown rendering.
- `index.ts` — Application entry point.

## Design Decisions

### Structured tool calling

Tools expose descriptions and validated input schemas so the model can request specific operations instead of relying entirely on free-form generated commands.

### Staged file operations

File mutations are staged for review rather than applied immediately. This makes the proposed changes visible to the developer before approval.

### Modular workflows

Ask, Plan, and Agent are separated into their own orchestrators, keeping their responsibilities distinct while allowing them to reuse workspace tools.

### Configurable integrations

OpenRouter provides model access, while Firecrawl enables web research in workflows that use it.

## Current Scope and Limitations

DevPilot is an evolving personal project. Its current scope includes interactive CLI workflows, AI tool calling, workspace operations, staged changes, and web research.

- **Telegram integration:** Not implemented yet.
- **RAG-based semantic code search:** Not implemented yet. Existing workspace search is based on file patterns and optional content matching.
- **Security hardening:** Filesystem boundaries, symlink handling, shell execution, and related safeguards still require a dedicated security audit.
- **Model compatibility:** Output quality and tool-calling behavior depend on the selected model and provider configuration.
- **Production readiness:** Setup, error handling, and security behavior continue to be refined.

Review shell commands and file changes carefully before approving them. Approval is a safeguard, not a guarantee that an operation is harmless.

## Roadmap

- [x] Interactive CLI with Ask, Plan, and Agent modes
- [x] Structured AI tool calling
- [x] Workspace inspection and file operations
- [x] Staged changes and approval workflow
- [x] Diff previews
- [x] Firecrawl-powered web research
- [ ] Complete security audit and harden filesystem and shell boundaries
- [ ] Improve automated testing and error handling
- [ ] Publish a polished project landing page and demo
- [ ] Explore RAG-based semantic code search
- [ ] Add Telegram integration
