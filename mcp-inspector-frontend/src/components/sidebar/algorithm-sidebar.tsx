"use client"; // Keep client-side interactivity for buttons

import { Algorithm } from "@/app/model/algorithm";
import { Button } from "@/components/ui/button";

interface AlgorithmSidebarProps {
  availableAlgorithms: Algorithm[];
  selectedAlgorithm: Algorithm | null;
  isConnected: boolean;
  onSelectedAlgorithm: (algorithm: Algorithm) => void;
}

export function AlgorithmsSidebar({
  availableAlgorithms,
  selectedAlgorithm,
  isConnected,
  onSelectedAlgorithm,
}: AlgorithmSidebarProps) {
  return (
    <>
      {availableAlgorithms.length > 0 ? (
        availableAlgorithms.map((algorithm) => (
          <Button
            key={algorithm.name}
            variant={
              selectedAlgorithm?.name === algorithm.name ? "default" : "outline" // Use default for selected
            }
            onClick={() => onSelectedAlgorithm(algorithm)}
            className="w-full justify-start text-left h-auto py-2 flex flex-col items-start" // Allow multi-line
            disabled={!isConnected}
          >
            <span className="font-medium">{algorithm.name}</span>
            
            <span className="text-xs text-white-foreground truncate w-full">
              {algorithm.description || "No description"}
            </span>
          </Button>
        ))
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {isConnected
            ? "No Algorithms available or feature not supported."
            : "Not connected."}
        </p>
      )}
    </>
  );
}
