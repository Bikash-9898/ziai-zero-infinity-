"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  Code2,
  Palette,
  Layers,
  Rocket,
} from "lucide-react";

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export default function RuixenMoonChat() {
  const [message, setMessage] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  return (
    <div
      className="relative flex h-screen w-full flex-col items-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://cdn.21st.dev/assets/mirror/c3/c333918af688a4a8a3d004652e6c0ee219457a9d84d380eeb31f513d4b59a09f.png')",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white drop-shadow-sm">Ruixen AI</h1>
          <p className="mt-2 text-neutral-200">Build something amazing — just start typing below.</p>
        </div>
      </div>

      <div className="mb-[20vh] w-full max-w-3xl">
        <div className="relative rounded-xl border border-neutral-700 bg-black/60 backdrop-blur-md">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            placeholder="Type your request..."
            className={cn(
              "w-full resize-none border-none px-4 py-3",
              "bg-transparent text-sm text-white",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "min-h-[48px] placeholder:text-neutral-400"
            )}
            style={{ overflow: "hidden" }}
          />

          <div className="flex items-center justify-between p-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-neutral-700">
              <Paperclip className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                disabled
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-2 transition-colors",
                  "cursor-not-allowed bg-neutral-700 text-neutral-400"
                )}
              >
                <ArrowUpIcon className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <QuickAction icon={<Code2 className="h-4 w-4" />} label="Generate Code" />
          <QuickAction icon={<Rocket className="h-4 w-4" />} label="Launch App" />
          <QuickAction icon={<Layers className="h-4 w-4" />} label="UI Components" />
          <QuickAction icon={<Palette className="h-4 w-4" />} label="Theme Ideas" />
          <QuickAction icon={<CircleUserRound className="h-4 w-4" />} label="User Dashboard" />
          <QuickAction icon={<MonitorIcon className="h-4 w-4" />} label="Landing Page" />
          <QuickAction icon={<FileUp className="h-4 w-4" />} label="Upload Docs" />
          <QuickAction icon={<ImageIcon className="h-4 w-4" />} label="Image Assets" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: ReactNode;
  label: string;
}

function QuickAction({ icon, label }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 rounded-full border-neutral-700 bg-black/50 text-neutral-300 hover:bg-neutral-700 hover:text-white"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}