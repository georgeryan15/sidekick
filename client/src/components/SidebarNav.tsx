import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Avatar, Dropdown, Label, ListBox, Separator, Spinner } from "@heroui/react";
import type { Selection } from "@heroui/react";
import {
  ArrowRightFromSquare,
  Gear,
  Persons,
  House,
  FaceRobot,
  Sparkles,
  Plus,
} from "@gravity-ui/icons";
import { useAuth } from "../context/AuthContext";
import { useConversationContext } from "../context/ConversationContext";

const menuItems = [
  { id: "home", label: "Home", path: "/", icon: House },
  { id: "agents", label: "Agents", path: "/agents", icon: FaceRobot },
  { id: "skills", label: "Skills", path: "/skills", icon: Sparkles },
  { id: "settings", label: "Settings", path: "/settings", icon: Gear },
];

function SidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams();
  const { user, signOut } = useAuth();
  const { conversations, isLoading } = useConversationContext();

  const fullName = user?.user_metadata?.full_name ?? "User";
  const email = user?.email ?? "";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const currentItem =
    menuItems.find((item) => item.path === location.pathname) ?? null;

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const selected = [...keys][0] as string;
    const item = menuItems.find((m) => m.id === selected);
    if (item) navigate(item.path);
  };

  return (
    <div className="w-[220px] shrink-0 rounded-2xl shadow-surface p-2 flex flex-col bg-white">
      {/* Navigation menu items */}
      <nav>
        <ListBox
          aria-label="Navigation"
          selectionMode="single"
          selectedKeys={currentItem ? new Set([currentItem.id]) : new Set()}
          onSelectionChange={handleSelectionChange}
          disallowEmptySelection={false}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <ListBox.Item
                key={item.id}
                id={item.id}
                textValue={item.label}
                className={`w-full rounded-full px-3 py-1 font-normal text-sm ${
                  currentItem?.id === item.id
                    ? "bg-neutral-100 text-accent"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`size-4 ${currentItem?.id === item.id ? "text-accent" : "text-neutral-500"}`} />
                  <Label className={`font-normal text-sm ${currentItem?.id === item.id ? "text-accent" : ""}`}>{item.label}</Label>
                </div>
              </ListBox.Item>
            );
          })}
        </ListBox>
      </nav>

      {/* Recents section */}
      <div className="mt-4 mb-1 px-3">
        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
          Recents
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && conversations.length === 0 && (
          <div className="flex justify-center py-3">
            <Spinner size="sm" />
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/c/${conv.id}`)}
              className={`w-full text-left rounded-full px-3 py-1 text-sm truncate transition-colors ${
                conversationId === conv.id
                  ? "bg-neutral-100 font-medium"
                  : "hover:bg-neutral-50 text-neutral-600"
              }`}
            >
              {conv.title}
            </button>
          ))}
        </div>
      </div>

      {/* New chat button */}
      <div className="px-1 pt-1">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-2 rounded-full px-3 py-1 text-sm text-neutral-500 hover:bg-neutral-50 transition-colors"
        >
          <Plus className="size-3.5" />
          New Chat
        </button>
      </div>

      <Separator className="my-2" />

      {/* User avatar and dropdown */}
      <div>
        <Dropdown>
          <Dropdown.Trigger className="w-full rounded-xl">
            <div className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-neutral-50 transition-colors">
              <Avatar size="sm">
                <Avatar.Fallback>{initials}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0 flex flex-col">
                <p className="truncate text-sm leading-5 font-medium">
                  {fullName}
                </p>
              </div>
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col gap-0">
                  <p className="text-sm leading-5 font-medium">{fullName}</p>
                  <p className="text-xs leading-none text-muted">{email}</p>
                </div>
              </div>
            </div>
            <Dropdown.Menu>
              <Dropdown.Item id="dashboard" textValue="Dashboard">
                <Label>Dashboard</Label>
              </Dropdown.Item>
              <Dropdown.Item id="profile" textValue="Profile">
                <Label>Profile</Label>
              </Dropdown.Item>
              <Dropdown.Item id="settings" textValue="Settings">
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>Settings</Label>
                  <Gear className="size-3.5 text-muted" />
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="new-project" textValue="New project">
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>Create Team</Label>
                  <Persons className="size-3.5 text-muted" />
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                id="logout"
                textValue="Logout"
                variant="danger"
                onAction={signOut}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>Log Out</Label>
                  <ArrowRightFromSquare className="size-3.5 text-danger" />
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </div>
  );
}

export default SidebarNav;
