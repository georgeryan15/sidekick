import { useState, useEffect } from "react";

interface ThinkingIndicatorProps {
  statusLines: string[];
}

export default function ThinkingIndicator({
  statusLines,
}: ThinkingIndicatorProps) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium">Working away{dots}</span>
      {statusLines.map((line, i) => (
        <span key={i} className="text-xs text-muted">
          {line}
        </span>
      ))}
    </div>
  );
}
