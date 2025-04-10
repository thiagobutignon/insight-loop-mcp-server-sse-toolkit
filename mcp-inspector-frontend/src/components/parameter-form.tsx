"use client";
import { Tool, Prompt } from "@modelcontextprotocol/sdk/types.js";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ParameterInfo } from "@/app/model/parameter-info";
import { Send } from "lucide-react";

interface ParameterFormProps {
  item: Tool | Prompt | null;
  getParameters: (
    item: Tool | Prompt | null,
    itemType: "Tool" | "Prompt"
  ) => ParameterInfo[];
  inputs: Record<string, string | number | boolean | undefined>;
  handleInputChange: (
    paramName: string,
    value: string | number | boolean | undefined
  ) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isConnected: boolean;
  itemType: "Tool" | "Prompt";
}

export function ParameterForm({
  item,
  getParameters,
  inputs,
  handleInputChange,
  onSubmit,
  isLoading,
  isConnected,
  itemType,
}: ParameterFormProps) {
  if (!item) {
    return null;
  }

  const parameters = getParameters(item, itemType);

  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold mb-2">
        Parameters for {itemType}:{" "}
        <span className="font-bold">{item.name}</span>
      </h3>
      {parameters.length === 0 && (
        <p className="text-md text-muted-foreground italic">
          This {itemType.toLowerCase()} requires no parameters.
        </p>
      )}
      {parameters.map((param) => (
        <div key={param.name}>
          <Label htmlFor={`param-${param.name}`} className="text-md font-light">
            {param.name}
            {param.description && (
              <span className="ml-1 text-muted-foreground text-sm">
                ({param.description})
              </span>
            )}
            {param.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {/* Input Types */}
          {param.type === "boolean" ? (
            <div className="flex items-center space-x-2 mt-1">
              {/* Create a separate variable for the boolean value */}
              {(() => {
                const isChecked = inputs[param.name] === true;
                return (
                  <>
                    <Input
                      id={`param-${param.name}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        handleInputChange(param.name, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                    />
                    <label
                      htmlFor={`param-${param.name}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      {isChecked ? "True" : "False"}
                    </label>
                  </>
                );
              })()}
            </div>
          ) : param.type === "string" &&
            param.minLength &&
            param.minLength > 100 ? (
            <Textarea
              id={`param-${param.name}`}
              value={inputs[param.name] || ""}
              onChange={(e) => handleInputChange(param.name, e.target.value)}
              placeholder={`Enter ${param.name} (min ${param.minLength} chars)`}
              className="mt-1 min-h-[80px]"
              required={param.required}
            />
          ) : (
            <Input
              id={`param-${param.name}`}
              type={param.type === "number" ? "number" : "text"}
              value={inputs[param.name] || ""}
              onChange={(e) => handleInputChange(param.name, e.target.value)}
              placeholder={`Enter ${param.name} (${param.type})`}
              className="mt-1"
              required={param.required}
              step={param.type === "number" ? "any" : undefined}
            />
          )}
          {param.minLength &&
            !(param.type === "string" && param.minLength > 100) && (
              <p className="text-xs text-muted-foreground mt-1">
                Minimum length: {param.minLength}
              </p>
            )}
        </div>
      ))}
      <div className="mt-4 flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={!isConnected || isLoading}
          size="sm"
        >
          {isLoading ? "Calling..." : `Call ${itemType}`}{" "}
          <Send className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
