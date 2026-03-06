import { Button } from "@heroui/react";
import {
  Bars,
  Bookmark,
  LayoutColumns3,
  Ellipsis,
  Xmark,
} from "@gravity-ui/icons";

interface ChatTopBarProps {
  onSplitPane: () => void;
  onClosePane: () => void;
  paneCount: number;
}

export default function ChatTopBar({
  onSplitPane,
  onClosePane,
  paneCount,
}: ChatTopBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 shrink-0">
      <div className="flex items-center gap-1">
        <Button isIconOnly size="sm" variant="light">
          <Bars className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button isIconOnly size="sm" variant="light">
          <Bookmark className="w-4 h-4" />
        </Button>
        <Button isIconOnly size="sm" variant="light" onPress={onSplitPane}>
          <LayoutColumns3 className="w-4 h-4" />
        </Button>
        {paneCount > 1 ? (
          <Button isIconOnly size="sm" variant="light" onPress={onClosePane}>
            <Xmark className="w-4 h-4" />
          </Button>
        ) : (
          <Button isIconOnly size="sm" variant="light">
            <Ellipsis className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
