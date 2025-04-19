"use client"; // Keep client-side interactivity for buttons

import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { Button } from "@/components/ui/button";

interface PromptsSidebarProps {
  availablePrompts: Prompt[];
  selectedPrompt: Prompt | null;
  isConnected: boolean;
  onSelectPrompt: (prompt: Prompt) => void;
}

export function PromptsSidebar({
  availablePrompts,
  selectedPrompt,
  isConnected,
  onSelectPrompt,
}: PromptsSidebarProps) {
  return (
    <>
      {availablePrompts.length > 0 ? (
        availablePrompts.map((prompt) => (
          <Button
            key={prompt.name}
            variant={
              selectedPrompt?.name === prompt.name ? "default" : "outline" // Use default for selected
            }
            onClick={() => onSelectPrompt(prompt)}
            className="w-full justify-start text-left h-auto py-2 flex flex-col items-start" // Allow multi-line
            disabled={!isConnected}
          >
            <span className="font-medium">{prompt.name}</span>
            
            <span className="text-xs text-white-foreground truncate w-full">
              {prompt.description || "No description"}
            </span>
          </Button>
        ))
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {isConnected
            ? "No prompts available or feature not supported."
            : "Not connected."}
        </p>
      )}
    </>
  );
}
