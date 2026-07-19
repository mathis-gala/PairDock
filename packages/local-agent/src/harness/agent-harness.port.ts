export interface ProjectAgentHarnessConfig {
  command?: string;
  args?: string[];
}

export interface RunPromptInput {
  sessionId: string;
  projectKey: string;
  prompt: string;
  modelId: string;
  reasoningEffort?: string;
  worktreePath: string;
}

export type AgentHarnessEvent =
  | {
      type: 'output';
      stream: 'stdout' | 'stderr';
      text: string;
    }
  | {
      type: 'done';
      exitCode: number;
    };

export interface AgentHarnessPort {
  runPrompt(input: RunPromptInput): AsyncIterable<AgentHarnessEvent>;
  cancel(sessionId: string): Promise<void>;
}
