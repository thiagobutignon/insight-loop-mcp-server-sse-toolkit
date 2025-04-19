"use client"; // Keep client-side interactivity for buttons

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Button } from "@/components/ui/button";

interface ToolsSidebarProps {
  availableTools: Tool[];
  selectedTool: Tool | null;
  isConnected: boolean;
  onSelectTool: (tool: Tool) => void;
}

export function ToolsSidebar({
  availableTools,
  selectedTool,
  isConnected,
  onSelectTool,
}: ToolsSidebarProps) {
  return (
    <>
      {availableTools.length > 0 ? (
        availableTools.map((tool) => (
          <Button
            key={tool.name}
            variant={
              selectedTool?.name === tool.name ? "default" : "outline" // Use default for selected
            }
            onClick={() => onSelectTool(tool)}
            className="w-full justify-start text-left h-auto py-2 flex flex-col items-start" // Allow multi-line
            disabled={!isConnected}
          >
            <span className="font-medium">{tool.name}</span>
            <span className="text-xs text-white-foreground truncate w-full text-wrap">
              {tool.description || "No description"}
            </span>
          </Button>
        ))
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {isConnected ? "No tools available." : "Not connected."}
        </p>
      )}
    </>
  );
}
