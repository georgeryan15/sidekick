import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Avatar,
  Button,
  Dropdown,
  Label,
  Separator,
  Spinner,
} from "@heroui/react";
import {
  ArrowRightFromSquare,
  Gear,
  Persons,
  Thunderbolt,
  Sparkles,
  TrashBin,
  Comment,
  Moon,
  Sun,
} from "@gravity-ui/icons";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useConversationContext } from "../../context/ConversationContext";
import ContextMenu from "../shared/ContextMenu";

const navLinks = [
  {
    id: "automations",
    label: "Automations",
    path: "/automations",
    icon: Thunderbolt,
  },
  { id: "skills", label: "Skills", path: "/skills", icon: Sparkles },
  { id: "settings", label: "Settings", path: "/settings", icon: Gear },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { conversations, isLoading, deleteConversation } =
    useConversationContext();

  const fullName = user?.user_metadata?.full_name ?? "User";
  const email = user?.email ?? "";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isNavActive = (path: string) => location.pathname === path;

  return (
    <div className="flex w-[220px] shrink-0 flex-col py-1">
      {/* New thread button */}
      <div className="px-1">
        <Button className="w-full rounded-xl" onPress={() => navigate("/")}>
          New thread
        </Button>
      </div>

      {/* Nav links */}
      <nav className="mt-3 flex flex-col gap-0.5 px-1">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-default text-accent font-medium"
                  : "text-muted hover:bg-default/60 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Threads section */}
      <div className="mt-3 px-3.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Threads
        </span>
      </div>

      <div className="mt-1 flex-1 overflow-y-auto px-1 min-h-0">
        {isLoading && conversations.length === 0 && (
          <div className="flex justify-center py-3">
            <Spinner size="sm" />
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {conversations.map((conv) => (
            <ContextMenu
              key={conv.id}
              context={conv.id}
              items={[
                {
                  id: "delete",
                  label: "Delete",
                  variant: "danger",
                  icon: <TrashBin className="size-4 shrink-0 text-danger" />,
                },
              ]}
              onAction={(_key, convId) => {
                const id = convId as string;
                if (conversationId === id) {
                  navigate("/");
                }
                deleteConversation(id);
              }}
            >
              <button
                onClick={() => navigate(`/c/${conv.id}`)}
                className={`w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                  conversationId === conv.id
                    ? "bg-default text-accent font-medium"
                    : "text-muted hover:bg-default/60 hover:text-foreground"
                }`}
              >
                {conv.title}
              </button>
            </ContextMenu>
          ))}
        </div>
      </div>

      {/* Test overlay button */}
      <div className="px-1 pt-1">
        <Button
          className="w-full rounded-full"
          variant="secondary"
          onPress={() => window.electronAPI?.toggleOverlay()}
        >
          Test Feature
        </Button>
      </div>

      <Separator className="my-2" />

      {/* User dropdown */}
      <div className="px-1">
        <Dropdown>
          <Dropdown.Trigger className="w-full rounded-xl">
            <div className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-default/60">
              <Avatar size="sm">
                <Avatar.Fallback>{initials}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0 flex flex-col">
                <p className="truncate text-sm font-medium leading-5 text-foreground">
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
                  <p className="text-sm font-medium leading-5">{fullName}</p>
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
                id="theme"
                textValue="Toggle theme"
                onAction={toggleTheme}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>{theme === "light" ? "Dark Mode" : "Light Mode"}</Label>
                  {theme === "light" ? (
                    <Moon className="size-3.5 text-muted" />
                  ) : (
                    <Sun className="size-3.5 text-muted" />
                  )}
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
