import { supabase } from "./supabase";

export async function createConversation(
  userId: string,
  title = "New conversation"
): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data.id;
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const { error: msgError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content });

  if (msgError) throw new Error(`Failed to save message: ${msgError.message}`);

  const { error: updateError } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (updateError)
    console.error("Failed to bump updated_at:", updateError.message);
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", id);

  if (error)
    console.error("Failed to update conversation title:", error.message);
}
