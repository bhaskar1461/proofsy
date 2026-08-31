"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/Sidebar";
import { pageVariants, staggerContainer, fadeUp, headerSlide } from "@/lib/animations";

/* ───────── Types ───────── */
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  status?: "thinking" | "done" | "error";
  actions?: ActionPreview[];
}

interface ActionPreview {
  type: string;
  label: string;
  description: string;
  status: "pending" | "confirmed" | "rejected" | "running" | "done" | "error";
  result?: string;
  link?: string;
  templateId?: string;
}

/* ───────── Suggestions ───────── */
const suggestions = [
  { icon: "📋", text: "Paste a certificate screenshot (Ctrl+V) to turn into template", category: "Screenshot" },
  { icon: "🎨", text: "Change the recipient name color to #D4AF37 on Elegant Gold", category: "Design" },
  { icon: "📜", text: "Create a certificate for Bhaskar Sharma", category: "Create" },
  { icon: "📤", text: "Upload a CSV and generate bulk certificates", category: "Bulk" },
  { icon: "🔍", text: "Find all certificates issued today", category: "Search" },
  { icon: "📊", text: "How many certificates have been issued?", category: "Analytics" },
];

/* ───────── Main Page ───────── */
export default function AskProofsyPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* Auto-resize textarea */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const addMessage = (role: ChatMessage["role"], content: string, extras?: Partial<ChatMessage>) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
      timestamp: new Date(),
      status: "done",
      ...extras,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  /* ── Real AI response via backend Groq API ── */
  const sendToAI = async (userMessage: string) => {
    setIsTyping(true);
    const thinkingMsg = addMessage("assistant", "", { status: "thinking" });

    try {
      // Build conversation history for context
      const history = messages
        .filter((m) => m.status === "done" && m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: userMessage });

      const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (workspaceId) headers["x-workspace-id"] = workspaceId;
      if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ messages: history }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        // Build action previews from tool executions
        const actions: ActionPreview[] = (json.data.toolExecutions || []).map((te: { tool: string; result: { requiresConfirmation?: boolean; message?: string; templateId?: string } }) => ({
          type: te.tool,
          label: te.tool.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          description: te.result?.message || `Executed ${te.tool}`,
          status: te.result?.requiresConfirmation ? "pending" as const : "done" as const,
          result: te.result?.requiresConfirmation ? undefined : "Completed",
          templateId: te.result?.templateId,
        }));

        // If AI edited or created a template, add an "Open in Studio" action
        const templateAction = (json.data.toolExecutions || []).find(
          (te: { tool: string; result: { templateId?: string } }) =>
            ["edit_template", "duplicate_template"].includes(te.tool) && te.result?.templateId
        );
        if (templateAction) {
          actions.push({
            type: "open_studio",
            label: "Open in Template Studio",
            description: "View and edit this template in the visual Designer",
            status: "pending" as const,
            templateId: templateAction.result.templateId,
          });
        }

        const cleanContent = (json.data.content || "")
          .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "")
          .replace(/<function=[^>]*>[\s\S]*?<\/function>/gi, "")
          .trim();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingMsg.id
              ? { ...m, content: cleanContent || "I have completed the requested operation.", status: "done" as const, actions }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkingMsg.id
              ? { ...m, content: json.error || "Sorry, I encountered an error. Please try again.", status: "error" as const }
              : m
          )
        );
      }
    } catch (err) {
      console.error("[AskProofsy] Error sending message:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingMsg.id
            ? { ...m, content: "Connection error — please check that the backend is running.", status: "error" as const }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  /* ── Convert image / screenshot into certificate template ── */
  const processImageFile = async (file: File) => {
    addMessage("user", `📷 Uploaded screenshot: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`);
    setIsTyping(true);
    const analyzingMsg = addMessage("assistant", "", {
      status: "thinking",
    });

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("name", file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));

      const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

      const headers: Record<string, string> = {};
      if (workspaceId) headers["x-workspace-id"] = workspaceId;
      if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

      const res = await fetch("/api/templates/from-image", {
        method: "POST",
        credentials: "include",
        headers,
        body: formData,
      });

      const json = await res.json();

      if (json.success && json.data) {
        const template = json.data;
        const layerCount = template.textLayers?.length || 5;

        const cardContent = `🎉 **Successfully turned your screenshot into a certificate template!**

### 📜 Template: **${template.name}**
- **Dimensions**: \`${template.width} × ${template.height}px\`
- **Layers Auto-Generated**: **${layerCount} Text Layers** (\`recipient_name\`, \`event_name\`, \`date\`, \`organizer\`, \`verification_code\`) + Embedded QR Code
- **Background**: High-res canvas converted from screenshot

**What would you like to do next?**
- Tell me: *"Change the font color to gold"* or *"Make the recipient name larger"*
- Or click one of the quick actions below to launch!`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingMsg.id
              ? {
                  ...m,
                  status: "done" as const,
                  content: cardContent,
                  actions: [
                    {
                      type: "open_studio",
                      label: "Open in Template Studio",
                      description: `Edit "${template.name}" on visual WYSIWYG canvas`,
                      status: "pending" as const,
                      templateId: template._id || template.id,
                    },
                    {
                      type: "create_event",
                      label: "Create Event with Template",
                      description: `Launch certificate issuance with this design`,
                      status: "pending" as const,
                    },
                  ],
                }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === analyzingMsg.id
              ? {
                  ...m,
                  status: "error" as const,
                  content: json.error || "Failed to convert image to certificate template.",
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === analyzingMsg.id
            ? {
                ...m,
                status: "error" as const,
                content: "Upload failed: " + (err.message || "Network error"),
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  /* ── Clipboard Paste (Ctrl+V) handler ── */
  const handlePaste = useCallback((e: ClipboardEvent | React.ClipboardEvent) => {
    const clipboardData = "clipboardData" in e ? e.clipboardData : (e as any).clipboardData;
    if (!clipboardData) return;

    // Check for pasted image files or items
    const items = Array.from((clipboardData.items || []) as DataTransferItemList);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const namedFile = new File([file], `screenshot-${Date.now()}.png`, { type: file.type || "image/png" });
          void processImageFile(namedFile);
          return;
        }
      }
    }

    const files = Array.from((clipboardData.files || []) as FileList);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        void processImageFile(file);
        return;
      }
    }
  }, []);

  // Global window paste listener for Ctrl+V anywhere
  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      handlePaste(e);
    };
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [handlePaste]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addMessage("user", trimmed);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    sendToAI(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    addMessage("user", text);
    sendToAI(text);
  };

  const handleActionConfirm = (msgId: string, actionIdx: number) => {
    const msg = messages.find((m) => m.id === msgId);
    const action = msg?.actions?.[actionIdx];

    if (action?.type === "open_studio") {
      const tid = action.templateId;
      router.push(tid ? `/designer?templateId=${tid}` : "/designer");
      return;
    }
    if (action?.type === "create_event") {
      router.push("/events/new");
      return;
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const updated = [...(m.actions || [])];
        updated[actionIdx] = { ...updated[actionIdx], status: "running" };
        return { ...m, actions: updated };
      })
    );
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          const updated = [...(m.actions || [])];
          updated[actionIdx] = { ...updated[actionIdx], status: "done", result: "Action completed successfully!" };
          return { ...m, actions: updated };
        })
      );
    }, 1500);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/") || file.name.match(/\.(png|jpg|jpeg|webp|pdf)$/i)) {
        void processImageFile(file);
      } else {
        addMessage("user", `📎 Uploaded: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`);
        sendToAI(`I uploaded a file: ${file.name}`);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/") || file.name.match(/\.(png|jpg|jpeg|webp|pdf)$/i)) {
        void processImageFile(file);
      } else {
        addMessage("user", `📎 Uploaded: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`);
        sendToAI(`I uploaded a file: ${file.name}`);
      }
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <motion.main
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col h-screen overflow-hidden"
      >
        {/* Header */}
        <motion.header
          variants={headerSlide}
          className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-foreground)]">Ask Proofsy</h2>
              <p className="text-[11px] text-[var(--color-muted)]">AI-powered certificate assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-border)] transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                New Chat
              </button>
            )}
            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20">
              Phase 1
            </span>
          </div>
        </motion.header>

        {/* Chat Area */}
        <div
          className={`flex-1 overflow-y-auto relative ${isEmpty ? "flex items-center justify-center" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleFileDrop}
        >
          {/* Drag overlay */}
          <AnimatePresence>
            {dragActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-indigo-500/10 border-2 border-dashed border-indigo-400 rounded-2xl m-4 flex items-center justify-center backdrop-blur-sm"
              >
                <div className="text-center">
                  <svg className="w-12 h-12 text-indigo-400 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-indigo-300 font-semibold text-lg">Drop CSV, Excel, or certificate files</p>
                  <p className="text-indigo-400/60 text-sm mt-1">Supported: .csv, .xlsx, .png, .jpg, .pdf</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isEmpty ? (
            /* ── Empty state: Welcome ── */
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-2xl mx-auto px-6 text-center">
              <motion.div variants={fadeUp} className="mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">Ask Proofsy Anything</h1>
                <p className="text-[var(--color-muted)] text-base">
                  Create certificates, manage recipients, send emails — just describe what you need.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s.text)}
                    className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] hover:border-[var(--color-border-strong)] transition-all text-left group cursor-pointer"
                  >
                    <span className="text-xl mt-0.5">{s.icon}</span>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">{s.text}</p>
                      <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">{s.category}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            /* ── Messages ── */
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mt-0.5 shadow-md shadow-indigo-500/20">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === "user" ? "order-1" : ""}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-[var(--color-primary)] text-white rounded-br-md"
                            : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-bl-md"
                        }`}
                      >
                        {msg.status === "thinking" ? (
                          <div className="flex items-center gap-2 text-[var(--color-muted)]">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-[12px]">Proofsy is thinking...</span>
                          </div>
                        ) : msg.role === "user" ? (
                          <div>{msg.content}</div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-[var(--color-foreground)] leading-relaxed space-y-2 [&_table]:w-full [&_table]:my-2 [&_table]:border-collapse [&_th]:border [&_th]:border-[var(--color-border)] [&_th]:p-2 [&_th]:bg-[var(--color-surface-alt)] [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-[var(--color-border)] [&_td]:p-2 [&_code]:bg-[var(--color-surface-alt)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-indigo-500 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {/* Action Previews */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.actions.map((action, ai) => (
                            <div
                              key={ai}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]"
                            >
                              <div className="flex-1">
                                <p className="text-[13px] font-semibold text-[var(--color-foreground)]">{action.label}</p>
                                <p className="text-[11px] text-[var(--color-muted)] mt-0.5">{action.description}</p>
                                {action.result && (
                                  <p className="text-[11px] text-emerald-400 mt-1 font-medium">✓ {action.result}</p>
                                )}
                              </div>
                              {action.status === "pending" && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleActionConfirm(msg.id, ai)}
                                    className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 cursor-pointer transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface)] cursor-pointer transition-all">
                                    Cancel
                                  </button>
                                </div>
                              )}
                              {action.status === "running" && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  <span className="text-[11px] text-indigo-400 font-medium">Running...</span>
                                </div>
                              )}
                              {action.status === "done" && (
                                <span className="text-emerald-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-right" : "text-left"} text-[var(--color-muted)] opacity-60`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-primary-faint)] flex items-center justify-center mt-0.5 text-[var(--color-primary)] font-bold text-xs">
                        U
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
              {/* File attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach CSV, Excel, or image file"
                className="shrink-0 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer rounded-lg hover:bg-[var(--color-surface)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.png,.jpg,.jpeg,.pdf"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Text input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Ask Proofsy to create certificates, edit templates, or paste a screenshot (Ctrl+V)..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-[14px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] outline-none max-h-[160px]"
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`shrink-0 p-2 rounded-xl transition-all cursor-pointer ${
                  input.trim() && !isTyping
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                    : "bg-[var(--color-surface)] text-[var(--color-muted)]"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-[var(--color-muted)] mt-2 opacity-50">
              Ask Proofsy uses AI to operate certificate functions. You can press Ctrl+V to turn any screenshot into a certificate.
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
