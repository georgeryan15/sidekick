interface WidgetChipProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress?: () => void;
}

export default function WidgetChip({ icon, title, description, onPress }: WidgetChipProps) {
  return (
    <button
      onClick={onPress}
      className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200/80 transition-colors cursor-pointer shrink-0"
    >
      <div className="flex items-center justify-center size-7 rounded-full bg-neutral-700 text-white shrink-0">
        {icon}
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-xs font-medium text-neutral-800">{title}</span>
        <span className="text-[11px] text-neutral-500">{description}</span>
      </div>
    </button>
  );
}
