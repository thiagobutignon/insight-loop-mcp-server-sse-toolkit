"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface LogAreaProps {
  messages: string[];
}

export function LogArea({ messages }: LogAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      <Label htmlFor="messages" className="mb-2 font-semibold">
        Connection & Activity Log
      </Label>
      <ScrollArea className="flex-1 rounded-md border p-2 bg-muted/30">
        {" "}
        {/* Slightly different background */}
        <pre className="text-xs whitespace-pre-wrap break-words px-2">
          {messages.join("\n")}
        </pre>
        <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
      </ScrollArea>
    </div>
  );
}
