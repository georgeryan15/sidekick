import {
  useState,
  useCallback,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { Dropdown, Label } from "@heroui/react";
import type { Key } from "@heroui/react";

export interface ContextMenuItem {
  id: string;
  label: string;
  variant?: "default" | "danger";
  icon?: ReactNode;
}

export interface ContextMenuSection {
  header?: string;
  items: ContextMenuItem[];
}

interface ContextMenuProps {
  /** Menu items — flat list or grouped into sections */
  items: ContextMenuItem[] | ContextMenuSection[];
  /** Called when a menu item is selected, with the item id and optional context data */
  onAction: (key: Key, context?: unknown) => void;
  /** Optional data to identify what was right-clicked (passed back through onAction) */
  context?: unknown;
  /** A single React element that can be right-clicked */
  children: ReactElement;
}

function isSections(
  items: ContextMenuItem[] | ContextMenuSection[]
): items is ContextMenuSection[] {
  return items.length > 0 && "items" in items[0];
}

function ContextMenu({ items, onAction, context, children }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  }, []);

  const handleAction = useCallback(
    (key: Key) => {
      onAction(key, context);
      setIsOpen(false);
    },
    [onAction, context]
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setIsOpen(false);
  }, []);

  const renderItems = (menuItems: ContextMenuItem[]) =>
    menuItems.map((item) => (
      <Dropdown.Item
        key={item.id}
        id={item.id}
        textValue={item.label}
        variant={item.variant}
      >
        {item.icon}
        <Label>{item.label}</Label>
      </Dropdown.Item>
    ));

  // Attach onContextMenu directly to the child — no wrapper div
  const child = isValidElement(children)
    ? cloneElement(children, {
        onContextMenu: handleContextMenu,
      } as Record<string, unknown>)
    : children;

  return (
    <>
      {child}

      {/* Only mount when open so the trigger position is correct at render time */}
      {isOpen &&
        createPortal(
          <Dropdown defaultOpen onOpenChange={handleOpenChange}>
            <Dropdown.Trigger
              aria-hidden
              tabIndex={-1}
              style={{
                position: "fixed",
                left: position.x,
                top: position.y,
                width: 1,
                height: 1,
                padding: 0,
                border: "none",
                opacity: 0,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            />
            <Dropdown.Popover placement="bottom start">
              <Dropdown.Menu onAction={handleAction}>
                {isSections(items)
                  ? items.map((section, i) => (
                      <Dropdown.Section key={section.header ?? i}>
                        {section.header && (
                          <div className="px-2 py-1 text-xs font-medium text-muted">
                            {section.header}
                          </div>
                        )}
                        {renderItems(section.items)}
                      </Dropdown.Section>
                    ))
                  : renderItems(items)}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>,
          document.body
        )}
    </>
  );
}

export default ContextMenu;
