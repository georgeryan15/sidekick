import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, Dropdown, Label, ListBox, Separator } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { ArrowRightFromSquare, Gear, Persons } from "@gravity-ui/icons";

const menuItems = [
  { id: "home", label: "Home", path: "/" },
  { id: "agents", label: "Agents", path: "/agents" },
  { id: "settings", label: "Settings", path: "/settings" },
];

function SidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentItem =
    menuItems.find((item) => item.path === location.pathname) ?? menuItems[0];

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const selected = [...keys][0] as string;
    const item = menuItems.find((m) => m.id === selected);
    if (item) navigate(item.path);
  };

  return (
    <div className="w-[220px] shrink-0 rounded-2xl shadow-surface p-2 flex flex-col bg-white">
      <nav className="flex-1">
        <ListBox
          aria-label="Navigation"
          selectionMode="single"
          selectedKeys={new Set([currentItem.id])}
          onSelectionChange={handleSelectionChange}
          disallowEmptySelection
        >
          {menuItems.map((item) => (
            <ListBox.Item
              key={item.id}
              id={item.id}
              textValue={item.label}
              className={`w-full rounded-md px-3 py-1.5 font-normal ${
                currentItem.id === item.id ? "bg-neutral-100" : ""
              }`}
            >
              <Label className="font-normal">{item.label}</Label>
            </ListBox.Item>
          ))}
        </ListBox>
      </nav>

      <Separator className="mt-2" />

      <div className="pt-2">
        <Dropdown>
          <Dropdown.Trigger className="w-full rounded-xl">
            <div className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-secondary transition-colors">
              <Avatar size="sm">
                <Avatar.Image
                  alt="Oli Luke"
                  src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg"
                />
                <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0 flex flex-col">
                <p className="truncate text-sm leading-5 font-medium">
                  Jane Doe
                </p>
                <p className="truncate text-xs leading-none text-muted">
                  Product Designer
                </p>
              </div>
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <Avatar.Image
                    alt="Jane Doe"
                    src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg"
                  />
                  <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col gap-0">
                  <p className="text-sm leading-5 font-medium">Jane Doe</p>
                  <p className="text-xs leading-none text-muted">
                    jane@example.com
                  </p>
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
              <Dropdown.Item id="logout" textValue="Logout" variant="danger">
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
