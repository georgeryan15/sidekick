import { useNavigate, useParams } from "react-router-dom";
import { Button, Spinner } from "@heroui/react";
import { Plus } from "@gravity-ui/icons";
import { useConversationContext } from "../context/ConversationContext";

export default function ConversationList() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { conversations, isLoading } = useConversationContext();

  return (
    <div className="flex flex-col gap-1">
      <Button
        fullWidth
        size="sm"
        variant="outline"
        className="mb-1"
        onPress={() => navigate("/")}
      >
        <Plus className="size-3.5" />
        New Chat
      </Button>

      {isLoading && conversations.length === 0 && (
        <div className="flex justify-center py-2">
          <Spinner size="sm" />
        </div>
      )}

      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => navigate(`/c/${conv.id}`)}
          className={`w-full text-left rounded-md px-3 py-1.5 text-sm truncate transition-colors ${
            conversationId === conv.id
              ? "bg-neutral-100 font-medium"
              : "hover:bg-neutral-50"
          }`}
        >
          {conv.title}
        </button>
      ))}
    </div>
  );
}
