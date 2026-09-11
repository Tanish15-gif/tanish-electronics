import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type KeyboardEvent,
  type MouseEvent
} from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Send,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  ArrowDown,
  Maximize2,
  Minimize2,
  Phone,
  Package,
  Wrench,
  Search,
  MessageSquare
} from "lucide-react";

export interface ChatProductCardDto {
  productId: number;
  productName: string;
  categoryName: string;
  conditionName: string;
  price: number;
  isAvailable: boolean;
  primaryImageUrl?: string;
}

export interface ChatActionDto {
  label: string;
  url: string;
  icon?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  at: number;
  products?: ChatProductCardDto[];
  actions?: ChatActionDto[];
}

function ActionIcon({ name }: { name?: string }) {
  switch (name?.toLowerCase()) {
    case "phone":
    case "call":
    case "📞":
      return <Phone size={13} className="shrink-0" />;
    case "package":
    case "products":
    case "box":
    case "📦":
      return <Package size={13} className="shrink-0" />;
    case "wrench":
    case "repair":
    case "tool":
    case "🔧":
      return <Wrench size={13} className="shrink-0" />;
    case "search":
    case "track":
    case "🔍":
      return <Search size={13} className="shrink-0" />;
    case "message":
    case "chat":
      return <MessageSquare size={13} className="shrink-0" />;
    default:
      return <Sparkles size={13} className="shrink-0" />;
  }
}

import {
  getAccessToken,
  getStoredAuthUser
} from "../../Services/customAuthService";

const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_MESSAGE_LENGTH = 500;
const HISTORY_WINDOW = 6;

const GREETING =
  "Hi! I'm your Tanish Electronics assistant. Ask me to book a repair, track a request, check products, or learn about our shop!";

function getInitialGreeting(): string {
  const authUser = getStoredAuthUser();
  if (authUser?.fullName) {
    const firstName = authUser.fullName.trim().split(" ")[0];
    return `Hi ${firstName}! I'm your Tanish Electronics assistant. Ask me to book a repair, track your requests, check products, or current offers!`;
  }
  return GREETING;
}

const SUGGESTIONS = [
  "Book a repair",
  "Track my repair",
  "What repairs do you offer?",
  "Current offers & deals",
  "Do you visit my area?"
];

const GENERIC_ERROR =
  "Sorry, something went wrong. Please try again or contact the shop directly.";
const TIMEOUT_ERROR =
  "That took longer than expected. Please check your connection and try again.";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatTime = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function FormattedText({ text }: { text: string }) {
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {boldParts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong
              key={index}
              className="font-bold text-slate-900 dark:text-amber-200"
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function MessageBody({ content, role }: { content: string; role: string }) {
  const parts = useMemo(() => content.split(URL_PATTERN), [content]);
  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, i) =>
        URL_PATTERN.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={
              role === "user"
                ? "font-semibold underline underline-offset-2 text-white decoration-white/60 hover:decoration-white dark:text-[#11110f] dark:decoration-[#11110f]/50 dark:hover:decoration-[#11110f]"
                : "font-semibold underline underline-offset-2 text-[#1f1a12] decoration-[#1f1a12]/50 hover:decoration-[#1f1a12] dark:text-[#d6b46a] dark:decoration-[#d6b46a]/50 dark:hover:decoration-[#d6b46a]"
            }
          >
            {part}
          </a>
        ) : (
          <FormattedText key={i} text={part} />
        )
      )}
    </span>
  );
}

export default function ChatWidget() {
  const navigate = useNavigate();

  // Stable session UUID for this browser tab — persisted across reloads, sent to backend for chat logging
  const [sessionKey, setSessionKey] = useState<string>(() => {
    try {
      const existing = sessionStorage.getItem("te_chat_session_key");
      if (existing) return existing;
      const newKey = crypto.randomUUID();
      sessionStorage.setItem("te_chat_session_key", newKey);
      return newKey;
    } catch {
      return crypto.randomUUID();
    }
  });

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("te_chat_open") === "true";
    } catch {
      return false;
    }
  });

  // Default to full sidebar on desktop, small widget on mobile
  const [isSidebar, setIsSidebar] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("te_chat_sidebar") === "true";
    } catch {
      return false;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem("te_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: uid(),
        role: "assistant",
        content: getInitialGreeting(),
        at: Date.now()
      }
    ];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("te_chat_open", isOpen ? "true" : "false");
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem("te_chat_sidebar", isSidebar ? "true" : "false");
    } catch {}
  }, [isSidebar]);

  useEffect(() => {
    try {
      sessionStorage.setItem("te_chat_messages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [hasNewBelow, setHasNewBelow] = useState(false);

  const [proactivePrompt, setProactivePrompt] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowPrompt(false);
      return;
    }
    const timer = setTimeout(() => {
      const path = window.location.pathname;
      let msg = "Have a question about our repairs or products?";
      if (path.startsWith("/products/")) {
        msg = "Need help with features or price for this item?";
      } else if (path.startsWith("/products")) {
        msg = "Looking for a specific TV, remote or adapter?";
      } else if (path.startsWith("/book-repair")) {
        msg = "Want me to book a repair for you right here?";
      } else if (path.startsWith("/track-request")) {
        msg = "Need help tracking your repair request?";
      }
      setProactivePrompt(msg);
      setShowPrompt(true);
    }, 12_000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ).current;

  const handleActionClick = useCallback(
    (e: MouseEvent, url: string) => {
      e.preventDefault();
      if (!url) return;
      if (url.startsWith("tel:") || url.startsWith("mailto:")) {
        window.location.href = url;
        return;
      }
      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      // Client-side SPA navigation without closing or reloading chat
      navigate(url);
    },
    [navigate]
  );

  useEffect(() => {
    if (isOpen && isSidebar) {
      document.body.classList.add("chat-sidebar-open");
    } else {
      document.body.classList.remove("chat-sidebar-open");
    }
    return () => document.body.classList.remove("chat-sidebar-open");
  }, [isOpen, isSidebar]);

  const handleScroll = useCallback(() => {
    const el = transcriptRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    atBottomRef.current = atBottom;
    if (atBottom) setHasNewBelow(false);
  }, []);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      bottomRef.current?.scrollIntoView({
        behavior: prefersReducedMotion || !smooth ? "auto" : "smooth"
      });
      setHasNewBelow(false);
      atBottomRef.current = true;
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    if (messages.length === 1) return;
    if (atBottomRef.current) {
      scrollToBottom();
    } else if (messages[messages.length - 1]?.role !== "user") {
      setHasNewBelow(true);
    }
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        launcherRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const resizeInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  useEffect(resizeInput, [input, resizeInput]);

  const send = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!trimmed || isLoading) return;

      setLastFailed(null);
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        at: Date.now()
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      const assistantMsgId = uid();
      let accumulatedReply = "";
      let hasAddedAssistantMsg = false;

      try {
        const token = getAccessToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/public/chat/stream`, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            message: trimmed,
            currentPath: window.location.pathname,
            sessionKey,
            history: [...messages, userMsg]
              .slice(-HISTORY_WINDOW - 1, -1)
              .map(({ role, content }) => ({ role, content }))
          })
        });

        if (!response.ok)
          throw new Error(`Request failed with ${response.status}`);

        if (!response.body) throw new Error("No response body received");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const trimmedChunk = chunk.trim();
            if (!trimmedChunk.startsWith("data: ")) continue;

            const jsonStr = trimmedChunk.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const evt = JSON.parse(jsonStr) as {
                type: "token" | "metadata" | "done";
                content?: string;
                products?: ChatProductCardDto[];
                actions?: ChatActionDto[];
              };

              if (evt.type === "token" && evt.content) {
                accumulatedReply += evt.content;
                if (!hasAddedAssistantMsg) {
                  hasAddedAssistantMsg = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: "assistant",
                      content: accumulatedReply,
                      at: Date.now()
                    }
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: accumulatedReply }
                        : m
                    )
                  );
                }
              } else if (evt.type === "metadata") {
                if (!hasAddedAssistantMsg) {
                  hasAddedAssistantMsg = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: "assistant",
                      content: accumulatedReply,
                      products: evt.products,
                      actions: evt.actions,
                      at: Date.now()
                    }
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            products: evt.products ?? m.products,
                            actions: evt.actions ?? m.actions
                          }
                        : m
                    )
                  );
                }
              }
            } catch {
              // Ignore single SSE chunk parse issues
            }
          }
        }

        if (!hasAddedAssistantMsg && accumulatedReply.trim()) {
          hasAddedAssistantMsg = true;
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: "assistant",
              content: accumulatedReply,
              at: Date.now()
            }
          ]);
        }
      } catch (err) {
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        if (!hasAddedAssistantMsg) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "error",
              content: isAbort ? TIMEOUT_ERROR : GENERIC_ERROR,
              at: Date.now()
            }
          ]);
        }
        setLastFailed(trimmed);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const charsLeft = MAX_MESSAGE_LENGTH - input.length;
  const showCounter = charsLeft <= 60;

  return (
    <>
      <style>{`
        body.chat-sidebar-open { overflow-x: hidden; }
        #root { transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1); width: 100%; }
        header.fixed { transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        
        @media (min-width: 640px) {
          body.chat-sidebar-open #root, body.chat-sidebar-open header.fixed { width: calc(100vw - 350px) !important; }
          body.chat-sidebar-open .floating-whatsapp { right: calc(350px + 1.5rem) !important; }
        }
        @media (min-width: 768px) {
          body.chat-sidebar-open #root, body.chat-sidebar-open header.fixed { width: calc(100vw - 400px) !important; }
          body.chat-sidebar-open .floating-whatsapp { right: calc(400px + 1.5rem) !important; }
        }
        @media (min-width: 1024px) {
          body.chat-sidebar-open #root, body.chat-sidebar-open header.fixed { width: calc(100vw - 450px) !important; }
          body.chat-sidebar-open .floating-whatsapp { right: calc(450px + 1.5rem) !important; }
        }
        @media (min-width: 1280px) {
          body.chat-sidebar-open #root, body.chat-sidebar-open header.fixed { width: 72vw !important; }
          body.chat-sidebar-open .floating-whatsapp { right: calc(28vw + 1.5rem) !important; }
        }

        /* Animations for Chat Widget */
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chat-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-chat-widget {
          animation: chat-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (min-width: 640px) {
          .animate-chat-sidebar {
            animation: chat-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
        @keyframes chat-dot {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
        @keyframes chat-ping {
          0% { opacity: 0.7; transform: scale(1); }
          70%, 100% { opacity: 0; transform: scale(1.5); }
        }
        @media (prefers-reduced-motion: reduce) {
          #root, header, .floating-whatsapp { transition: none !important; }
          .animate-chat-widget, .animate-chat-sidebar, .chat-ping-ring { animation: none !important; }
        }
      `}</style>

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Tanish Electronics Assistant"
          className={`te-sheet-bg fixed z-[99999] flex flex-col overflow-hidden bg-[var(--warm-bg-light)] font-sans text-[#1f1a12] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-[var(--warm-bg-dark)] dark:text-[var(--warm-text-dark)]
            ${
              isSidebar
                ? "animate-chat-sidebar inset-0 sm:inset-y-0 sm:left-auto sm:right-0 h-[100dvh] sm:h-full sm:w-[350px] md:w-[400px] lg:w-[450px] xl:w-[28vw] sm:rounded-none sm:border-l sm:border-y-0 sm:border-r-0 sm:border-[#d8cdb6] dark:border-[var(--warm-border-dark)]"
                : "animate-chat-widget inset-0 sm:inset-auto sm:bottom-28 sm:right-6 h-[100dvh] sm:h-[36rem] sm:w-[24rem] lg:w-[28rem] sm:rounded-2xl sm:border sm:border-[#d8cdb6] dark:border-[var(--warm-border-dark)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
            }
          `}
        >
          {/* Header */}
          <div className="relative shrink-0 border-b border-slate-200/60 bg-[var(--warm-bg-light)]/95 px-4 py-3 backdrop-blur-md dark:border-[var(--warm-border-dark)] dark:bg-[var(--warm-bg-dark)]/95">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[0.8rem] font-bold tracking-wide text-slate-900 dark:border-[#302c24] dark:bg-[var(--warm-card-dark)] dark:text-[#d6b46a]">
                TE
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[var(--warm-card-dark)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold leading-tight text-slate-900 dark:text-[var(--warm-text-dark)]">
                  Tanish Electronics
                </p>
                <p className="mt-0.5 text-[13px] text-slate-500 dark:text-[var(--warm-muted-dark)]">
                  Online - Replies instantly
                </p>
              </div>

              {/* Header Action Controls */}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const fresh: ChatMessage[] = [
                      {
                        id: uid(),
                        role: "assistant",
                        content: getInitialGreeting(),
                        at: Date.now()
                      }
                    ];
                    setMessages(fresh);
                    const newSessionKey = crypto.randomUUID();
                    setSessionKey(newSessionKey);
                    try {
                      sessionStorage.setItem(
                        "te_chat_messages",
                        JSON.stringify(fresh)
                      );
                      sessionStorage.setItem(
                        "te_chat_session_key",
                        newSessionKey
                      );
                    } catch {}
                  }}
                  aria-label="Restart conversation"
                  title="Restart conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/50 hover:text-slate-900 focus-visible:bg-slate-200/50 focus-visible:outline-none dark:text-[var(--warm-muted-dark)] dark:hover:bg-[var(--warm-card-dark)] dark:hover:text-[var(--warm-text-dark)] dark:focus-visible:bg-[var(--warm-card-dark)]"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={() => setIsSidebar((prev) => !prev)}
                  aria-label={
                    isSidebar ? "Minimize to widget" : "Expand to sidebar"
                  }
                  className="hidden h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/50 hover:text-slate-900 focus-visible:bg-slate-200/50 focus-visible:outline-none sm:flex dark:text-[var(--warm-muted-dark)] dark:hover:bg-[var(--warm-card-dark)] dark:hover:text-[var(--warm-text-dark)] dark:focus-visible:bg-[var(--warm-card-dark)]"
                >
                  {isSidebar ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    launcherRef.current?.focus();
                  }}
                  aria-label="Close chat"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/50 hover:text-slate-900 focus-visible:bg-slate-200/50 focus-visible:outline-none dark:text-[var(--warm-muted-dark)] dark:hover:bg-[var(--warm-card-dark)] dark:hover:text-[var(--warm-text-dark)] dark:focus-visible:bg-[var(--warm-card-dark)]"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={transcriptRef}
            onScroll={handleScroll}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="te-scrollbar overscroll-contain relative flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {messages.map((msg) => {
              if (msg.role === "error") {
                return (
                  <div
                    key={msg.id}
                    className="flex w-fit max-w-[90%] flex-col items-start"
                  >
                    <div className="rounded-2xl rounded-bl-sm border border-red-100 bg-red-50 px-4 py-2.5 text-[15px] leading-relaxed text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                      {msg.content}
                    </div>
                    {lastFailed !== null && (
                      <button
                        onClick={() => void send(lastFailed)}
                        className="mt-1.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold text-[#1f1a12] transition hover:bg-[#1f1a12]/10 dark:text-[#d6b46a] dark:hover:bg-[#d6b46a]/10"
                      >
                        <RotateCcw size={14} />
                        Retry
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={msg.id}
                  className={
                    msg.role === "user"
                      ? "ml-auto flex w-fit max-w-[85%] flex-col items-end"
                      : "flex w-full flex-col items-start" // <-- FIX 1: Let the AI use full width!
                  }
                >
                  {/* 1. TEXT BUBBLE */}
                  {(msg.content?.trim() ||
                    (!msg.products?.length && !msg.actions?.length)) && (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "rounded-br-xs bg-[#1f1a12] text-[#f7f5ef] font-semibold dark:bg-[#d6b46a] dark:text-[#11110f]"
                          : "w-fit max-w-[90%] rounded-bl-xs border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]"
                      }`}
                    >
                      <MessageBody
                        content={
                          msg.content?.trim() ||
                          "Thank you! How else can I help you today?"
                        }
                        role={msg.role}
                      />
                    </div>
                  )}

                  {/* Contextual Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-0.5">
                      {msg.actions.map((act, i) => (
                        <a
                          key={i}
                          href={act.url}
                          onClick={(e) => handleActionClick(e, act.url)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cdb6] bg-[#fffdf7] px-3.5 py-1.5 text-[12px] font-bold text-[#1f1a12] shadow-sm transition-all hover:border-[#1f1a12] hover:bg-[#1f1a12] hover:text-[#f7f5ef] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#d6b46a] dark:hover:border-[#d6b46a] dark:hover:bg-[#d6b46a] dark:hover:text-[#11110f]"
                        >
                          <ActionIcon name={act.icon} />
                          <span>{act.label}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* 2. PRODUCT GRID */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 grid w-full grid-cols-1 sm:grid-cols-2 gap-3 pb-1 overscroll-contain">
                      {msg.products.map((p) => (
                        <a
                          key={p.productId}
                          href={`/products/${p.productId}`}
                          onClick={(e) =>
                            handleActionClick(e, `/products/${p.productId}`)
                          }
                          className="group relative flex w-full flex-col rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] p-3 text-left no-underline shadow-sm transition-all hover:border-[#8a6624] hover:shadow-md dark:border-[#302c24] dark:bg-[#161411] dark:hover:border-[#d6b46a]/60"
                        >
                          {/* Category & Available Tag */}
                          <div className="mb-2.5 flex items-center justify-between gap-1">
                            <span className="truncate rounded-full border border-[#d8cdb6] bg-[#f7f5ef] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#5f574a] dark:border-[#302c24] dark:bg-[#201c16] dark:text-[#d6b46a]">
                              {p.categoryName}
                            </span>
                            {p.isAvailable && (
                              <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                                Available
                              </span>
                            )}
                          </div>

                          {/* Image / Letter Fallback Container */}
                          <div className="mb-2.5 flex h-[105px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#f7f5ef] dark:bg-[#201c16]">
                            {p.primaryImageUrl ? (
                              <img
                                src={p.primaryImageUrl}
                                alt={p.productName}
                                className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#161411]">
                                <span className="text-xl font-black text-[#8a6624] dark:text-[#d6b46a]">
                                  {p.productName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Condition Tag & Title */}
                          <div className="flex flex-col">
                            <span className="mb-1.5 w-fit rounded-full border border-[#d8cdb6] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#6f6758] dark:border-[#302c24] dark:text-[#a8a093]">
                              {p.conditionName}
                            </span>
                            <p className="truncate text-[14px] font-bold text-[#1f1a12] dark:text-[#f7f5ef]">
                              {p.productName}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] font-semibold text-[#817867] dark:text-[#928a7d]">
                              Details available
                            </p>
                          </div>

                          {/* Price Label, Amount, and Button Row */}
                          <div className="mt-3 flex items-end justify-between border-t border-[#d8cdb6]/60 pt-2.5 dark:border-[#302c24]">
                            <div className="min-w-0 flex-1">
                              <p className="mb-0.5 text-[8px] font-bold tracking-widest text-[#817867] dark:text-[#d6b46a]">
                                PRICE
                              </p>
                              <p className="truncate text-[16px] font-black leading-none text-[#1f1a12] dark:text-[#f7f5ef]">
                                ₹{p.price.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg bg-[#1f1a12] px-2.5 text-[10px] font-bold text-[#f7f5ef] transition-colors group-hover:bg-[#3b3223] dark:bg-[#d6b46a] dark:text-[#11110f] dark:group-hover:bg-[#e8cba5]">
                              View details
                              <svg
                                className="h-2.5 w-2.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Time Stamp */}
                  <span className="mt-1.5 px-1 text-[12px] text-slate-500 dark:text-[var(--warm-muted-dark)]">
                    {formatTime(msg.at)}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div
                className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-200/50 bg-slate-100 px-4 py-3.5 dark:bg-[var(--warm-card-dark)] dark:border-[var(--warm-border-dark)]"
                aria-label="Assistant is typing"
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-[#a8a093]"
                    style={{
                      animation: prefersReducedMotion
                        ? undefined
                        : "chat-dot 1.2s ease-in-out infinite",
                      animationDelay: `${d * 0.15}s`,
                      opacity: prefersReducedMotion ? 0.6 : undefined
                    }}
                  />
                ))}
              </div>
            )}

            {messages.length === 1 && !isLoading && (
              <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto pb-1 pt-1 sm:overflow-visible -mx-1 px-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] sm:text-[14px] font-medium text-[#1f1a12] transition hover:bg-[#1f1a12]/5 hover:border-[#1f1a12]/30 dark:border-[var(--warm-border-dark)] dark:bg-[var(--warm-card-dark)] dark:text-[#d6b46a] dark:hover:bg-[#d6b46a]/10 dark:hover:border-[#d6b46a]"
                  >
                    <Sparkles size={14} />
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {hasNewBelow && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-[6rem] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-200 bg-[#1f1a12] px-4 py-1.5 text-[13px] font-bold text-[#f7f5ef] shadow-md transition hover:bg-[#000000] dark:border-[var(--warm-border-dark)] dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:brightness-110"
            >
              <ArrowDown size={14} />
              New message
            </button>
          )}

          {/* Composer */}
          <div className="shrink-0 border-t border-slate-200/60 bg-[var(--warm-bg-light)] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 sm:pb-5 dark:border-[var(--warm-border-dark)] dark:bg-[var(--warm-bg-dark)]">
            <div className="flex items-end gap-2 rounded-3xl border border-transparent bg-slate-100 px-2 py-1.5 transition-colors focus-within:border-[#1f1a12] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1f1a12]/20 dark:bg-[var(--warm-card-dark)] dark:border-[var(--warm-border-dark)] dark:focus-within:border-[#d6b46a] dark:focus-within:ring-[#d6b46a] dark:focus-within:bg-[var(--warm-card-dark)]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) =>
                  setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
                }
                onKeyDown={handleKeyDown}
                placeholder="Start a new message"
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                aria-label="Message"
                className="max-h-24 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-normal text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-[var(--warm-text-dark)] dark:placeholder:text-[var(--warm-muted-dark)]"
              />
              <button
                onClick={() => void send(input)}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1f1a12] transition hover:bg-[#1f1a12]/10 disabled:opacity-50 disabled:hover:bg-transparent focus-visible:outline-none dark:text-[#d6b46a] dark:hover:bg-[#d6b46a]/10"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-4 px-1 text-[12px] text-slate-500 dark:text-[var(--warm-muted-dark)]">
              <span className="flex items-center gap-1.5 text-center">
                <ShieldCheck size={14} />
                End-to-end encrypted
              </span>
              {showCounter && (
                <span
                  className={
                    charsLeft <= 0
                      ? "text-red-500 dark:text-red-400"
                      : undefined
                  }
                >
                  {charsLeft}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <>
          {showPrompt && proactivePrompt && (
            <div className="fixed bottom-22 right-20 z-40 max-w-[270px] animate-chat-widget rounded-2xl border border-[#d8cdb6] bg-[#fffdf7]/95 p-3.5 text-xs font-semibold text-[#1f1a12] shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 sm:bottom-24 sm:right-24 dark:border-[#3a3428] dark:bg-[#1a1712]/95 dark:text-[#e8e3d8] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 border-r border-t border-[#d8cdb6] bg-[#fffdf7] dark:border-[#3a3428] dark:bg-[#1a1712]" />

              <div className="relative z-10 flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f1a12]/5 text-[#8a6624] dark:bg-[#d6b46a]/15 dark:text-[#d6b46a]">
                  <Sparkles size={13} />
                </div>
                <button
                  onClick={() => {
                    setIsOpen(true);
                    setShowPrompt(false);
                  }}
                  className="flex-1 text-left text-xs font-bold leading-snug transition hover:text-[#8a6624] dark:hover:text-[#d6b46a] cursor-pointer"
                >
                  {proactivePrompt}
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  aria-label="Dismiss AI suggestion"
                  className="text-[#817867] hover:text-[#1f1a12] dark:text-[#928a7d] dark:hover:text-[#f7f5ef] cursor-pointer pt-0.5 transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <button
            ref={launcherRef}
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-label="Open AI Assistant"
            title="Ask AI Assistant"
            className="cursor-pointer group fixed bottom-22 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:border-[#d6b46a] active:scale-95 focus-visible:outline-none sm:bottom-24 sm:right-6 sm:h-15 sm:w-15 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#d6b46a] dark:hover:border-[#d6b46a]/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          >
            <span
              className="chat-ping-ring absolute inset-0 rounded-full border border-[#8a6624]/30 dark:border-[#d6b46a]/40"
              style={{
                animation: prefersReducedMotion
                  ? undefined
                  : "chat-ping 2.4s ease-out infinite"
              }}
            />
            {/* ----- THE CUSTOM CHAT BUBBLE SVG ----- */}
            <span className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Neural connections */}
                <path d="M12 12L6.5 6.5" />
                <path d="M12 12L17.5 6.5" />
                <path d="M12 12L6.5 17.5" />
                <path d="M12 12L17.5 17.5" />

                {/* Outer nodes */}
                <circle cx="6.5" cy="6.5" r="1.8" />
                <circle cx="17.5" cy="6.5" r="1.8" />
                <circle cx="6.5" cy="17.5" r="1.8" />
                <circle cx="17.5" cy="17.5" r="1.8" />

                {/* AI core */}
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </span>
          </button>
        </>
      )}
    </>
  );
}
