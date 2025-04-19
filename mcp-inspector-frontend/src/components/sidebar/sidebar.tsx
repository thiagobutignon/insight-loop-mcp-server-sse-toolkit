"use client"; // Keep client-side interactivity

import { Algorithm } from "@/app/model/algorithm";
import { PromptsSidebar } from "@/components/sidebar/prompts-sidebar";
import { ToolsSidebar } from "@/components/sidebar/tools-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Prompt, Resource, Tool } from "@modelcontextprotocol/sdk/types.js";
import { Section } from "../header";
import { AlgorithmsSidebar } from "./algorithm-sidebar";
import { ResourcesSidebar } from "./resources-sidebar";

interface SidebarProps {
  activeSection: Section;
  availableTools: Tool[];
  selectedTool: Tool | null;
  onSelectTool: (tool: Tool) => void;
  
  
  availablePrompts: Prompt[];
  selectedPrompt: Prompt | null;
  onSelectPrompt: (prompt: Prompt) => void;

  availableResources: Resource[];
  selectedResources: Resource | null;
  onSelectResources: (resource: Resource) => void;

  availableAlgorithms: Algorithm[];
  selectedAlgorithms: Algorithm | null;
  onSelectAlgorithms: (algorithm: Algorithm) => void;
  
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

  availableAlgorithms,
  selectedAlgorithms,
  onSelectAlgorithms

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

        {activeSection === "Algorithms" && (
            <AlgorithmsSidebar
              availableAlgorithms={availableAlgorithms}
              selectedAlgorithm={selectedAlgorithms}
              isConnected={isConnected}
              onSelectedAlgorithm={onSelectAlgorithms}
            />
          )}  

          
        </div>
      </ScrollArea>
    </div>
  );
}
