import { isCancel, text } from "@clack/prompts";
import chalk from "chalk";
import { defaultAgentConfig } from "./types";
import { ActionTracker } from "./action-tracker";
import { ToolExecutor } from "./tool-executor";

export async function runAgentMode() {
  console.log(chalk.bold("\n🤖 Agent Mode\n"));

  const goal = await text({
    message: "What would you like the agent to do?",
    placeholder: "Concrete task...",
  });

  if (isCancel(goal) || typeof goal !== "string" || !goal.trim()) {
    //console.log(chalk.dim("\nGoodbye.\n"));
    return;
  }

  //console.log("User goal:", goal);

  const config = defaultAgentConfig()
  const tracker = new ActionTracker()
  const executor = new ToolExecutor(tracker,config);
}