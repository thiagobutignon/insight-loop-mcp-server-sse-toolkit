"use client";

import { useEffect, useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface LogAreaProps {
  messages: string[];
}

export function LogArea({ messages }: LogAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col p-4">
      <Label htmlFor="messages" className="mb-2 font-semibold">
        Connection & Activity Log
      </Label>

      {/* Fix: Define max height to enable scroll */}
      <ScrollArea className="max-h-[600px] w-full rounded-md border p-2 bg-muted/30">
        <pre className="text-sm whitespace-pre-wrap break-words px-2">
          {messages.join("\n")}
        </pre>
        <div ref={messagesEndRef} />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
