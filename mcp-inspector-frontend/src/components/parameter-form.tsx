"use client";
import { Tool, Prompt } from "@modelcontextprotocol/sdk/types.js";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ParameterInfo } from "@/app/model/parameter-info";
import { Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParameterFormProps {
  item: Tool | Prompt | null;
  getParameters: (
    item: Tool | Prompt | null,
    itemType: "Tool" | "Prompt"
  ) => ParameterInfo[];
  inputs: Record<string, any>;
  handleInputChange: (paramName: string, value: any) => void;
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

  // Render the appropriate input based on parameter type
  const renderInputField = (param: ParameterInfo) => {
    // For enum/option type parameters
    if (param.enum && Array.isArray(param.enum)) {
      return (
        <Select
          value={inputs[param.name]?.toString() || ""}
          onValueChange={(value) => handleInputChange(param.name, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${param.name}`} />
          </SelectTrigger>
          <SelectContent>
            {param.enum.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option.toString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Boolean inputs
    if (param.type === "boolean") {
      const isChecked = inputs[param.name] === true;
      return (
        <div className="flex items-center space-x-2 mt-1">
          <Input
            id={`param-${param.name}`}
            type="checkbox"
            checked={isChecked}
            onChange={(e) => handleInputChange(param.name, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
          />
          <label
            htmlFor={`param-${param.name}`}
            className="text-xs text-muted-foreground cursor-pointer"
          >
            {isChecked ? "True" : "False"}
          </label>
        </div>
      );
    }

    // Number inputs
    if (param.type === "number" || param.type === "integer") {
      return (
        <Input
          id={`param-${param.name}`}
          type="number"
          value={inputs[param.name] || ""}
          onChange={(e) => {
            const value = e.target.value === "" ? "" : Number(e.target.value);
            handleInputChange(param.name, value);
          }}
          placeholder={`Enter ${param.name}`}
          className="mt-1"
          required={param.required}
          step={param.type === "integer" ? "1" : "any"}
        />
      );
    }

    // Long text inputs
    if (
      param.type === "string" &&
      (param.minLength > 100 || param.format === "textarea")
    ) {
      return (
        <Textarea
          id={`param-${param.name}`}
          value={inputs[param.name] || ""}
          onChange={(e) => handleInputChange(param.name, e.target.value)}
          placeholder={`Enter ${param.name}`}
          className="mt-1 min-h-[80px]"
          required={param.required}
        />
      );
    }

    // Object or array inputs
    if (param.type === "object" || param.type === "array") {
      let value = "";
      try {
        if (inputs[param.name]) {
          value = JSON.stringify(inputs[param.name], null, 2);
        }
      } catch (e) {
        value = inputs[param.name] || "";
      }

      return (
        <Textarea
          id={`param-${param.name}`}
          value={value}
          onChange={(e) => {
            // Try to parse JSON if possible, otherwise keep as string
            try {
              const parsed = JSON.parse(e.target.value);
              handleInputChange(param.name, parsed);
            } catch {
              handleInputChange(param.name, e.target.value);
            }
          }}
          placeholder={`Enter ${param.name} as JSON`}
          className="mt-1 min-h-[120px] font-mono text-sm"
          required={param.required}
        />
      );
    }

    // Default text input for everything else
    return (
      <Input
        id={`param-${param.name}`}
        type="text"
        value={inputs[param.name] || ""}
        onChange={(e) => handleInputChange(param.name, e.target.value)}
        placeholder={`Enter ${param.name}`}
        className="mt-1"
        required={param.required}
      />
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold mb-2">
        Parameters for {itemType}:{" "}
        <span className="font-bold">{item.name}</span>
      </h3>
      {parameters.length === 0 && (
        <p className="text-md text-muted-foreground italic">
          No parameters detected. Check console logs for schema issues.
        </p>
      )}
      {parameters.map((param) => (
        <div key={param.name} className="mb-4">
          <Label
            htmlFor={`param-${param.name}`}
            className="text-md font-medium"
          >
            {param.name}
            {param.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {param.description && (
            <p className="text-sm text-muted-foreground mb-1">
              {param.description}
            </p>
          )}

          {renderInputField(param)}

          {param.minLength && (
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
          className="flex items-center"
        >
          {isLoading ? "Processing..." : `Call ${itemType}`}{" "}
          <Send className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
