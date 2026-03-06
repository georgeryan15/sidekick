import { useState, useMemo, useRef, useEffect } from "react";
import {
  Button,
  InputGroup,
  Kbd,
  Spinner,
  TextField,
  Tooltip,
  Select,
  ListBox,
} from "@heroui/react";
import {
  ArrowUp,
  Microphone,
  Plus,
} from "@gravity-ui/icons";

const SLASH_COMMANDS = [
  { id: "skills", label: "/skills", description: "Displays the agent's skills" },
  { id: "help", label: "/help", description: "Show available commands" },
  { id: "clear", label: "/clear", description: "Clear the conversation" },
  { id: "settings", label: "/settings", description: "Open settings" },
  { id: "export", label: "/export", description: "Export conversation" },
  { id: "model", label: "/model", description: "Switch the active model" },
  { id: "history", label: "/history", description: "Browse conversation history" },
  { id: "reset", label: "/reset", description: "Reset the current session" },
  { id: "feedback", label: "/feedback", description: "Send feedback to the team" },
  { id: "shortcuts", label: "/shortcuts", description: "View keyboard shortcuts" },
  { id: "theme", label: "/theme", description: "Toggle light or dark theme" },
  { id: "voice", label: "/voice", description: "Start voice input mode" },
  { id: "attach", label: "/attach", description: "Attach a file to the message" },
  { id: "search", label: "/search", description: "Search past conversations" },
  { id: "plugins", label: "/plugins", description: "Manage installed plugins" },
];

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className?: string;
}

export default function ChatInput({
  input,
  setInput,
  isLoading,
  onSend,
  onKeyDown,
  className,
}: ChatInputProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const showSlashMenu = input.startsWith("/") && input.indexOf(" ") === -1;

  const filteredCommands = useMemo(() => {
    if (!showSlashMenu) return [];
    const query = input.slice(1).toLowerCase();
    return SLASH_COMMANDS.filter((cmd) => cmd.id.startsWith(query));
  }, [input, showSlashMenu]);

  const menuVisible = showSlashMenu && filteredCommands.length > 0;

  // Scroll selected item into view
  useEffect(() => {
    if (menuVisible && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, menuVisible]);

  const handleInternalKeyDown = (e: React.KeyboardEvent) => {
    if (menuVisible) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          setInput(cmd.label + " ");
          setSelectedIndex(0);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setInput("");
        setSelectedIndex(0);
        return;
      }
    }
    onKeyDown(e);
  };

  // Reset selected index when filtered list changes
  const prevLengthRef = filteredCommands.length;
  if (selectedIndex >= prevLengthRef && prevLengthRef > 0) {
    setSelectedIndex(0);
  }

  return (
    <div className={`relative ${className ?? ""}`}>
    {menuVisible && (
      <div
        ref={menuRef}
        className="absolute bottom-full left-0 right-0 mb-2 max-h-[210px] overflow-y-auto rounded-xl border border-border bg-surface shadow-lg z-50"
      >
        {filteredCommands.map((cmd, i) => (
          <div
            key={cmd.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
              i === selectedIndex ? "bg-default" : "hover:bg-default/50"
            }`}
            onMouseEnter={() => setSelectedIndex(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              setInput(cmd.label + " ");
              setSelectedIndex(0);
            }}
          >
            <span className="text-sm font-medium text-foreground">{cmd.label}</span>
            <span className="text-xs text-muted">{cmd.description}</span>
          </div>
        ))}
      </div>
    )}
    <TextField
      fullWidth
      aria-label="Prompt input"
      className="flex w-full flex-col"
      name="prompt"
    >
      <InputGroup fullWidth className="flex flex-col gap-2 rounded-2xl border border-border py-2">
<InputGroup.TextArea
          className="w-full resize-none px-3.5 py-0"
          placeholder="Type a message..."
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInternalKeyDown}
        />
        <InputGroup.Suffix className="flex w-full items-center gap-1.5 px-3 py-0">
          <Tooltip delay={0}>
            <Button
              isIconOnly
              aria-label="Attach file"
              size="sm"
              variant="tertiary"
            >
              <Plus />
            </Button>
            <Tooltip.Content>
              <p className="text-xs">Add files and more</p>
            </Tooltip.Content>
          </Tooltip>
          <Select placeholder="GPT-5.2">
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="florida" textValue="Florida">
                  GPT-5.2
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="delaware" textValue="Delaware">
                  Opus 4.6
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="california" textValue="California">
                  Sonnet 4.6
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="texas" textValue="Texas">
                  Gemini 3 Pro
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
          <div className="ml-auto flex items-center gap-1.5">
            <Tooltip delay={0}>
              <Button
                isIconOnly
                aria-label="Voice input"
                size="sm"
                variant="ghost"
              >
                <Microphone />
              </Button>
              <Tooltip.Content>
                <p className="text-xs">Voice input</p>
              </Tooltip.Content>
            </Tooltip>
            <Tooltip delay={0}>
              <Button
                isIconOnly
                aria-label="Send prompt"
                isDisabled={!input.trim() || isLoading}
                isPending={isLoading}
                onPress={onSend}
              >
                {({ isPending }) =>
                  isPending ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <ArrowUp />
                  )
                }
              </Button>
              <Tooltip.Content className="flex items-center gap-1">
                <p className="text-xs">Send</p>
                <Kbd className="h-4 rounded-sm px-1">
                  <Kbd.Abbr keyValue="enter" />
                </Kbd>
              </Tooltip.Content>
            </Tooltip>
          </div>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
    </div>
  );
}
