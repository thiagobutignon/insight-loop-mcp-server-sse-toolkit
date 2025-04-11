/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ParameterInfo } from "@/app/model/parameter-info";
import { Send, AlertCircle } from "lucide-react";
import { getParametersFromPrompt } from "@/app/mcp/get-parameters-from-prompt";
import { useRateLimit } from "@/hooks/use-rate-limit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIFormProps {
  mcpClient: Client | null;
  selectedPrompt: Prompt | null;
  isConnected: boolean;
  addMessage: (message: string) => void;
}

export function AIForm({
  mcpClient,
  selectedPrompt,
  isConnected,
  addMessage,
}: AIFormProps) {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    canMakeRequest,
    remainingRequests,
    resetTime,
    incrementRequestCount,
  } = useRateLimit();

  useEffect(() => {
    // Reset inputs when prompt changes
    setInputs({});
    setAiResponse(null);
    setErrorMessage(null);
  }, [selectedPrompt]);

  if (!mcpClient || !isConnected || !selectedPrompt) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Form</CardTitle>
          <CardDescription>
            Connect to MCP client and select a prompt to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <div className="flex flex-col items-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-2 text-muted-foreground" />
            <p>Select a Prompt from the sidebar to view the AI form.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const parameters = getParametersFromPrompt(selectedPrompt);

  const handleInputChange = (paramName: string, value: any) => {
    setInputs((prev) => {
      const param = parameters.find((p) => p.name === paramName);
      const parsedValue = param?.type === "boolean" ? Boolean(value) : value;
      return {
        ...prev,
        [paramName]: parsedValue,
      };
    });
  };

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

  const handleSubmit = async () => {
    console.log("------ selectedPrompt", selectedPrompt);

    if (!mcpClient || !isConnected || !selectedPrompt || !canMakeRequest) {
      if (!canMakeRequest) {
        setErrorMessage(
          `Rate limit reached. Next request available at ${new Date(
            resetTime
          ).toLocaleTimeString()}`
        );
      } else {
        setErrorMessage("Not connected or no prompt selected.");
      }
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAiResponse(null);

    try {
      const args: Record<string, any> = {};
      let hasRequiredMissing = false;

      if (parameters.length > 0) {
        parameters.forEach((param) => {
          const value = inputs[param.name];

          if (
            param.required &&
            (value === undefined || value === null || value === "")
          ) {
            setErrorMessage(`Missing required parameter: ${param.name}`);
            hasRequiredMissing = true;
          }

          if (value !== undefined && value !== null) {
            args[param.name] = value;
          }
        });
      }

      if (hasRequiredMissing) {
        setIsLoading(false);
        return;
      }

      addMessage(
        `⏳ Calling Gemini AI with prompt: "${selectedPrompt.name}"...`
      );

      // First, get the compiled prompt from MCP
      const promptResult = await mcpClient.getPrompt({
        name: selectedPrompt.name,
        arguments: Object.keys(args).length > 0 ? args : undefined,
      });

      addMessage(
        `👽 Prompt Result: "${JSON.stringify(
          promptResult.messages[0].content.text
        )}"...`
      );

      if (promptResult.isError) {
        throw new Error(
          `Failed to get prompt: ${JSON.stringify(promptResult.content)}`
        );
      }

      const promptText = promptResult.messages[0].content.text;

      // Now call the Gemini API using the prompt
      const response = await fetch(
        process.env.NEXT_PUBLIC_OPEN_AI_COMPATIBLE || "",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.0-flash",
            messages: [{ role: "user", content: promptText }],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Increment the rate limit counter
      incrementRequestCount();

      // Extract the AI response
      const aiResponseText =
        data.choices?.[0]?.message?.content || "No response content";
      setAiResponse(aiResponseText);
      addMessage(`✅ Received AI response for "${selectedPrompt.name}"`);
      addMessage(`🤖 AI Response: ${data.choices?.[0]?.message?.content}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setErrorMessage(`Error: ${errorMessage}`);
      addMessage(
        `❌ Error calling AI with prompt "${selectedPrompt.name}": ${errorMessage}`
      );
      console.error("AI API Call Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI Form - {selectedPrompt.name}</CardTitle>
            <CardDescription>
              Fill in the parameters to generate an AI response
            </CardDescription>
          </div>
          <Badge variant={canMakeRequest ? "outline" : "destructive"}>
            {remainingRequests} requests remaining
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {parameters.length === 0 ? (
            <p className="text-md text-muted-foreground italic">
              No parameters detected for this prompt.
            </p>
          ) : (
            parameters.map((param) => (
              <div key={param.name} className="mb-4">
                <Label
                  htmlFor={`param-${param.name}`}
                  className="text-md font-medium"
                >
                  {param.name}
                  {param.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>

                {param.description && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {param.description}
                  </p>
                )}

                {renderInputField(param)}
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!isConnected || isLoading || !canMakeRequest}
          className="flex items-center"
        >
          {isLoading ? "Processing..." : "Generate AI Response"}{" "}
          <Send className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
