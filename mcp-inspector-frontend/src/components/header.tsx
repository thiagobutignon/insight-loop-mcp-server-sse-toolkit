import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/connection-status";
import { useTheme } from "next-themes";

type Props = {
  isConnected: boolean;
  activeSection: "Tools" | "Prompts";
  setActiveSection: (section: "Tools" | "Prompts") => void;
  availablePromptsLength: number;
  resetSelections: () => void;
};

export function Header({
  isConnected,
  activeSection,
  setActiveSection,
  availablePromptsLength,
  resetSelections,
}: Props) {
  const { setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center border-b px-4 md:px-6 shrink-0">
      <nav className="flex-1 flex items-center gap-4 sm:gap-6 text-sm font-medium">
        <Button
          variant={activeSection === "Tools" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => {
            setActiveSection("Tools");
            resetSelections(); // Reset selection when changing sections
          }}
        >
          Tools
        </Button>
        <Button
          variant={activeSection === "Prompts" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => {
            setActiveSection("Prompts");
            resetSelections();
          }}
          disabled={availablePromptsLength === 0 && !isConnected} // Disable if no prompts *and* not connected
        >
          Prompts
        </Button>

        <Button variant="ghost" size="sm" disabled>
          Resources
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
