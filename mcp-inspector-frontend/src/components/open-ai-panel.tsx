import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// OpenAI API types
interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: {
    message: OpenAIMessage;
    finish_reason: string;
  }[];
}

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const envModel = process.env.NEXT_PUBLIC_GEMINI_MODEL;
const urlCompatibleOpenAI = process.env.NEXT_PUBLIC_OPEN_AI_COMPATIBLE;

export function OpenAIPanel({
  addMessage,
}: {
  addMessage: (message: string) => void;
}) {
  const [model, setModel] = useState<string>(envModel || "");
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [userMessage, setUserMessage] = useState<string>("");
  const [openaiMessages, setOpenaiMessages] = useState<OpenAIMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Send message to OpenAI
  const handleSendToOpenAI = async () => {
    if (!apiKey) {
      addMessage("❌ LLM API key is required");
      return;
    }
    if (!urlCompatibleOpenAI) {
      addMessage("❌ OpenAI Compatible URL is required");
      return;
    }

    if (!envModel) {
      addMessage("❌ LLM Model is required");
      return;
    }

    if (!userMessage.trim()) {
      addMessage("❌ Message cannot be empty");
      return;
    }

    setIsLoading(true);
    addMessage(`⏳ Sending message to LLM (${model})...`);

    try {
      // Build messages array
      const messages: OpenAIMessage[] = [];

      // Add system prompt if provided
      if (systemPrompt.trim()) {
        messages.push({ role: "system", content: systemPrompt });
      }

      // Add conversation history
      messages.push(...openaiMessages);

      // Add current user message
      messages.push({ role: "user", content: userMessage });

      // Call OpenAI API
      const response = await fetch(urlCompatibleOpenAI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API returned status ${response.status}`
        );
      }

      const data = (await response.json()) as OpenAIResponse;
      const assistantResponse =
        data.choices[0]?.message?.content || "No response received";

      // Update conversation history
      setOpenaiMessages([
        ...messages,
        { role: "assistant", content: assistantResponse },
      ]);

      // Clear user message input
      setUserMessage("");

      // Log success message
      addMessage(
        `✅ OpenAI response received: ${assistantResponse.slice(0, 100)}${
          assistantResponse.length > 100 ? "..." : ""
        }`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addMessage(`❌ OpenAI API Error: ${errorMessage}`);
      console.error("OpenAI API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4-turbo"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="system-prompt">System Prompt</Label>
        <Textarea
          id="system-prompt"
          placeholder="Optional: Add system instructions here..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={2}
          className="mt-2"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="user-message">Your Message</Label>
        <Textarea
          id="user-message"
          placeholder="Type your message here..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          rows={3}
        />
        <Button
          onClick={handleSendToOpenAI}
          disabled={isLoading || !userMessage.trim()}
          className="mt-2"
        >
          {isLoading ? "Sending..." : "Send to OpenAI"}
        </Button>
      </div>
    </div>
  );
}
