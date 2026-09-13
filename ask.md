# Ask Mode

## Question

what is inside the /modes/agent explain me what is going on into proper example code

## Answer

Looking at the `/modes/agent` directory, I can see this is part of an interactive development environment with AI-powered tools. Let me explain the system and show you how it works with some practical examples.

## Overview

This is an **Agent Mode** that allows you to:
1. **Chat with an AI** to make changes to your codebase
2. **Stage operations** for review before applying
3. **Get diffs** to see what will change
4. **Approve/reject** changes manually

The system works by:
1. You describe what you want the AI to do
2. AI uses tools to explore and modify files
3. All changes are staged (pending approval)
4. You review and approve/reject changes
5. Approved changes are applied

## Key Components

Let me explain each file and how they work together:

### 1. **The Main Orchestrator** (`orchestrator.ts`)

This is the entry point where you interact with the agent:

```typescript
export async function runAgentMode() {
  // Show the agent mode header
  console.log(chalk.bold("\n🤖 Agent Mode\n"));
  
  // Ask user what they want the agent to do
  const goal = await text({
    message: "What would you like the agent to do?",
    placeholder: "Concrete task...",
  });
  
  if (isCancel(goal) || typeof goal !== "string" || !goal.trim()) {
    return;
  }

  // Setup the system
  const config = defaultAgentConfig()
  const tracker = new ActionTracker()
  const executor = new ToolExecutor(tracker, config)
  const tools = createAgentTools(executor)

  // Create AI agent with tools
  const agent = new ToolLoopAgent({
    model: getAgentModel(),
    stopWhen: stepCountIs(40),
    instructions: [
      `Workspace root: ${config.codebasePath}`,
      "All mutations are staged until approval.",
    ].join("\n"),
    tools,
  });

  // AI executes the task
  const result = await agent.generate({
    prompt: goal.trim(),
    onStepFinish: ({ toolCalls }) => {
      for (const tc of toolCalls) {
        const preview = JSON.stringify(tc.input).slice(0, 160);
        console.log(
          chalk.green("  ✓"),
          chalk.bold(String(tc.toolName)),
          chalk.dim(preview + (preview.length >= 160 ? "..." : "")),
        );
      }
    },
  });
}
```

### 2. **Tool Executor** (`tool-executor.ts`) - The Core

This manages all file operations and security. Here's how it works:

```typescript
export class ToolExecutor {
  private overlay = new Map<string, string>();  // Staged changes
  private deleted = new Set<string>();          // Staged deletions
  
  constructor(
    private readonly tracker: ActionTracker,
    private readonly config: AgentConfig,
  ) {}

  // Security: Prevent path escapes
  private resolveSafe(rel: string): string {
    const abs = path.resolve(this.config.codebasePath, rel);
    const root = path.resolve(this.config.codebasePath);
    const relCheck = path.relative(root, abs);
    if (relCheck.startsWith("..") || path.isAbsolute(relCheck)) {
      throw new Error(`Path escapes workspace: ${rel}`);
    }
    return abs;
  }

  // Example: Reading a file
  readFile(rel: string): string {
    this.assertNotExcluded(rel, "read_file");
    const abs = this.resolveSafe(rel);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      throw new Error(`File not found: ${rel}`);
    }
    const text = fs.readFileSync(abs, "utf8");
    
    // Log for tracking
    this.tracker.log({
      type: "code_analysis",
      path: this.norm(rel),
      details: { after: text, toolName: "read_file" },
      status: "executed",
    });
    return text;
  }

  // Example: Creating a file (staged)
  createFile(rel: string, content: string): string {
    if (!this.config.tools.allowFileCreation)
      throw new Error("File creation disabled");
    
    this.assertNotExcluded(rel, "create_file");
    const key = this.norm(rel);
    const abs = this.resolveSafe(rel);
    
    if (fs.existsSync(abs) && !this.deleted.has(key)) {
      throw new Error(`create_file: already exists: ${rel}`);
    }
    
    this.overlay.set(key, content);  // Stage the change
    this.tracker.log({
      type: "file_create",
      path: key,
      details: { after: content },
      status: "pending",  // Pending approval
    });
    return `Staged new file: ${key}`;
  }
}
```

**Key Security Features:**
- `resolveSafe()` prevents path escapes (like `../../../etc/passwd`)
- `excluded()` blocks sensitive directories (`node_modules`, `.git`, etc.)
- Path normalization for consistent matching

### 3. **Agent Tools** (`agent-tools.ts`) - AI's Capabilities

This creates the tools that the AI can use:

```typescript
export function createAgentTools(executor: ToolExecutor) {
  return {
    read_file: tool({
      description: "Read a text file from the workspace",
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path: p }) => executor.readFile(p),
    }),

    create_file: tool({
      description: "Stage creation of a new file (not written until the user approves)",
      inputSchema: z.object({ path: z.string(), content: z.string() }),
      execute: async ({ path: p, content }) => executor.createFile(p, content),
    }),

    modify_file: tool({
      description: "Stage a full-file replacement for an existing file (pending approval)",
      inputSchema: z.object({ path: z.string(), content: z.string() }),
      execute: async ({ path: p, content }) => executor.modifyFile(p, content),
    }),

    // ... more tools
  };
}
```

## Practical Examples

Let me show you how this would work in practice:

### Example 1: Reading a File

```typescript
// User asks: "Read the README.md file"
const result = await agent.generate({
  prompt: "Read the README.md file",
});

// AI would use: read_file tool
// Returns: "# My Project\n\nThis is a cool project..."
```

### Example 2: Creating a File

```typescript
// User asks: "Create a component file for a button"
// AI would use: create_file tool
// Staging: "Staged new file: components/Button.tsx"
// File content: "export const Button = () => {...}"
```

### Example 3: Modifying a File

```typescript
// User asks: "Add a function to the utils file"
// AI would use: modify_file tool
// Staging: "Staged update: utils/helpers.ts"
// Shows what will change with diff view
```

### Example 4: Listing Files

```typescript
// User asks: "Show me all TypeScript files"
// AI would use: list_files tool
// Returns: "src/App.tsx\nsrc/components/Button.tsx\n..."
```

## The Approval Flow

After the AI works, all changes are staged. Here's the approval process:

1. **Show pending changes** to the user
2. **Options:**
   - "Approve and apply all" - Accept everything
   - "Review one by one" - Pick and choose
   - "Cancel" - Reject all changes
3. **For each change:**
   - Show the diff using `renderTerminalMarkdown()`
   - User can Accept, Show Diff, or Reject
4. **Apply approved changes** to the filesystem

## Security & Safety Features

1. **Path Escaping Prevention**: Can't access files outside the workspace
2. **Exclusion Rules**: Protected directories are off-limits
3. **Size Limits**: Large files (>1MB) can't be read
4. **User Control**: Every change requires approval
5. **Staging System**: Changes are tested before applied

## How to Use It

From a CLI perspective, the flow would be:

```bash
# Enter agent mode
cursor-agent

# 1. AI asks: "What would you like the agent to do?"
# User types: "Create a README.md file with project info"

# 2. AI explores and works:
✓ read_file: "/workspace/project/README.md" (file not found)
✓ create_file: {"path":"README.md","content":"# My Project..."}

# 3. AI shows staged changes:
# Review changes? 
# [ ] Approve and apply all
# [ ] Review one by one
# [ ] Cancel

# 4. If reviewing:
# [x] Create folder: README.md (file_create)
# [x] Modify file: README.md (file_create)
# 
# ReviewGroup: README.md (file_create, file_modify)
# ┌─────────────────────────────────────────────────────────────┐
# │ `diff` Show diff                                          │
# │ `accept` Accept                                           │
# │ `reject` Reject                                           │
# └─────────────────────────────────────────────────────────────┘

# 5. Changes applied!
# ✓ Applied.
```

This system provides a safe way to let AI make changes while giving you control over what gets applied to your codebase.
