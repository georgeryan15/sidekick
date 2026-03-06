import { PlugConnection } from "@gravity-ui/icons";

interface EmptyStateProps {
  onSuggestionClick?: (text: string) => void;
}

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl">
          <PlugConnection className="size-6 text-muted" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-foreground tracking-tight text-center">
          Good Evening George 👋
        </h1>
        <p className="text-sm text-muted text-center">
          It's currently 7°C in Heywood.
        </p>
      </div>
    </div>
  );
}
