"use client"; // Keep client-side interactivity for buttons

import { Resource } from "@modelcontextprotocol/sdk/types.js";
import { Button } from "@/components/ui/button";



interface ResourcesSidebarProps {
  availableResources: Resource[];
  selectedResources: Resource | null;
  isConnected: boolean;
  onSelectResources: (resource: Resource) => void;
}

export function ResourcesSidebar({
  availableResources,
  selectedResources,
  isConnected,
  onSelectResources,
}: ResourcesSidebarProps) {
  return (
    <>
      {availableResources.length > 0 ? (
        availableResources.map((resource) => (
          <Button
            key={resource.name}
            variant={
              selectedResources?.name === resource.name ? "default" : "outline" // Use default for selected
            }
            onClick={() => onSelectResources(resource)}
            className="w-full justify-start text-left h-auto py-2 flex flex-col items-start" // Allow multi-line
            disabled={!isConnected}
          >
            <span className="font-medium">{resource.name}</span>
            
            <span className="text-xs text-white-foreground truncate w-full">
              {resource.description || "No description"}
            </span>
          </Button>
        ))
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {isConnected
            ? "No resources available or feature not supported."
            : "Not connected."}
        </p>
      )}
    </>
  );
}
