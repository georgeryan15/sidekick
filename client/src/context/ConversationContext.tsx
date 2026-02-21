import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";
import {
  useConversations,
  type Conversation,
} from "../hooks/useConversations";

interface ConversationContextValue {
  conversations: Conversation[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextValue | undefined>(
  undefined
);

export function ConversationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { conversations, isLoading, refresh, deleteConversation } =
    useConversations(user?.id);

  return (
    <ConversationContext.Provider
      value={{ conversations, isLoading, refresh, deleteConversation }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversationContext must be used within a ConversationProvider"
    );
  }
  return context;
}
