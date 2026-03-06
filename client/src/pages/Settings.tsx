import { Surface } from "@heroui/react";

export default function Settings() {
  return (
    <div className="flex flex-col gap-4 p-6 bg-surface rounded-2xl shadow-sm h-full overflow-auto">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Surface className="rounded-2xl p-6">
        <p className="text-muted">
          Adjust your application preferences and configuration.
        </p>
      </Surface>
    </div>
  );
}
