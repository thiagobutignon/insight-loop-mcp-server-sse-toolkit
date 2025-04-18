import { ConnectionStatus } from "@/components/connection-status";
import { Button } from "@/components/ui/button";

export type Section =  "Tools" | "Prompts" | "Resources" | "Algorithms";

type Props = {
  isConnected: boolean;
  activeSection: Section
  setActiveSection: (section: Section) => void;
  availablePromptsLength: number;
  availableToolsLength: number;
  availableResourcesLength: number
  availableAlgorithmsLength: number;
  resetSelections: () => void;
};

export function Header({
  isConnected,
  activeSection,
  setActiveSection,
  availablePromptsLength,
  availableToolsLength,
  availableResourcesLength,
  availableAlgorithmsLength,
  resetSelections,
}: Props) {
  const handleSelectItem = (section: Section): void => {
    setActiveSection(section);
    resetSelections();
  } 

  const setVariant = (section: Section) => {
    return activeSection === section ? "secondary" : "ghost"
  }

  const setDisable = (length: number): boolean => {
    return  length === 0 && !isConnected
  } 

  return (
    <header className="flex h-16 items-center border-b px-4 md:px-6 shrink-0">
      <nav className="flex-1 flex items-center gap-4 sm:gap-6 text-sm font-medium">
        <Button
          variant={setVariant("Tools")}
          size="sm"
          onClick={() => {
            handleSelectItem("Tools")
          }}
          disabled={setDisable(availableToolsLength)}
        >
          Tools
        </Button>
        <Button
          variant={setVariant("Prompts")}
          size="sm"
          onClick={() => {
            handleSelectItem("Prompts")
          }}
          disabled={setDisable(availablePromptsLength)} // Disable if no prompts *and* not connected
        >
          Prompts
        </Button>

        <Button 
          variant={setVariant("Resources")} 
          size="sm"
          onClick={() => {
            handleSelectItem("Resources")
          }}
          disabled={setDisable(availableResourcesLength)}
        >
          Resources
        </Button>
        <Button 
          variant={setVariant("Algorithms")} 
          size="sm"
          onClick={() => {
            handleSelectItem("Algorithms")
          }}
          disabled={setDisable(availableAlgorithmsLength)}
        >
          Algorithms
        </Button>
        <Button variant="ghost" size="sm" disabled>
          Sampling
        </Button>
        <Button variant="ghost" size="sm" disabled>
          Roots
        </Button>
        <Button variant="ghost" size="sm">
          Chat with AI
        </Button>

        {/* Add other top-right elements if needed */}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <ConnectionStatus isConnected={isConnected} />
        {/* Add other top-right elements if needed */}
      </div>
    </header>
  );
}
