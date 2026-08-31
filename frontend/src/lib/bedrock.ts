import { aiApi } from './api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Send a message to Proofsy AI (proxied via secure backend)
 */
export async function bedrockChat(
  messages: Message[],
  systemPrompt?: string
): Promise<string> {
  try {
    const payloadMessages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      payloadMessages.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of messages) {
      payloadMessages.push({ role: msg.role, content: msg.content });
    }

    const res = await aiApi.chat(payloadMessages);
    if (res.success && res.data?.content) {
      return res.data.content;
    }
    return 'No response received from AI service.';
  } catch (error: any) {
    const errorMsg = error?.message || 'Failed to communicate with AI service';
    throw new Error(errorMsg);
  }
}

/**
 * Stream responses from AI service (fallback generator)
 */
export async function* bedrockChatStream(
  messages: Message[],
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  const fullText = await bedrockChat(messages, systemPrompt);
  yield fullText;
}

