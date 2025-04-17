"use client"; // Keep client-side interactivity

import { Tool, Prompt, Resource } from "@modelcontextprotocol/sdk/types.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToolsSidebar } from "@/components/sidebar/tools-sidebar";
import { PromptsSidebar } from "@/components/sidebar/prompts-sidebar";
import { ResourcesSidebar } from "./resources-sidebar";

type ActiveSection = "Tools" | "Prompts" | "Resources";

interface SidebarProps {
  activeSection: ActiveSection;
  availableTools: Tool[];
  selectedTool: Tool | null;
  onSelectTool: (tool: Tool) => void;
  
  
  availablePrompts: Prompt[];
  selectedPrompt: Prompt | null;
  onSelectPrompt: (prompt: Prompt) => void;

  availableResources: Resource[];
  selectedResources: Resource | null;
  onSelectResources: (resource: Resource) => void;
  
  isConnected: boolean;
}

export function Sidebar({
  isConnected,
  activeSection,

  availableTools,
  selectedTool,
  onSelectTool,

  availablePrompts,
  selectedPrompt,
  onSelectPrompt,

  availableResources,
  selectedResources,
  onSelectResources,

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

          {activeSection === "Resources" && (
            <ResourcesSidebar
              availableResources={availableResources}
              selectedResources={selectedResources}
              isConnected={isConnected}
              onSelectResources={onSelectResources}
            />
          )}

          
        </div>
      </ScrollArea>
    </div>
  );
}
