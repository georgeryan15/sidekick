import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import ChatPane from "../components/chat/ChatPane";

export default function Home() {
  const { conversationId } = useParams();
  const [panes, setPanes] = useState<string[]>(() => [crypto.randomUUID()]);

  const handleSplitPane = useCallback(() => {
    setPanes((prev) => [...prev, crypto.randomUUID()]);
  }, []);

  const handleClosePane = useCallback((id: string) => {
    setPanes((prev) => (prev.length > 1 ? prev.filter((p) => p !== id) : prev));
  }, []);

  return (
    <div className="flex h-full gap-2">
      {panes.map((paneId, i) => (
        <ChatPane
          key={paneId}
          onSplitPane={handleSplitPane}
          onClosePane={() => handleClosePane(paneId)}
          paneCount={panes.length}
          conversationId={i === 0 ? conversationId : undefined}
          isUrlPane={i === 0}
        />
      ))}
    </div>
  );
}
