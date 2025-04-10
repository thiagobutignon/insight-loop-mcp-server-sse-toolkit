"use client"; // Keep client-side interactivity

import { Tool, Prompt } from "@modelcontextprotocol/sdk/types.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToolsSidebar } from "@/components/tools-sidebar";
import { PromptsSidebar } from "@/components/prompts-sidebar";

type ActiveSection = "Tools" | "Prompts";

interface SidebarProps {
  activeSection: ActiveSection;
  availableTools: Tool[];
  selectedTool: Tool | null;
  isConnected: boolean;
  onSelectTool: (tool: Tool) => void;
  availablePrompts: Prompt[];
  selectedPrompt: Prompt | null;
  onSelectPrompt: (prompt: Prompt) => void;
}

export function Sidebar({
  activeSection,
  availableTools,
  selectedTool,
  isConnected,
  onSelectTool,
  availablePrompts,
  selectedPrompt,
  onSelectPrompt,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full border-r p-4">
      <h2 className="text-lg font-semibold mb-4">{activeSection}</h2>
      <ScrollArea className="flex-1 -mx-4">
        <div className="px-4 space-y-2">
          {/* Dynamic Content Based on Active Section */}
          {activeSection === "Tools" && (
            <ToolsSidebar
              availableTools={availableTools}
              selectedTool={selectedTool}
              isConnected={isConnected}
              onSelectTool={onSelectTool}
            />
          )}

          {activeSection === "Prompts" && (
            <PromptsSidebar
              availablePrompts={availablePrompts}
              selectedPrompt={selectedPrompt}
              isConnected={isConnected}
              onSelectPrompt={onSelectPrompt}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
