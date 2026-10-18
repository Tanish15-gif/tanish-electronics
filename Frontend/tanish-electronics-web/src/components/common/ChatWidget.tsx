import { fetchWithSessionRefresh } from "../../Services/apiClient";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type KeyboardEvent,
  type MouseEvent
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  ClipboardCheck,
  Clock,
  Copy
} from "lucide-react";
import { useRepairTrackingSignalR } from "../../hooks/useRepairTrackingSignalR";
import {
  trackServiceRequest,
  type TrackServiceRequestResult
} from "../../Services/serviceRequestService";

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

interface ChatBookingDraft {
  draftId: string;
  expiresAt: string;
  categoryName: string;
  locationName?: string;
  details: {
    customerName: string;
    phoneNumber: string;
    email?: string;
    deviceName?: string;
    brand?: string;
    modelName?: string;
    issueDescription: string;
    serviceType: string;
    visitAddress?: string;
    preferredDate?: string;
    preferredTimeSlot?: string;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  at: number;
  products?: ChatProductCardDto[];
  actions?: ChatActionDto[];
  tracking?: TrackServiceRequestResult;
  bookingDraft?: ChatBookingDraft;
  bookingState?: "superseded" | "submitting" | "submitted";
  bookingError?: string;
}

function ActionIcon({ name }: { name?: string }) {
  switch (name?.toLowerCase()) {
    case "phone":
    case "call":
      return <Phone size={13} className="shrink-0" />;
    case "package":
    case "products":
    case "box":
      return <Package size={13} className="shrink-0" />;
    case "wrench":
    case "repair":
    case "tool":
      return <Wrench size={13} className="shrink-0" />;
    case "search":
    case "track":
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
import { useCustomAuth } from "../../contexts/CustomAuthContext";
import GoogleSignInButton from "../../Pages/GoogleSignInButton";

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

function getContextualSuggestions(pathname: string): string[] {
  const path = pathname.toLowerCase();
  if (path.includes("/products")) {
    return [
      'Do you have 55" Smart TVs?',
      "Do you sell TV remotes?",
      "What refurbished deals are available?",
      "Book a repair"
    ];
  }
  if (path.includes("/book-repair")) {
    return [
      "How does home visit repair work?",
      "What warranty do you offer on repairs?",
      "What is the diagnostic charge?",
      "Track an existing repair"
    ];
  }
  if (path.includes("/track-request")) {
    return [
      "How do I find my TE tracking number?",
      "What does Accepted status mean?",
      "How long does TV panel repair take?",
      "Call the workshop"
    ];
  }
  if (path.includes("/customer")) {
    return [
      "What is my latest repair status?",
      "Book another repair",
      "What products do you have in stock?",
      "Call the workshop"
    ];
  }
  return [
    "Book a repair",
    "Track my repair",
    "What repairs do you offer?",
    "Current offers & deals",
    "Do you visit my area?"
  ];
}

const GENERIC_ERROR =
  "Sorry, something went wrong. Please try again or contact the shop directly.";
const TIMEOUT_ERROR =
  "That took longer than expected. Please check your connection and try again.";
const RATE_LIMIT_ERROR =
  "You're sending messages a bit too quickly. Please wait about 30 seconds before sending another message.";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatTime = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

import TanishElectronicsLogo from "./TanishElectronicsLogo";

function IconBadge({
  type
}: {
  type:
    "lock" | "cross" | "check" | "alert" | "clipboard" | "wrench" | "sparkles";
}) {
  switch (type) {
    case "lock":
      return (
        <span
          aria-label="Security Lock"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-amber-500/35 bg-amber-500/15 text-amber-700 shadow-xs mr-1.5 align-text-bottom dark:border-amber-400/35 dark:bg-amber-400/20 dark:text-amber-300"
        >
          <Lock size={12} strokeWidth={2.4} />
        </span>
      );
    case "cross":
      return (
        <span
          aria-label="Error"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-rose-500/35 bg-rose-500/15 text-rose-700 shadow-xs mr-1.5 align-text-bottom dark:border-rose-400/35 dark:bg-rose-400/20 dark:text-rose-300"
        >
          <X size={12} strokeWidth={2.6} />
        </span>
      );
    case "check":
      return (
        <span
          aria-label="Success"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500/35 bg-emerald-500/15 text-emerald-700 shadow-xs mr-1.5 align-text-bottom dark:border-emerald-400/35 dark:bg-emerald-400/20 dark:text-emerald-300"
        >
          <Check size={12} strokeWidth={2.6} />
        </span>
      );
    case "alert":
      return (
        <span
          aria-label="Alert"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-amber-500/35 bg-amber-500/15 text-amber-700 shadow-xs mr-1.5 align-text-bottom dark:border-amber-400/35 dark:bg-amber-400/20 dark:text-amber-300"
        >
          <AlertTriangle size={12} strokeWidth={2.4} />
        </span>
      );
    case "clipboard":
      return (
        <span
          aria-label="Summary"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#8a6624]/35 bg-[#8a6624]/15 text-[#8a6624] shadow-xs mr-1.5 align-text-bottom dark:border-[#d6b46a]/35 dark:bg-[#d6b46a]/20 dark:text-[#d6b46a]"
        >
          <ClipboardCheck size={12} strokeWidth={2.4} />
        </span>
      );
    case "wrench":
      return (
        <span
          aria-label="Service"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#8a6624]/35 bg-[#8a6624]/15 text-[#8a6624] shadow-xs mr-1.5 align-text-bottom dark:border-[#d6b46a]/35 dark:bg-[#d6b46a]/20 dark:text-[#d6b46a]"
        >
          <Wrench size={12} strokeWidth={2.4} />
        </span>
      );
    case "sparkles":
      return (
        <span
          aria-label="Feature"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#8a6624]/35 bg-[#8a6624]/15 text-[#8a6624] shadow-xs mr-1.5 align-text-bottom dark:border-[#d6b46a]/35 dark:bg-[#d6b46a]/20 dark:text-[#d6b46a]"
        >
          <Sparkles size={12} strokeWidth={2.4} />
        </span>
      );
    default:
      return null;
  }
}

const ICON_TOKEN_REGEX = /(\[ICON_[A-Z]+\]|[⚠️🔑🔐🔒❌🎉📋🔧✨✅])/g;

function parseIconType(
  raw: string
):
  | "lock"
  | "cross"
  | "check"
  | "alert"
  | "clipboard"
  | "wrench"
  | "sparkles"
  | null {
  switch (raw) {
    case "[ICON_LOCK]":
    case "🔑":
    case "🔐":
    case "🔒":
      return "lock";
    case "[ICON_CROSS]":
    case "❌":
      return "cross";
    case "[ICON_ALERT]":
    case "⚠️":
      return "alert";
    case "[ICON_CHECK]":
    case "🎉":
    case "✅":
      return "check";
    case "[ICON_CLIPBOARD]":
    case "📋":
      return "clipboard";
    case "[ICON_WRENCH]":
    case "🔧":
      return "wrench";
    case "[ICON_SPARKLES]":
    case "✨":
      return "sparkles";
    default:
      return null;
  }
}

function renderTextWithIcons(text: string, baseKey: string | number) {
  const parts = text.split(ICON_TOKEN_REGEX);
  return (
    <span key={baseKey}>
      {parts.map((p, i) => {
        const iconType = parseIconType(p);
        if (iconType) {
          return <IconBadge key={i} type={iconType} />;
        }
        return p;
      })}
    </span>
  );
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(
    /(\*\*[^*\n]+\*\*|`[^`\n]+`|(?<![\\*])\*(?![\s*])[^*\n]*[^\s*]\*(?!\*))/g
  );
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong
              key={index}
              className="font-bold text-[#1f1a12] dark:text-[#f3dfb5]"
            >
              {renderTextWithIcons(part.slice(2, -2), `bold-${index}`)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={index}
              className="rounded border border-[#d8cdb6] bg-[#f7f5ef] px-1.5 py-0.5 font-mono text-[12px] font-bold text-[#8a6624] select-all dark:border-[#3a3428] dark:bg-[#201c16] dark:text-[#d6b46a]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (
          part.length > 2 &&
          part.startsWith("*") &&
          !part.startsWith("**") &&
          part.endsWith("*")
        ) {
          return (
            <em key={index} className="italic">
              {renderTextWithIcons(part.slice(1, -1), "italic-" + index)}
            </em>
          );
        }
        return renderTextWithIcons(part, `text-${index}`);
      })}
    </>
  );
}

function HammerThinkingLoader() {
  const THINKING_PHRASES = useMemo(
    () => [
      "Thinking...",
      "Pondering...",
      "Curating...",
      "Synthesizing...",
      "Analyzing request...",
      "Checking shop inventory...",
      "Consulting repair manuals...",
      "Reviewing pricing...",
      "Formulating response...",
      "Evaluating options...",
      "Polishing recommendations...",
      "Gathering technician notes...",
      "Checking parts availability..."
    ],
    []
  );

  const [phrase, setPhrase] = useState(() => {
    return THINKING_PHRASES[
      Math.floor(Math.random() * THINKING_PHRASES.length)
    ];
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPhrase((current) => {
        let next: string;
        do {
          next =
            THINKING_PHRASES[
              Math.floor(Math.random() * THINKING_PHRASES.length)
            ];
        } while (next === current && THINKING_PHRASES.length > 1);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [THINKING_PHRASES]);

  return (
    <div
      className="flex items-center gap-2.5 py-1.5 px-1"
      aria-label="Assistant is thinking"
    >
      <div className="grid grid-cols-3 gap-[3px] w-[17px] h-[17px] shrink-0">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const delay = (row + col) * 0.12;
          return (
            <span
              key={i}
              className="h-[3.8px] w-[3.8px] rounded-[1px] bg-[#1f1a12] dark:bg-[#d6b46a]"
              style={{
                animation: "hammer-grid-pulse 1.2s ease-in-out infinite",
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>
      <span className="text-[13px] font-medium tracking-wide text-[#7d7363] transition-opacity duration-300 dark:text-[#d6b46a]/90">
        {phrase}
      </span>
    </div>
  );
}

function ChatProductList({
  products,
  onActionClick
}: {
  products: ChatProductCardDto[];
  onActionClick: (e: MouseEvent, url: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_LIMIT = 2; // Show only 2 products initially
  const displayedProducts = isExpanded
    ? products
    : products.slice(0, INITIAL_LIMIT);
  const hasMore = products.length > INITIAL_LIMIT;

  return (
    <div className="mt-3 w-full space-y-2">
      {/* Top count badge matching Hammer Lifestyle */}
      <div className="flex items-center justify-between">
        <span className="inline-block rounded-full bg-[#1f1a12] px-3 py-1 text-[11px] font-bold text-white shadow-xs dark:bg-[#d6b46a] dark:text-[#11110f]">
          {products.length} {products.length === 1 ? "product" : "products"}
        </span>
      </div>

      {/* Horizontal product cards list */}
      <div className="flex flex-col gap-2.5">
        {displayedProducts.map((p) => (
          <div
            key={p.productId}
            className="group relative flex w-full items-center gap-3 rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] p-2.5 text-left shadow-xs transition-all hover:border-[#8a6624] hover:shadow-sm dark:border-[#302c24] dark:bg-[#161411] dark:hover:border-[#d6b46a]/60"
          >
            {/* Square Image container on left */}
            <div className="relative flex h-24 w-24 sm:h-26 sm:w-26 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#ede7d8] bg-white p-1.5 dark:border-[#2a261f] dark:bg-[#201c16]">
              {p.primaryImageUrl ? (
                <img
                  src={p.primaryImageUrl}
                  alt={p.productName}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#161411]">
                  <span className="text-xl font-black text-[#8a6624] dark:text-[#d6b46a]">
                    {p.productName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Right side: details & action */}
            <div className="flex flex-1 flex-col justify-between self-stretch min-w-0 py-0.5">
              <div>
                {/* Category & Condition tags */}
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="truncate rounded-full border border-[#d8cdb6] bg-[#f7f5ef] px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#5f574a] dark:border-[#302c24] dark:bg-[#201c16] dark:text-[#d6b46a]">
                    {p.categoryName}
                  </span>
                  {p.conditionName && (
                    <span className="rounded-full border border-[#d8cdb6] px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#6f6758] dark:border-[#302c24] dark:text-[#a8a093]">
                      {p.conditionName}
                    </span>
                  )}
                </div>

                {/* Title */}
                <a
                  href={`/products/${p.productId}`}
                  onClick={(e) => onActionClick(e, `/products/${p.productId}`)}
                  className="line-clamp-2 text-[13px] font-bold leading-snug text-[#1f1a12] hover:underline dark:text-[#f7f5ef]"
                >
                  {p.productName}
                </a>
              </div>

              {/* Price & CTA Button */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-[#1f1a12] dark:text-[#f7f5ef]">
                    ₹{p.price.toLocaleString("en-IN")}
                  </p>
                </div>

                <a
                  href={`/products/${p.productId}`}
                  onClick={(e) => onActionClick(e, `/products/${p.productId}`)}
                  className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-[#1f1a12] px-3.5 py-1.5 text-[11px] font-bold text-[#f7f5ef] shadow-xs transition-colors hover:bg-[#3b3223] dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#e8cba5]"
                >
                  <span>View details</span>
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
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination / Expand Button */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#d8cdb6] bg-white py-2 text-[12px] font-bold text-[#1f1a12] shadow-xs transition hover:bg-[#f7f5ef] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#d6b46a] dark:hover:bg-[#201c16]"
        >
          {isExpanded ? (
            <>
              Show fewer products
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              Show more products (+{products.length - INITIAL_LIMIT} more)
              <ChevronDown size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

const BOOKING_BLOCK_REGEX =
  /(?:(?:✅|🎉)?\s*\*\*Repair Request Booked Successfully!\*\*\s*)?(?:📋\s*)?\*\*Booking Summary:\*\*[\s\r\n]*(?:[•*-]\s*\*?[*]?[^*:\n]+?\*?[*]?\s*:[^\n]+[\s\r\n]*)+/i;
const ENQUIRY_BLOCK_REGEX =
  /(?:(?:✅|🎉)?\s*\*\*Enquiry Submitted Successfully!\*\*\s*)?(?:📋\s*)?\*\*Enquiry Summary:\*\*[\s\r\n]*(?:[•*-]\s*\*?[*]?[^*:\n]+?\*?[*]?\s*:[^\n]+[\s\r\n]*)+/i;

interface ParsedBookingSummary {
  trackingNumber: string;
  customer?: string;
  device?: string;
  issue?: string;
  serviceType?: string;
  status?: string;
}

interface ParsedEnquirySummary {
  product?: string;
  customer?: string;
  phone?: string;
  message?: string;
  status?: string;
}

function extractBookingSummary(
  content: string
): { before: string; summary: ParsedBookingSummary; after: string } | null {
  const match = content.match(BOOKING_BLOCK_REGEX);
  if (!match) return null;

  const fullMatchedText = match[0];
  const splitIndex = content.indexOf(fullMatchedText);
  const before = content.slice(0, splitIndex).trim();
  const after = content.slice(splitIndex + fullMatchedText.length).trim();

  const getField = (name: string) => {
    const m = fullMatchedText.match(
      new RegExp(
        `[•*-]?\\s*\\*?\\*?${name}\\*?\\*?\\s*:\\s*` + "`?([^`\\n]+)`?",
        "i"
      )
    );
    return m ? m[1].trim() : undefined;
  };

  const trackingNumber = getField("Tracking Number");
  if (!trackingNumber) return null;

  return {
    before,
    after,
    summary: {
      trackingNumber,
      customer: getField("Customer"),
      device: getField("Device"),
      issue: getField("Issue"),
      serviceType: getField("Service Type"),
      status: getField("Status") || "Received — Technician assigned shortly."
    }
  };
}

function extractEnquirySummary(
  content: string
): { before: string; summary: ParsedEnquirySummary; after: string } | null {
  const match = content.match(ENQUIRY_BLOCK_REGEX);
  if (!match) return null;

  const fullMatchedText = match[0];
  const splitIndex = content.indexOf(fullMatchedText);
  const before = content.slice(0, splitIndex).trim();
  const after = content.slice(splitIndex + fullMatchedText.length).trim();

  const getField = (name: string) => {
    const m = fullMatchedText.match(
      new RegExp(
        `[•*-]?\\s*\\*?\\*?${name}\\*?\\*?\\s*:\\s*` + "`?([^`\\n]+)`?",
        "i"
      )
    );
    return m ? m[1].trim() : undefined;
  };

  return {
    before,
    after,
    summary: {
      product: getField("Product"),
      customer: getField("Customer"),
      phone: getField("Phone"),
      message: getField("Message"),
      status:
        getField("Status") || "Received — Our team will contact you shortly."
    }
  };
}

const TRACKING_BLOCK_REGEX =
  /(?:(?:📋|🔍|✅)\s*)?\*\*Repair Status Summary:\*\*[\s\r\n]*(?:(?:[•*-]|\s{2,})?\s*\*?[*]?[^*:\n]+?\*?[*]?\s*:[^\n]+[\s\r\n]*)+/i;

interface ParsedTrackingSummary {
  trackingNumber: string;
  device?: string;
  status?: string;
  estimatedPrice?: string;
  serviceType?: string;
}

function extractTrackingSummary(
  content: string
): { before: string; summary: ParsedTrackingSummary; after: string } | null {
  if (BOOKING_BLOCK_REGEX.test(content) || ENQUIRY_BLOCK_REGEX.test(content)) {
    return null;
  }

  // 1. Structured block format
  const blockMatch = content.match(TRACKING_BLOCK_REGEX);
  if (blockMatch) {
    const fullMatchedText = blockMatch[0];
    const splitIndex = content.indexOf(fullMatchedText);
    const before = content.slice(0, splitIndex).trim();
    const after = content.slice(splitIndex + fullMatchedText.length).trim();

    const getField = (name: string) => {
      const m = fullMatchedText.match(
        new RegExp(
          `(?:[•*-]|\\s{2,})?\\s*\\*?\\*?${name}\\*?\\*?\\s*:\\s*` +
            "`?([^`\\n]+)`?",
          "i"
        )
      );
      return m ? m[1].trim() : undefined;
    };

    const trackingNumber = getField("Tracking Number");
    if (trackingNumber) {
      return {
        before,
        after,
        summary: {
          trackingNumber,
          device: getField("Device"),
          status: getField("Status") || "Pending",
          estimatedPrice:
            getField("Estimated Cost") ||
            getField("Estimated Price") ||
            getField("Pricing") ||
            "Pending Assessment",
          serviceType: getField("Service Type") || "Shop Repair"
        }
      };
    }
  }

  // 2. Natural language tracking sentence (e.g. from chat history)
  const trackingNumMatch = content.match(
    /#?(TE-\d{4}-(?:[A-F0-9]{32}|\d{3,10}))/i
  );
  if (trackingNumMatch) {
    const trackingNumber = trackingNumMatch[1].toUpperCase();
    const isTrackingIntent =
      content.toLowerCase().includes("your repair") ||
      content.toLowerCase().includes("repair #") ||
      content.toLowerCase().includes("repair request") ||
      content.toLowerCase().includes("is pending") ||
      content.toLowerCase().includes("is accepted") ||
      content.toLowerCase().includes("is in progress") ||
      content.toLowerCase().includes("has been completed") ||
      content.toLowerCase().includes("technician is being assigned");

    if (isTrackingIntent) {
      const deviceMatch = content.match(
        /for\s+(?:the\s+)?([^.]+?)\s+is\s+\*?\*?([A-Za-z\s]+?)\*?\*?(?:\s*–|\s*-|\.|\n|,)/i
      );
      const device = deviceMatch ? deviceMatch[1].trim() : undefined;
      const statusFromDeviceMatch = deviceMatch
        ? deviceMatch[2].trim()
        : undefined;

      const statusMatch = content.match(
        /\b(is\s+)?\*?\*?(Pending|Accepted|Under Inspection|In Progress|Assigned|Diagnosis|Ready|Completed|Delivered|Cancelled)\*?\*?\b/i
      );
      const status =
        statusFromDeviceMatch ||
        (statusMatch ? statusMatch[2].trim() : "Pending");

      const priceMatch = content.match(/₹\s*(\d[\d,]*)/);
      let estimatedPrice = "Pending Assessment";
      if (priceMatch) {
        estimatedPrice = `₹${priceMatch[1]}`;
      } else if (
        content.toLowerCase().includes("estimated cost will be confirmed") ||
        content.toLowerCase().includes("quote before any work")
      ) {
        estimatedPrice = "Quote after initial inspection";
      }

      const serviceType = content.toLowerCase().includes("home visit")
        ? "Home Visit"
        : "Shop Repair";

      return {
        before: content.trim(),
        after: "",
        summary: {
          trackingNumber,
          device,
          status,
          estimatedPrice,
          serviceType
        }
      };
    }
  }

  return null;
}

function bookingSecondsRemaining(expiresAt: string, now: number): number {
  const deadline = Date.parse(expiresAt);
  return Number.isFinite(deadline)
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : 0;
}

function BookingDraftCountdown({
  expiresAt,
  onExpire
}: {
  expiresAt: string;
  onExpire: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const seconds = bookingSecondsRemaining(expiresAt, now);
  useEffect(() => {
    let notified = false;
    function tick() {
      const current = Date.now();
      setNow(current);
      if (bookingSecondsRemaining(expiresAt, current) === 0) {
        window.clearInterval(timer);
        if (!notified) {
          notified = true;
          onExpire();
        }
      }
    }
    const timer = window.setInterval(tick, 1000);
    tick();
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [expiresAt, onExpire]);
  const label =
    Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    (seconds % 60).toString().padStart(2, "0");
  return (
    <>
      <span
        role="timer"
        aria-live="off"
        aria-label="Time left to confirm this booking"
        className={
          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums " +
          (seconds <= 60
            ? "border-amber-400/40 bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
            : "border-[#d8cdb6] bg-[#f7f2e8] text-[#71634c] dark:border-[#3a3428] dark:bg-[#292319] dark:text-[#cdbb96]")
        }
      >
        <Clock size={11} aria-hidden="true" />
        {seconds > 0 ? label + " left to confirm" : "Summary expired"}
      </span>
      {seconds === 0 && (
        <span role="status" className="sr-only">
          This booking summary has expired. Ask for a new summary to confirm
          your repair.
        </span>
      )}
    </>
  );
}

function BookingConfirmationCard({
  summary,
  onTrackClick
}: {
  summary: ParsedBookingSummary;
  onTrackClick?: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary.trackingNumber) return;
    void navigator.clipboard.writeText(summary.trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="my-2.5 w-full overflow-hidden rounded-xl border border-[#d8cdb6]/90 bg-[#fbf9f4] text-left shadow-xs transition-all dark:border-[#352f23] dark:bg-[#15120c]">
      {/* Top Gold Gradient Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d6b46a] to-transparent" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#e8dfcf] px-3.5 py-2.5 dark:border-[#262118]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="truncate text-[11px] font-bold uppercase tracking-wider text-[#6b5839] dark:text-[#d6b46a]">
            Repair Ticket Confirmed
          </span>
        </div>
        <span className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-[#8a7f6c] dark:text-[#8e8574]">
          Santacruz Workshop
        </span>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Tracking Number Stub */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#ded5c2] bg-white px-3.5 py-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] dark:border-[#2d271e] dark:bg-[#1d1812]">
          <div className="min-w-0">
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#857964] dark:text-[#a89d87]">
              Official Tracking ID
            </p>
            <p className="font-mono text-[16px] sm:text-[17px] font-black tracking-wider text-[#1a160f] dark:text-[#f8f5ee] truncate select-all mt-0.5">
              {summary.trackingNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#d8cdb6] bg-[#faf7f0] px-2.5 py-1 text-[11px] font-semibold text-[#1f1a12] transition-colors hover:border-[#8a6624] hover:bg-white dark:border-[#383125] dark:bg-[#251f17] dark:text-[#ded8cb] dark:hover:border-[#d6b46a] dark:hover:bg-[#2f271d] cursor-pointer"
          >
            {copied ? (
              <>
                <Check
                  size={12}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <span className="text-emerald-700 dark:text-emerald-300">
                  Copied
                </span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Specification Table */}
        <div className="divide-y divide-[#ebe3d3] rounded-lg border border-[#ded5c2] bg-white/70 px-3.5 dark:divide-[#272118] dark:border-[#2d271e] dark:bg-[#18140e]/90 text-xs">
          {summary.device && (
            <div className="flex items-center justify-between py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                Device
              </span>
              <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8] text-right truncate max-w-[65%]">
                {summary.device}
              </span>
            </div>
          )}
          {summary.serviceType && (
            <div className="flex items-center justify-between py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                Service Type
              </span>
              <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8]">
                {summary.serviceType}
              </span>
            </div>
          )}
          {summary.customer && (
            <div className="flex items-center justify-between py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                Customer
              </span>
              <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8] truncate max-w-[65%]">
                {summary.customer}
              </span>
            </div>
          )}
          {summary.issue && (
            <div className="flex items-start justify-between py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482] shrink-0 pt-0.5">
                Reported Issue
              </span>
              <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8] text-right max-w-[65%] leading-snug">
                {summary.issue}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {onTrackClick && (
          <button
            type="button"
            onClick={() =>
              onTrackClick(
                `/track-request?requestNumber=${encodeURIComponent(summary.trackingNumber)}`
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f1a12] py-2.5 px-3 text-[12px] font-bold text-white shadow-xs transition-all hover:bg-[#382f21] active:scale-[0.99] dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#dfc383] cursor-pointer"
          >
            <Search size={13} strokeWidth={2.5} />
            <span>Track Repair Live Status</span>
          </button>
        )}
      </div>
    </div>
  );
}

function EnquiryConfirmationCard({
  summary
}: {
  summary: ParsedEnquirySummary;
}) {
  return (
    <div className="my-2.5 w-full overflow-hidden rounded-xl border border-[#d8cdb6]/90 bg-[#fbf9f4] text-left shadow-xs transition-all dark:border-[#352f23] dark:bg-[#15120c]">
      {/* Top Gold Gradient Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d6b46a] to-transparent" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#e8dfcf] px-3.5 py-2.5 dark:border-[#262118]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
          <span className="truncate text-[11px] font-bold uppercase tracking-wider text-[#6b5839] dark:text-[#d6b46a]">
            Enquiry Recorded
          </span>
        </div>
        <span className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-[#8a7f6c] dark:text-[#8e8574]">
          Workshop Notified
        </span>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Product Box */}
        {summary.product && (
          <div className="rounded-lg border border-[#ded5c2] bg-white px-3.5 py-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] dark:border-[#2d271e] dark:bg-[#1d1812]">
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#857964] dark:text-[#a89d87]">
              Product / Inquiry Item
            </p>
            <p className="text-[14px] font-bold text-[#1a160f] dark:text-[#f8f5ee] mt-0.5 truncate">
              {summary.product}
            </p>
          </div>
        )}

        {/* Specification Table */}
        <div className="divide-y divide-[#ebe3d3] rounded-lg border border-[#ded5c2] bg-white/70 px-3.5 dark:divide-[#272118] dark:border-[#2d271e] dark:bg-[#18140e]/90 text-xs">
          {summary.customer && (
            <div className="flex items-center justify-between py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                Customer
              </span>
              <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8] truncate max-w-[65%]">
                {summary.customer}
              </span>
            </div>
          )}
          {summary.phone && (
            <div className="flex items-center justify-between py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                Contact
              </span>
              <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8]">
                {summary.phone}
              </span>
            </div>
          )}
          {summary.message && (
            <div className="flex items-start justify-between py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482] shrink-0 pt-0.5">
                Note / Offer
              </span>
              <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8] text-right max-w-[65%] leading-snug">
                {summary.message}
              </span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-[#786d5b] dark:text-[#9c917f] italic pt-0.5">
          Our workshop technician in Santacruz West will follow up with you
          shortly.
        </p>
      </div>
    </div>
  );
}

function InlineFormattedText({ text, role }: { text: string; role: string }) {
  const parts = useMemo(() => text.split(URL_PATTERN), [text]);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//i.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={
              role === "user"
                ? "font-semibold underline underline-offset-2 text-white decoration-white/60 hover:decoration-white dark:text-[#11110f] dark:decoration-[#11110f]/50 dark:hover:decoration-[#11110f]"
                : "font-semibold underline underline-offset-2 text-[#8a6624] decoration-[#8a6624]/50 hover:decoration-[#8a6624] dark:text-[#d6b46a] dark:decoration-[#d6b46a]/50 dark:hover:decoration-[#d6b46a]"
            }
          >
            {part}
          </a>
        ) : (
          <FormattedText key={i} text={part} />
        )
      )}
    </>
  );
}

function splitMarkdownTableRow(line: string): string[] {
  const value = line.trim();
  const cells: string[] = [];
  let cell = "";
  let codeTicks = 0;
  for (let index = 0; index < value.length; index++) {
    const character = value[index];
    if (character === "\\" && value[index + 1] === "|") {
      cell += "|";
      index++;
      continue;
    }
    if (character === "`") {
      let count = 1;
      while (value[index + count] === "`") count++;
      if (codeTicks === 0) codeTicks = count;
      else if (codeTicks === count) codeTicks = 0;
      cell += "`".repeat(count);
      index += count - 1;
      continue;
    }
    if (character === "|" && codeTicks === 0) {
      cells.push(cell.trim());
      cell = "";
    } else cell += character;
  }
  cells.push(cell.trim());
  if (value.startsWith("|")) cells.shift();
  if (value.endsWith("|") && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

function parseMarkdownTable(lines: string[], start: number) {
  if (!lines[start]?.includes("|") || !lines[start + 1]) return null;
  const headers = splitMarkdownTableRow(lines[start]);
  const separators = splitMarkdownTableRow(lines[start + 1]);
  if (
    !headers.length ||
    headers.length !== separators.length ||
    !separators.every((cell) => /^:?-{3,}:?$/.test(cell))
  )
    return null;
  const alignments = separators.map((cell) =>
    cell.startsWith(":") && cell.endsWith(":")
      ? ("center" as const)
      : cell.endsWith(":")
        ? ("right" as const)
        : ("left" as const)
  );
  const rows: string[][] = [];
  let endIndex = start + 2;
  while (
    endIndex < lines.length &&
    lines[endIndex].trim() &&
    lines[endIndex].includes("|")
  ) {
    const cells = splitMarkdownTableRow(lines[endIndex]);
    // Keep incomplete streaming rows visible as text until the next chunk arrives.
    if (cells.length !== headers.length) break;
    rows.push(cells);
    endIndex++;
  }
  return { headers, alignments, rows, endIndex };
}

function isMarkdownDivider(line: string): boolean {
  return /^([-*_])(?:\s*\1){2,}$/.test(line.trim());
}

function FormattedBlock({
  text,
  role,
  isStreaming
}: {
  text: string;
  role: string;
  isStreaming?: boolean;
}) {
  const lines = useMemo(() => text.replace(/\r\n/g, "\n").split("\n"), [text]);
  const blocks: {
    line: string;
    idx: number;
    table: ReturnType<typeof parseMarkdownTable>;
    code?: string;
  }[] = [];
  for (let idx = 0; idx < lines.length;) {
    if (lines[idx].trim().startsWith("```")) {
      const start = idx++;
      const code: string[] = [];
      while (idx < lines.length && !lines[idx].trim().startsWith("```")) {
        code.push(lines[idx++]);
      }
      if (idx < lines.length) idx++;
      blocks.push({
        line: lines[start],
        idx: start,
        table: null,
        code: code.join("\n")
      });
      continue;
    }
    const table = parseMarkdownTable(lines, idx);
    blocks.push({ line: lines[idx], idx, table });
    idx = table?.endIndex ?? idx + 1;
  }

  return (
    <div className="space-y-1.5 leading-relaxed text-[13.5px] sm:text-[14px]">
      {blocks.map(({ line, idx, table, code }) => {
        if (code !== undefined)
          return (
            <pre
              key={idx}
              className="my-2 max-w-full overflow-x-auto rounded-lg bg-[#f3eee3] p-3 font-mono text-xs dark:bg-[#11110f]"
            >
              <code>{code}</code>
            </pre>
          );
        if (table) {
          return (
            <div key={idx} className="min-w-0">
              <div
                tabIndex={0}
                role="region"
                aria-label="Assistant response table"
                className="my-2 max-w-full overflow-x-auto rounded-lg border border-[#d8cdb6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a4803e] dark:border-[#3a3428]"
              >
                <table className="w-full border-collapse text-left text-xs leading-5">
                  <caption className="sr-only">
                    Assistant response table
                  </caption>
                  <thead className="bg-[#f2eadb] text-[#5f491f] dark:bg-[#292319] dark:text-[#e5c680]">
                    <tr>
                      {table.headers.map((cell, column) => (
                        <th
                          key={column}
                          scope="col"
                          style={{ textAlign: table.alignments[column] }}
                          className="min-w-20 border-b border-[#d8cdb6] px-3 py-2.5 font-semibold [overflow-wrap:anywhere] dark:border-[#3a3428]"
                        >
                          <InlineFormattedText text={cell} role={role} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8dfce] dark:divide-[#302c24]">
                    {table.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="even:bg-[#f7f2e8] dark:even:bg-[#211d16]"
                      >
                        {row.map((cell, column) => (
                          <td
                            key={column}
                            style={{ textAlign: table.alignments[column] }}
                            className="min-w-20 px-3 py-2.5 align-top [overflow-wrap:anywhere]"
                          >
                            <InlineFormattedText text={cell} role={role} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isStreaming && table.endIndex === lines.length && (
                <span
                  aria-hidden="true"
                  className="inline-block h-3.5 w-1.5 rounded-xs bg-[#8a6624] align-middle motion-safe:animate-pulse dark:bg-[#d6b46a]"
                />
              )}
            </div>
          );
        }
        const trimmed = line.trim();
        const isLastLine = idx === lines.length - 1;

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }
        if (isMarkdownDivider(trimmed)) {
          return (
            <hr
              key={idx}
              className="my-3 border-0 border-t border-[#d8cdb6] dark:border-[#3a3428]"
            />
          );
        }

        // Headings: ### or ##
        if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
          const headingText = trimmed.replace(/^#+\s*/, "");
          return (
            <p
              key={idx}
              className="mt-2.5 mb-1 text-[14px] font-black tracking-tight text-[#1f1a12] dark:text-[#f7f5ef]"
            >
              <InlineFormattedText text={headingText} role={role} />
            </p>
          );
        }

        // Bullet point lines: • or - or *
        if (
          trimmed.startsWith("• ") ||
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ")
        ) {
          const bulletContent = trimmed.slice(2);
          return (
            <div
              key={idx}
              className="flex items-start gap-2 my-0.5 pl-1 text-left"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a6624] dark:bg-[#d6b46a]" />
              <div className="flex-1 min-w-0">
                <InlineFormattedText text={bulletContent} role={role} />
                {isStreaming && isLastLine && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-3.5 w-1.5 ml-1 rounded-xs bg-[#8a6624] dark:bg-[#d6b46a] animate-pulse align-middle"
                  />
                )}
              </div>
            </div>
          );
        }

        // Numbered list items
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2 my-0.5 pl-1 text-left"
            >
              <span className="shrink-0 text-xs font-black text-[#8a6624] dark:text-[#d6b46a] mt-0.5">
                {numMatch[1]}.
              </span>
              <div className="flex-1 min-w-0">
                <InlineFormattedText text={numMatch[2]} role={role} />
                {isStreaming && isLastLine && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-3.5 w-1.5 ml-1 rounded-xs bg-[#8a6624] dark:bg-[#d6b46a] animate-pulse align-middle"
                  />
                )}
              </div>
            </div>
          );
        }

        return (
          <p key={idx} className="break-words text-left">
            <InlineFormattedText text={line} role={role} />
            {isStreaming && isLastLine && (
              <span
                aria-hidden="true"
                className="inline-block h-3.5 w-1.5 ml-1 rounded-xs bg-[#8a6624] dark:bg-[#d6b46a] animate-pulse align-middle"
              />
            )}
          </p>
        );
      })}
    </div>
  );
}

function RepairTrackingCard({
  summary,
  beforeText,
  afterText,
  isStreaming,
  onTrackClick,
  tracking
}: {
  tracking?: TrackServiceRequestResult;
  summary: ParsedTrackingSummary;
  beforeText?: string;
  afterText?: string;
  isStreaming?: boolean;
  onTrackClick?: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [liveData, setLiveData] = useState<{
    status?: string;
    estimatedPrice?: string;
    device?: string;
    serviceType?: string;
  }>({});

  const handleLiveUpdate = useCallback((updated: TrackServiceRequestResult) => {
    setLiveData({
      status: updated.currentStatus,
      estimatedPrice:
        updated.finalPrice != null
          ? `₹${updated.finalPrice.toLocaleString("en-IN")}`
          : updated.estimatedPrice != null
            ? `₹${updated.estimatedPrice.toLocaleString("en-IN")}`
            : undefined,
      device: updated.deviceName,
      serviceType: updated.serviceType
    });
  }, []);

  const { isLiveConnected } = useRepairTrackingSignalR(
    tracking?.requestNumber?.toUpperCase() ===
      summary.trackingNumber?.toUpperCase()
      ? tracking.requestNumber
      : null,
    handleLiveUpdate,
    tracking?.trackingToken,
    tracking?.phoneNumber
  );

  const displayStatus = liveData.status || summary.status || "Pending";
  const displayDevice = liveData.device || summary.device;
  const displayPrice =
    liveData.estimatedPrice || summary.estimatedPrice || "Pending Assessment";
  const displayServiceType =
    liveData.serviceType || summary.serviceType || "Shop Repair";

  const handleCopy = () => {
    if (!summary.trackingNumber) return;
    void navigator.clipboard.writeText(summary.trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusLower = displayStatus.toLowerCase();
  const isCompleted =
    statusLower.includes("completed") ||
    statusLower.includes("ready") ||
    statusLower.includes("delivered");
  const isInProgress =
    statusLower.includes("progress") ||
    statusLower.includes("diagnosis") ||
    statusLower.includes("under inspection");
  const isAccepted =
    statusLower.includes("accepted") || statusLower.includes("assigned");
  const isCancelled = statusLower.includes("cancel");

  // Synchronize introductory status text so live updates and the card remain 100% in agreement
  const adjustedBeforeText = useMemo(() => {
    if (!beforeText?.trim()) return null;

    let text = beforeText;

    // Pattern 1: (is currently / is) [STATUS] -> sync to displayStatus
    text = text.replace(
      /(\bis\s+(?:currently\s+)?)\*?\*?(?:Pending|Accepted|Under Inspection|In Progress|Assigned|Diagnosis|Ready|Completed|Delivered|Cancelled)\*?\*?/gi,
      `$1**${displayStatus}**`
    );

    // Pattern 2: (repair has been) [STATUS] -> sync to displayStatus
    text = text.replace(
      /(repair\s+has\s+been\s+)\*?\*?(?:completed|accepted|delivered|approved|cancelled)\*?\*?/gi,
      (_, prefix) => `${prefix}**${displayStatus.toLowerCase()}**`
    );

    return text;
  }, [beforeText, displayStatus]);

  return (
    <div className="w-full">
      {adjustedBeforeText && (
        <div className="mb-2">
          <FormattedBlock text={adjustedBeforeText} role="assistant" />
        </div>
      )}

      <div className="my-2.5 w-full overflow-hidden rounded-xl border border-[#d8cdb6]/90 bg-[#fbf9f4] text-left shadow-xs transition-all dark:border-[#352f23] dark:bg-[#15120c]">
        {/* Top Gold Gradient Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d6b46a] to-transparent" />

        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-[#e8dfcf] px-3.5 py-2.5 dark:border-[#262118]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                  isCompleted
                    ? "bg-emerald-400"
                    : isInProgress
                      ? "bg-blue-400"
                      : isAccepted
                        ? "bg-sky-400"
                        : isCancelled
                          ? "bg-rose-400"
                          : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isCompleted
                    ? "bg-emerald-500"
                    : isInProgress
                      ? "bg-blue-500"
                      : isAccepted
                        ? "bg-sky-500"
                        : isCancelled
                          ? "bg-rose-500"
                          : "bg-amber-500"
                }`}
              />
            </span>
            <span className="truncate text-[11px] font-bold uppercase tracking-wider text-[#6b5839] dark:text-[#d6b46a]">
              Repair Status: {displayStatus}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {isLiveConnected && (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            )}
            <span
              className={`${
                isLiveConnected ? "hidden sm:inline" : ""
              } whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-[#8a7f6c] dark:text-[#8e8574]`}
            >
              Santacruz Workshop
            </span>
          </div>
        </div>

        <div className="p-3.5 space-y-3">
          {/* Tracking Number Stub */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#ded5c2] bg-white px-3.5 py-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] dark:border-[#2d271e] dark:bg-[#1d1812]">
            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#857964] dark:text-[#a89d87]">
                Official Tracking ID
              </p>
              <p className="font-mono text-[16px] sm:text-[17px] font-black tracking-wider text-[#1a160f] dark:text-[#f8f5ee] truncate select-all mt-0.5">
                {summary.trackingNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#d8cdb6] bg-[#faf7f0] px-2.5 py-1 text-[11px] font-semibold text-[#1f1a12] transition-colors hover:border-[#8a6624] hover:bg-white dark:border-[#383125] dark:bg-[#251f17] dark:text-[#ded8cb] dark:hover:border-[#d6b46a] dark:hover:bg-[#2f271d] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check
                    size={12}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    Copied
                  </span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Specification Table */}
          <div className="divide-y divide-[#ebe3d3] rounded-lg border border-[#ded5c2] bg-white/70 px-3.5 dark:divide-[#272118] dark:border-[#2d271e] dark:bg-[#18140e]/90 text-xs">
            {displayDevice && (
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                  Device
                </span>
                <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8] text-right truncate max-w-[65%]">
                  {displayDevice}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                Current Status
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isCompleted
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : isInProgress
                      ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                      : isAccepted
                        ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/20"
                        : isCancelled
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {displayStatus}
              </span>
            </div>
            {displayPrice && (
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                  Estimated Pricing
                </span>
                <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8]">
                  {displayPrice}
                </span>
              </div>
            )}
            {displayServiceType && (
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#857964] dark:text-[#9e9482]">
                  Service Mode
                </span>
                <span className="font-semibold text-[#1a160f] dark:text-[#f0ebd8]">
                  {displayServiceType}
                </span>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          {onTrackClick && (
            <button
              type="button"
              onClick={() =>
                onTrackClick(
                  `/track-request?requestNumber=${encodeURIComponent(summary.trackingNumber)}`
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f1a12] py-2.5 px-3 text-[12px] font-bold text-white shadow-xs transition-all hover:bg-[#382f21] active:scale-[0.99] dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#dfc383] cursor-pointer"
            >
              <Search size={13} strokeWidth={2.5} />
              <span>Track Live Details</span>
            </button>
          )}
        </div>
      </div>

      {afterText && (
        <div className="mt-2">
          <FormattedBlock
            text={afterText}
            role="assistant"
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}

function MessageBody({
  content,
  role,
  isStreaming,
  onActionClick,
  tracking: verifiedTracking
}: {
  tracking?: TrackServiceRequestResult;
  content: string;
  role: string;
  isStreaming?: boolean;
  onActionClick?: (url: string) => void;
}) {
  if (role === "user") {
    return (
      <span className="whitespace-pre-wrap break-words leading-relaxed">
        <InlineFormattedText text={content} role="user" />
      </span>
    );
  }

  // Assistant message: Check for booking summary
  const booking = extractBookingSummary(content);
  if (booking) {
    return (
      <div className="w-full">
        {booking.before && (
          <div className="mb-2">
            <FormattedBlock text={booking.before} role="assistant" />
          </div>
        )}
        <BookingConfirmationCard
          summary={booking.summary}
          onTrackClick={onActionClick}
        />
        {booking.after && (
          <div className="mt-2">
            <FormattedBlock
              text={booking.after}
              role="assistant"
              isStreaming={isStreaming}
            />
          </div>
        )}
      </div>
    );
  }

  // Assistant message: Check for tracking summary
  const tracking = extractTrackingSummary(content);
  if (tracking) {
    return (
      <div className="w-full">
        <RepairTrackingCard
          summary={tracking.summary}
          tracking={verifiedTracking}
          beforeText={tracking.before}
          afterText={tracking.after}
          isStreaming={isStreaming}
          onTrackClick={onActionClick}
        />
      </div>
    );
  }

  // Assistant message: Check for enquiry summary
  const enquiry = extractEnquirySummary(content);
  if (enquiry) {
    return (
      <div className="w-full">
        {enquiry.before && (
          <div className="mb-2">
            <FormattedBlock text={enquiry.before} role="assistant" />
          </div>
        )}
        <EnquiryConfirmationCard summary={enquiry.summary} />
        {enquiry.after && (
          <div className="mt-2">
            <FormattedBlock
              text={enquiry.after}
              role="assistant"
              isStreaming={isStreaming}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <FormattedBlock text={content} role="assistant" isStreaming={isStreaming} />
  );
}

// A validated booking draft owns the review UI, including its single confirm button.
// Keep generated prose in chat history, but do not show a second written review above it.
function shouldShowMessageText(message: ChatMessage): boolean {
  return (
    !message.bookingDraft &&
    Boolean(
      message.content?.trim() ||
      (!message.products?.length && !message.actions?.length)
    )
  );
}

export default function ChatWidget() {
  const navigate = useNavigate();
  const location = useLocation();

  // Stable session UUID for this browser tab/session — persisted across reloads, sent to backend for chat logging
  const [sessionKey, setSessionKey] = useState<string>(() => {
    try {
      const existing =
        localStorage.getItem("te_chat_session_key") ||
        sessionStorage.getItem("te_chat_session_key");
      if (existing) {
        localStorage.setItem("te_chat_session_key", existing);
        sessionStorage.setItem("te_chat_session_key", existing);
        return existing;
      }
      const newKey = crypto.randomUUID();
      localStorage.setItem("te_chat_session_key", newKey);
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

  const currentSuggestions = useMemo(
    () => getContextualSuggestions(location.pathname),
    [location.pathname]
  );

  // Default to full sidebar on desktop, small widget on mobile
  const [isSidebar, setIsSidebar] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("te_chat_sidebar") === "true";
    } catch {
      return false;
    }
  });

  // Mobile sheet height: "compact" (60dvh) vs "expanded" (95dvh)
  const [mobileHeight, setMobileHeight] = useState<"compact" | "expanded">(
    () => {
      try {
        const saved = sessionStorage.getItem("te_chat_mobile_height");
        return saved === "compact" ? "compact" : "expanded";
      } catch {
        return "expanded";
      }
    }
  );

  const toggleMobileHeight = useCallback(() => {
    setMobileHeight((prev) => {
      const next = prev === "compact" ? "expanded" : "compact";
      try {
        sessionStorage.setItem("te_chat_mobile_height", next);
      } catch {}
      return next;
    });
  }, []);

  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);
  const isDraggingHandleRef = useRef<boolean>(false);
  const wasDraggedRef = useRef<boolean>(false);

  const handleHandleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaYRef.current = 0;
    isDraggingHandleRef.current = true;
    wasDraggedRef.current = false;
    startHeightRef.current = panelRef.current
      ? panelRef.current.getBoundingClientRect().height
      : window.innerHeight * (mobileHeight === "compact" ? 0.6 : 0.95);

    if (panelRef.current) {
      panelRef.current.style.transition = "none";
    }
  };

  const handleHandleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingHandleRef.current || touchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    touchDeltaYRef.current = deltaY;

    if (Math.abs(deltaY) > 8) {
      wasDraggedRef.current = true;
    }

    if (panelRef.current) {
      // Pulling up (deltaY < 0) expands height; pulling down (deltaY > 0) shrinks height
      const targetHeight = startHeightRef.current - deltaY;
      const minHeight = window.innerHeight * 0.4;
      const maxHeight = window.innerHeight * 0.96;
      const clampedHeight = Math.max(
        minHeight,
        Math.min(maxHeight, targetHeight)
      );
      panelRef.current.style.height = `${clampedHeight}px`;
    }
  };

  const handleHandleTouchEnd = () => {
    if (!isDraggingHandleRef.current) return;
    isDraggingHandleRef.current = false;
    const deltaY = touchDeltaYRef.current;
    touchStartYRef.current = null;
    touchDeltaYRef.current = 0;

    const currentH = panelRef.current
      ? panelRef.current.getBoundingClientRect().height
      : startHeightRef.current;
    const midpoint = window.innerHeight * 0.77;

    if (panelRef.current) {
      panelRef.current.style.transition =
        "height 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      panelRef.current.style.height = "";
    }

    if (wasDraggedRef.current) {
      if (deltaY < -40 || currentH > midpoint) {
        // Dragged up -> snap and stay expanded
        setMobileHeight("expanded");
        try {
          sessionStorage.setItem("te_chat_mobile_height", "expanded");
        } catch {}
      } else if (currentH < window.innerHeight * 0.45) {
        // Dragged down far -> close
        setIsOpen(false);
      } else {
        // Dragged down -> snap to compact
        setMobileHeight("compact");
        try {
          sessionStorage.setItem("te_chat_mobile_height", "compact");
        } catch {}
      }
    }
  };

  const handleHandleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (wasDraggedRef.current) {
      wasDraggedRef.current = false;
      return;
    }
    toggleMobileHeight();
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved =
        localStorage.getItem("te_chat_messages") ||
        sessionStorage.getItem("te_chat_messages");
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

  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

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
      sessionStorage.setItem("te_chat_mobile_height", mobileHeight);
    } catch {}
  }, [mobileHeight]);

  useEffect(() => {
    try {
      const json = JSON.stringify(messages);
      localStorage.setItem("te_chat_messages", json);
      sessionStorage.setItem("te_chat_messages", json);
    } catch {}
  }, [messages]);

  const { isAuthenticated, login } = useCustomAuth();
  type AuthFlowStage = "idle" | "email" | "password" | "submitting";
  const [authFlowStage, setAuthFlowStage] = useState<AuthFlowStage>("idle");
  const [authEmail, setAuthEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const authInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      showAuthPrompt &&
      !isAuthenticated &&
      !getStoredAuthUser() &&
      authFlowStage === "idle"
    ) {
      setAuthFlowStage("email");
    }
  }, [showAuthPrompt, isAuthenticated, authFlowStage]);

  useEffect(() => {
    if (authFlowStage === "email" || authFlowStage === "password") {
      const timer = setTimeout(() => authInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [authFlowStage]);
  const [userMsgCount, setUserMsgCount] = useState<number>(() => {
    try {
      const savedMessages =
        localStorage.getItem("te_chat_messages") ||
        sessionStorage.getItem("te_chat_messages");
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed)) {
          return parsed.filter((m: { role: string }) => m.role === "user")
            .length;
        }
      }
      const savedCount = parseInt(
        sessionStorage.getItem("te_chat_user_count") || "0",
        10
      );
      return Number.isFinite(savedCount) && savedCount >= 0 ? savedCount : 0;
    } catch {
      return 0;
    }
  });

  const pendingMessageRef = useRef<string | null>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [hasNewBelow, setHasNewBelow] = useState(false);

  const [proactivePrompt, setProactivePrompt] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (
      isOpen ||
      location.pathname === "/" ||
      location.pathname.startsWith("/products")
    ) {
      setShowPrompt(false);
      return;
    }
    const timer = setTimeout(() => {
      const path = location.pathname;
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
  }, [isOpen, location.pathname]);

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

  const bookingSubmitRef = useRef(false);
  const [bookingClock, setBookingClock] = useState(Date.now());
  const handleBookingExpiry = useCallback(
    () => setBookingClock(Date.now()),
    []
  );
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setInterval(() => setBookingClock(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  const disableBookingSummaries = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.bookingDraft && !m.bookingState
          ? { ...m, bookingState: "superseded" }
          : m
      )
    );
  }, []);

  const confirmBooking = useCallback(
    async (message: ChatMessage) => {
      const draft = message.bookingDraft;
      if (
        !draft ||
        message.bookingState ||
        bookingSubmitRef.current ||
        isLoading ||
        input.trim() ||
        bookingSecondsRemaining(draft.expiresAt, Date.now()) === 0
      )
        return;
      bookingSubmitRef.current = true;
      setIsLoading(true);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, bookingState: "submitting", bookingError: undefined }
            : m
        )
      );
      try {
        const response = await fetchWithSessionRefresh(
          "/public/chat/booking/confirm",
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionKey, draftId: draft.draftId })
          }
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            response.status === 400
              ? payload.message ||
                  "This summary is no longer available. Send a message to prepare an updated summary."
              : "Booking could not be confirmed. Retry this button; it won't create a second booking."
          );
        }
        const result = (await response.json()) as {
          requestNumber: string;
          status: string;
        };
        const confirmationMessageId = uid();
        setMessages((prev) =>
          prev
            .map((m) =>
              m.id === message.id
                ? {
                    ...m,
                    bookingState: "submitted" as const,
                    bookingError: undefined
                  }
                : m
            )
            .concat({
              id: confirmationMessageId,
              role: "assistant",
              at: Date.now(),
              content: `**Repair booked successfully!**\n\n**Tracking Number**: \`${result.requestNumber}\`\n**Status**: ${result.status || "Pending"}\nKeep this number and your booking phone number to track your repair.`,
              actions: [
                { label: "Track Repair", url: "/track-request", icon: "search" }
              ]
            })
        );
        // The booking is already successful. Verification enables its live card;
        // a tracking outage must never turn this success into a booking failure.
        try {
          const tracking = await trackServiceRequest(
            result.requestNumber,
            draft.details.phoneNumber
          );
          setMessages((prev) =>
            prev.map((m) =>
              m.id === confirmationMessageId ? { ...m, tracking } : m
            )
          );
        } catch {
          /* Keep the confirmed booking and its tracking link available. */
        }
      } catch (error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? {
                  ...m,
                  bookingState: undefined,
                  bookingError:
                    error instanceof Error
                      ? error.message
                      : "Please retry confirmation."
                }
              : m
          )
        );
      } finally {
        bookingSubmitRef.current = false;
        setIsLoading(false);
      }
    },
    [sessionKey, isLoading, input]
  );

  const executeChatMessage = useCallback(
    async (text: string) => {
      const cleanMsg = text.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!cleanMsg || bookingSubmitRef.current) return;
      disableBookingSummaries();

      setLastFailed(null);
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: cleanMsg,
        at: Date.now()
      };
      const assistantMsgId = uid();
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setIsThinking(true);
      setStreamingMessageId(assistantMsgId);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

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

        const response = await fetchWithSessionRefresh("/public/chat/stream", {
          method: "POST",
          headers,
          signal: controller.signal,
          credentials: "include",
          body: JSON.stringify({
            message: cleanMsg,
            includeAccountContext: Boolean(token),
            currentPath: window.location.pathname,
            sessionKey,
            history: [...messages, userMsg]
              .filter((m) => m.role !== "error")
              .slice(-HISTORY_WINDOW - 1, -1)
              .map(({ role, content }) => ({ role, content }))
          })
        });

        if (response.status === 429) {
          throw new Error("RATE_LIMIT_EXCEEDED");
        }

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
                tracking?: TrackServiceRequestResult;
                bookingDraft?: ChatBookingDraft;
              };

              if (evt.type === "token" && evt.content) {
                setIsThinking(false);
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
                      bookingDraft: evt.bookingDraft,
                      tracking: evt.tracking,
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
                            actions: evt.actions ?? m.actions,
                            bookingDraft: evt.bookingDraft ?? m.bookingDraft,
                            tracking: evt.tracking ?? m.tracking
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
      } catch (err: unknown) {
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        const isRateLimit =
          (err instanceof Error && err.message === "RATE_LIMIT_EXCEEDED") ||
          (err instanceof Error && err.message.includes("429"));
        if (!hasAddedAssistantMsg) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "error",
              content: isRateLimit
                ? RATE_LIMIT_ERROR
                : isAbort
                  ? TIMEOUT_ERROR
                  : GENERIC_ERROR,
              at: Date.now()
            }
          ]);
        }
        setLastFailed(cleanMsg);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setIsThinking(false);
        setStreamingMessageId(null);
      }
    },
    [messages, sessionKey]
  );

  const handleSkipAuth = useCallback(() => {
    setShowAuthPrompt(false);
    setAuthFlowStage("idle");
    setAuthEmail("");
    const pending = pendingMessageRef.current;
    if (pending) {
      pendingMessageRef.current = null;
      void executeChatMessage(pending);
    }
  }, [executeChatMessage]);

  const send = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || isLoading) return;

      // --- 1. Conversational Sign-in Flow: Email Stage ---
      if (authFlowStage === "email") {
        if (
          trimmed.toLowerCase() === "skip" ||
          trimmed.toLowerCase() === "no" ||
          trimmed.toLowerCase() === "cancel" ||
          trimmed.toLowerCase() === "close"
        ) {
          handleSkipAuth();
          setInput("");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          // If the user entered a regular sentence/query with spaces and no '@', assume they want to chat/ask a question
          if (!trimmed.includes("@") && trimmed.includes(" ")) {
            setShowAuthPrompt(false);
            setAuthFlowStage("idle");
            setAuthEmail("");
            pendingMessageRef.current = null;
            void executeChatMessage(trimmed);
            return;
          } else {
            setMessages((prev) => [
              ...prev,
              { id: uid(), role: "user", content: trimmed, at: Date.now() },
              {
                id: uid(),
                role: "assistant",
                content:
                  "[ICON_CROSS] That does not appear to be a valid email. Please enter a valid email address (e.g. name@example.com) or click **Skip**:",
                at: Date.now()
              }
            ]);
            setInput("");
            return;
          }
        } else {
          // Email is valid!
          setAuthEmail(trimmed);
          setAuthFlowStage("password");
          setMessages((prev) => [
            ...prev,
            { id: uid(), role: "user", content: trimmed, at: Date.now() },
            {
              id: uid(),
              role: "assistant",
              content:
                "[ICON_LOCK] Thanks! Now please enter your **Password** below to complete sign-in:",
              at: Date.now()
            }
          ]);
          setInput("");
          return;
        }
      }

      // --- 2. Conversational Sign-in Flow: Password Stage ---
      if (authFlowStage === "password") {
        if (
          trimmed.toLowerCase() === "skip" ||
          trimmed.toLowerCase() === "cancel"
        ) {
          handleSkipAuth();
          setInput("");
          return;
        }
        setAuthFlowStage("submitting");
        setIsLoading(true);
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "user", content: "••••••••", at: Date.now() }
        ]);
        setInput("");

        try {
          await login({ email: authEmail, password: trimmed });
          // Success!
          setAuthFlowStage("idle");
          setShowAuthPrompt(false);
          setAuthEmail("");
          const authUser = getStoredAuthUser();
          const firstName = authUser?.fullName
            ? ` ${authUser.fullName.trim().split(" ")[0]}`
            : "";
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: `[ICON_CHECK] **Welcome back${firstName}!** You have successfully signed in. Your repair tickets and chat history are saved. How can I help you today?`,
              at: Date.now()
            }
          ]);
          const pending = pendingMessageRef.current;
          if (pending) {
            pendingMessageRef.current = null;
            void executeChatMessage(pending);
          }
        } catch (err) {
          const errMsg =
            err instanceof Error ? err.message : "Invalid email or password.";
          setAuthFlowStage("password");
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: `[ICON_CROSS] **Sign-in failed**: ${errMsg}\n\nPlease re-enter your password, or click **Skip** to continue as a guest.`,
              at: Date.now()
            }
          ]);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // --- 3. Normal AI Assistant Chat ---
      const cleanMsg = trimmed.slice(0, MAX_MESSAGE_LENGTH);

      // Check if sign-in promotion should trigger on this message:
      const nextCount = userMsgCount + 1;
      setUserMsgCount(nextCount);
      try {
        sessionStorage.setItem("te_chat_user_count", nextCount.toString());
      } catch {}

      const isUnauthenticated = !isAuthenticated && !getStoredAuthUser();
      const shouldTriggerAuth =
        isUnauthenticated && nextCount > 0 && nextCount % 5 === 0;

      if (shouldTriggerAuth) {
        // Hold user's message on hold!
        pendingMessageRef.current = cleanMsg;
        setInput("");
        // Show Quick Action & hold input for email
        setShowAuthPrompt(true);
        setAuthFlowStage("email");
        // DO NOT add userMsg to messages; DO NOT stream yet!
        return;
      }

      void executeChatMessage(cleanMsg);
    },
    [
      isLoading,
      authFlowStage,
      authEmail,
      login,
      handleSkipAuth,
      userMsgCount,
      isAuthenticated,
      executeChatMessage
    ]
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
        
        /* Animations for Chat Widget */
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chat-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes hammer-grid-pulse {
          0%, 100% { opacity: 0.22; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes chat-ping {
          0% { opacity: 0.7; transform: scale(1); }
          70%, 100% { opacity: 0; transform: scale(1.5); }
        }
        .animate-chat-widget {
          animation: chat-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (min-width: 640px) {
          .animate-chat-sidebar {
            animation: chat-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
        @media (prefers-reduced-motion: reduce) {
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
              mobileHeight === "compact"
                ? "inset-x-0 bottom-0 top-auto h-[60dvh] rounded-t-[1.75rem] border-t border-x border-[#d8cdb6] dark:border-[var(--warm-border-dark)] shadow-[0_-16px_50px_rgba(0,0,0,0.35)]"
                : "inset-x-0 bottom-0 top-auto h-[95dvh] rounded-t-[1.75rem] border-t border-x border-[#d8cdb6] dark:border-[var(--warm-border-dark)] shadow-[0_-16px_50px_rgba(0,0,0,0.45)]"
            }
            ${
              isSidebar
                ? "sm:inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:w-[440px] md:w-[480px] lg:w-[520px] sm:rounded-none sm:border-l sm:border-y-0 sm:border-r-0 sm:border-[#d8cdb6] dark:border-[var(--warm-border-dark)] sm:animate-chat-sidebar"
                : "sm:inset-auto sm:bottom-20 sm:right-6 sm:h-[40rem] lg:h-[43rem] sm:w-[27rem] md:w-[30rem] lg:w-[33rem] sm:rounded-2xl sm:border sm:border-[#d8cdb6] dark:border-[var(--warm-border-dark)] sm:shadow-[0_16px_50px_rgba(0,0,0,0.16)] dark:sm:shadow-[0_16px_50px_rgba(0,0,0,0.85)] sm:animate-chat-widget"
            }
          `}
        >
          {/* Mobile Hammer AI Style Horizontal Drag/Resize Handle */}
          <div
            onTouchStart={handleHandleTouchStart}
            onTouchMove={handleHandleTouchMove}
            onTouchEnd={handleHandleTouchEnd}
            onClick={handleHandleClick}
            className="sm:hidden flex items-center justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing touch-none select-none bg-[var(--warm-bg-light)]/95 dark:bg-[var(--warm-bg-dark)]/95 border-b border-[#d8cdb6]/40 dark:border-[var(--warm-border-dark)]/40"
          >
            <div
              aria-label={
                mobileHeight === "expanded"
                  ? "Shrink chat to half screen"
                  : "Expand chat to full screen"
              }
              title={
                mobileHeight === "expanded" ? "Tap to shrink" : "Tap to expand"
              }
              className="flex h-5 w-24 items-center justify-center cursor-pointer"
            >
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  mobileHeight === "expanded"
                    ? "w-12 bg-[#817867]/50 hover:bg-[#8a6624] dark:bg-[#928a7d]/50 dark:hover:bg-[#d6b46a]"
                    : "w-8 bg-[#8a6624] hover:w-12 dark:bg-[#d6b46a]"
                }`}
              />
            </div>
          </div>

          {/* Header */}
          <div className="relative shrink-0 border-b border-[#d8cdb6] bg-[var(--warm-bg-light)]/95 px-4 py-3 backdrop-blur-md dark:border-[var(--warm-border-dark)] dark:bg-[var(--warm-bg-dark)]/95">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#1f1a12] p-0.5 shadow-sm dark:border-[#3a3428] dark:bg-[#161410]">
                <TanishElectronicsLogo className="h-full w-full rounded-lg object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#fffdf7] bg-emerald-500 dark:border-[#161410]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold leading-tight text-[#1f1a12] dark:text-[var(--warm-text-dark)]">
                  Tanish Electronics
                </p>
                <p className="mt-0.5 text-[13px] text-[#817867] dark:text-[var(--warm-muted-dark)]">
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
                    setShowAuthPrompt(false);
                    setAuthFlowStage("idle");
                    setAuthEmail("");
                    setUserMsgCount(0);
                    const newSessionKey = crypto.randomUUID();
                    setSessionKey(newSessionKey);
                    try {
                      localStorage.setItem(
                        "te_chat_messages",
                        JSON.stringify(fresh)
                      );
                      sessionStorage.setItem(
                        "te_chat_messages",
                        JSON.stringify(fresh)
                      );
                      localStorage.setItem(
                        "te_chat_session_key",
                        newSessionKey
                      );
                      sessionStorage.setItem(
                        "te_chat_session_key",
                        newSessionKey
                      );
                      localStorage.removeItem("te_chat_user_count");
                      sessionStorage.removeItem("te_chat_user_count");
                    } catch {}
                  }}
                  aria-label="Restart conversation"
                  title="Restart conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8cdb6]/60 bg-[#fffdf7] text-[#817867] shadow-xs transition hover:border-[#8a6624]/40 hover:bg-[#1f1a12]/5 hover:text-[#1f1a12] focus-visible:outline-none dark:border-[#3a3428] dark:bg-[#161410] dark:text-[#9e9585] dark:hover:text-[#f7f5ef]"
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  onClick={() => setIsSidebar((prev) => !prev)}
                  aria-label={
                    isSidebar ? "Minimize to widget" : "Expand to sidebar"
                  }
                  className="hidden h-8 w-8 items-center justify-center rounded-full border border-[#d8cdb6]/60 bg-[#fffdf7] text-[#817867] shadow-xs transition hover:border-[#8a6624]/40 hover:bg-[#1f1a12]/5 hover:text-[#1f1a12] focus-visible:outline-none sm:flex dark:border-[#3a3428] dark:bg-[#161410] dark:text-[#9e9585] dark:hover:text-[#f7f5ef]"
                >
                  {isSidebar ? (
                    <Minimize2 size={14} />
                  ) : (
                    <Maximize2 size={14} />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    launcherRef.current?.focus();
                  }}
                  aria-label="Close chat"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8cdb6]/60 bg-[#fffdf7] text-[#817867] shadow-xs transition hover:border-rose-400/50 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none dark:border-[#3a3428] dark:bg-[#161410] dark:text-[#9e9585] dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                >
                  <X size={14} strokeWidth={2.4} />
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
                  {shouldShowMessageText(msg) && (
                    <div
                      className={`min-w-0 rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "rounded-br-xs bg-[#1f1a12] text-[#f7f5ef] font-semibold dark:bg-[#d6b46a] dark:text-[#11110f]"
                          : "w-full max-w-[95%] sm:max-w-[92%] rounded-bl-xs border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]"
                      }`}
                    >
                      <MessageBody
                        content={
                          msg.content?.trim() ||
                          "Thank you! How else can I help you today?"
                        }
                        role={msg.role}
                        tracking={msg.tracking}
                        isStreaming={streamingMessageId === msg.id}
                        onActionClick={(url) =>
                          handleActionClick({ preventDefault: () => {} } as any, url)
                        }
                      />
                    </div>
                  )}

                  {/* Contextual Action Buttons */}
                  {(() => {
                    const hasBookingCard = Boolean(
                      extractBookingSummary(msg.content)
                    );
                    const hasTrackingCard = Boolean(
                      extractTrackingSummary(msg.content)
                    );
                    const filteredActions =
                      hasBookingCard || hasTrackingCard
                        ? msg.actions?.filter(
                            (act) => !act.label.toLowerCase().includes("track")
                          )
                        : msg.actions;

                    if (!filteredActions || filteredActions.length === 0)
                      return null;

                    return (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-0.5">
                        {filteredActions.map((act, i) => (
                          <a
                            key={i}
                            href={
                              act.url === "chat:book-repair" ? "#" : act.url
                            }
                            onClick={(e) => {
                              if (act.url === "chat:book-repair") {
                                e.preventDefault();
                                void send(
                                  "I'd like to book a repair here in chat."
                                );
                              } else handleActionClick(e, act.url);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cdb6] bg-[#fffdf7] px-3.5 py-1.5 text-[12px] font-bold text-[#1f1a12] shadow-sm transition-all hover:border-[#1f1a12] hover:bg-[#1f1a12] hover:text-[#f7f5ef] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#d6b46a] dark:hover:border-[#d6b46a] dark:hover:bg-[#d6b46a] dark:hover:text-[#11110f]"
                          >
                            <ActionIcon name={act.icon} />
                            <span>{act.label}</span>
                          </a>
                        ))}
                      </div>
                    );
                  })()}

                  {/* 2. PRODUCT LIST (Horizontal Hammer Lifestyle Layout + Pagination) */}
                  {msg.products && msg.products.length > 0 && (
                    <ChatProductList
                      products={msg.products}
                      onActionClick={handleActionClick}
                    />
                  )}

                  {msg.bookingDraft &&
                    (() => {
                      const draft = msg.bookingDraft;
                      const details = draft.details;
                      const expired =
                        bookingSecondsRemaining(
                          draft.expiresAt,
                          bookingClock
                        ) === 0;
                      const disabled =
                        !!msg.bookingState ||
                        expired ||
                        isLoading ||
                        !!input.trim();
                      const rows = [
                        ["Customer", details.customerName],
                        ["Phone", details.phoneNumber],
                        ["Email", details.email],
                        ["Device", details.deviceName],
                        ["Brand", details.brand],
                        ["Model", details.modelName],
                        ["Repair category", draft.categoryName],
                        ["Issue", details.issueDescription],
                        ["Service", details.serviceType],
                        ["Area", draft.locationName],
                        ["Address", details.visitAddress],
                        ["Preferred date", details.preferredDate],
                        ["Preferred time", details.preferredTimeSlot]
                      ];
                      return (
                        <section
                          aria-label="Review repair booking"
                          className="mt-3 rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] p-4 dark:border-[#3a3428] dark:bg-[#1a1712]"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="flex items-center gap-2 text-sm font-bold">
                              <ClipboardCheck size={18} />
                              Review your repair booking
                            </h3>
                            {!msg.bookingState && (
                              <BookingDraftCountdown
                                expiresAt={draft.expiresAt}
                                onExpire={handleBookingExpiry}
                              />
                            )}
                          </div>
                          <dl className="space-y-2 text-sm">
                            {rows
                              .filter(([, value]) => value)
                              .map(([label, value]) => (
                                <div key={label}>
                                  <dt className="text-xs opacity-70">
                                    {label}
                                  </dt>
                                  <dd className="break-words font-medium">
                                    {value}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => void confirmBooking(msg)}
                            className="mt-4 w-full rounded-xl bg-[#1f1a12] px-4 py-2.5 text-sm font-bold text-[#f7f5ef] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d6b46a] dark:text-[#11110f]"
                          >
                            {msg.bookingState === "submitted"
                              ? "Booking confirmed"
                              : msg.bookingState === "submitting"
                                ? "Confirming…"
                                : msg.bookingState === "superseded"
                                  ? "Summary replaced — send your changes"
                                  : expired
                                    ? "Summary expired"
                                    : "Confirm booking"}
                          </button>
                          <p className="mt-2 text-xs opacity-70">
                            To change anything, type a message below. Confirm
                            within 10 minutes, or ask for a new summary.
                          </p>
                          {msg.bookingError && (
                            <p
                              role="alert"
                              className="mt-2 text-sm text-red-600 dark:text-red-400"
                            >
                              {msg.bookingError}
                            </p>
                          )}
                        </section>
                      );
                    })()}

                  {/* Time Stamp */}
                  <span className="mt-1.5 px-1 text-[12px] text-[#817867] dark:text-[var(--warm-muted-dark)]">
                    {formatTime(msg.at)}
                  </span>
                </div>
              );
            })}

            {isThinking && <HammerThinkingLoader />}

            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1.5 pb-1">
                {currentSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cdb6] bg-[#fffdf7] px-3.5 py-1.5 text-[13px] sm:text-[14px] font-medium text-[#1f1a12] shadow-xs transition hover:bg-[#1f1a12]/5 hover:border-[#1f1a12]/30 dark:border-[var(--warm-border-dark)] dark:bg-[var(--warm-card-dark)] dark:text-[#d6b46a] dark:hover:bg-[#d6b46a]/10 dark:hover:border-[#d6b46a] cursor-pointer"
                  >
                    <Sparkles size={13} className="shrink-0" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {hasNewBelow && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-[5.5rem] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#d8cdb6] bg-[#1f1a12] px-4 py-1.5 text-[12px] font-bold text-[#f7f5ef] shadow-lg transition-all hover:bg-[#3d3425] hover:scale-105 active:scale-95 dark:border-[#e8cba5]/60 dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#ecd7b6] dark:hover:text-[#11110f]"
            >
              <ArrowDown size={13} className="shrink-0 stroke-[2.5]" />
              <span>New message</span>
            </button>
          )}

          {/* Quick Action Google Sign-In Card (Hammer Lifestyle Style) */}
          {showAuthPrompt && !isAuthenticated && !getStoredAuthUser() && (
            <div className="shrink-0 px-4 pt-2 pb-1 animate-chat-widget">
              <div className="rounded-2xl border border-[#d8cdb6] bg-[#fbf8f0] p-3 shadow-xs dark:border-[#383124] dark:bg-[#1a1712]">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-xs ${
                      authFlowStage === "password"
                        ? "border border-amber-500/35 bg-amber-500/15 text-amber-700 dark:border-amber-400/35 dark:bg-amber-400/20 dark:text-amber-300"
                        : "bg-[#1f1a12] text-[#f7f5ef] dark:bg-[#d6b46a] dark:text-[#11110f]"
                    }`}
                  >
                    {authFlowStage === "password" ? (
                      <Lock size={13} strokeWidth={2.4} />
                    ) : (
                      <Mail size={13} strokeWidth={2.4} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#8a6624] dark:text-[#d6b46a]">
                        QUICK ACTION
                      </p>
                      {authFlowStage === "password" && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthFlowStage("email");
                            setInput("");
                          }}
                          className="text-[11px] font-semibold text-[#8a6624] hover:underline dark:text-[#d6b46a] cursor-pointer"
                        >
                          Change email
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug font-medium text-[#4f4638] dark:text-[#c4bcaf]">
                      {authFlowStage === "password" ? (
                        <>
                          Signing in as{" "}
                          <strong className="text-[#1f1a12] dark:text-[#f7f5ef]">
                            {authEmail}
                          </strong>
                          . Enter your password in the chat input below:
                        </>
                      ) : (
                        "Sign in with Google or enter your email in the chat input below to save tickets & history:"
                      )}
                    </p>
                    <div className="mt-2.5 max-w-[280px]">
                      <GoogleSignInButton
                        mode="signin"
                        onAuthenticated={() => {
                          setShowAuthPrompt(false);
                          setAuthFlowStage("idle");
                          setAuthEmail("");
                          const authUser = getStoredAuthUser();
                          const firstName = authUser?.fullName
                            ? ` ${authUser.fullName.trim().split(" ")[0]}`
                            : "";
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: uid(),
                              role: "assistant",
                              content: `[ICON_CHECK] **Welcome back${firstName}!** You're now signed in with Google. Your repair tickets and chat history are saved.`,
                              at: Date.now()
                            }
                          ]);
                          const pending = pendingMessageRef.current;
                          if (pending) {
                            pendingMessageRef.current = null;
                            void executeChatMessage(pending);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-1 flex justify-end">
                <button
                  onClick={handleSkipAuth}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#817867] hover:text-[#1f1a12] transition-colors dark:text-[#928a7d] dark:hover:text-[#f7f5ef] cursor-pointer pr-1"
                >
                  <span>Skip</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="shrink-0 border-t border-[#d8cdb6] bg-[#fbf8f0] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2.5 sm:pb-4 dark:border-[#383124] dark:bg-[var(--warm-bg-dark)]">
            <div className="flex items-center gap-2 rounded-3xl border border-[#d8cdb6] bg-[#fffdf7] px-3 py-1.5 shadow-xs transition-colors focus-within:border-[#8a6624] focus-within:ring-2 focus-within:ring-[#8a6624]/15 dark:border-[#3a3428] dark:bg-[#1a1712] dark:focus-within:border-[#d6b46a] dark:focus-within:ring-2 dark:focus-within:ring-[#d6b46a]/20">
              {/* Context Icon */}
              {authFlowStage === "email" && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8a6624]/10 text-[#8a6624] dark:bg-[#d6b46a]/15 dark:text-[#d6b46a]">
                  <Mail size={14} strokeWidth={2.2} />
                </span>
              )}
              {authFlowStage === "password" && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/15 text-amber-700 shadow-xs dark:border-amber-400/35 dark:bg-amber-400/20 dark:text-amber-300">
                  <Lock size={14} strokeWidth={2.2} />
                </span>
              )}

              {/* Dynamic Input / Textarea */}
              {authFlowStage === "idle" ? (
                <textarea
                  ref={inputRef}
                  value={input}
                  disabled={bookingSubmitRef.current}
                  onChange={(e) => {
                    if (e.target.value.trim()) disableBookingSummaries();
                    setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH));
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything or book a repair..."
                  rows={1}
                  maxLength={MAX_MESSAGE_LENGTH}
                  aria-label="Message"
                  style={{
                    resize: "none",
                    overflowY:
                      input.includes("\n") || input.length > 70
                        ? "auto"
                        : "hidden"
                  }}
                  className="max-h-24 flex-1 resize-none bg-transparent px-2 py-1 text-[14px] sm:text-[15px] leading-normal text-[#1f1a12] placeholder:text-[#8a8170] focus:outline-none dark:text-[#f7f5ef] dark:placeholder:text-[#9e9585]"
                />
              ) : (
                <input
                  ref={authInputRef}
                  type={
                    authFlowStage === "password"
                      ? showPassword
                        ? "text"
                        : "password"
                      : "email"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder={
                    authFlowStage === "email"
                      ? "Enter your email address..."
                      : "Enter your password..."
                  }
                  autoComplete={
                    authFlowStage === "email" ? "email" : "current-password"
                  }
                  className="flex-1 bg-transparent px-2 py-1 text-[14px] sm:text-[15px] leading-normal text-[#1f1a12] placeholder:text-[#8a8170] focus:outline-none dark:text-[#f7f5ef] dark:placeholder:text-[#9e9585]"
                />
              )}

              {/* Password eye toggle */}
              {authFlowStage === "password" && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d8cdb6]/60 bg-[#fffdf7] text-[#817867] shadow-2xs hover:border-[#8a6624]/40 hover:text-[#1f1a12] dark:border-[#3a3428] dark:bg-[#161410] dark:text-[#9e9585] dark:hover:text-[#f7f5ef] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}

              <button
                onClick={() => void send(input)}
                disabled={isLoading || !input.trim()}
                aria-label={
                  authFlowStage !== "idle" ? "Submit" : "Send message"
                }
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-[#1f1a12] transition hover:bg-[#8a6624]/10 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none dark:text-[#d6b46a] dark:hover:bg-[#d6b46a]/15 cursor-pointer"
              >
                <Send size={17} />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-center gap-4 px-1 text-[11px] sm:text-[12px] text-[#7d7363] dark:text-[#a8a093]">
              <span className="flex items-center gap-1.5 text-center font-medium">
                <ShieldCheck
                  size={14}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                Verified Shop Assistant
              </span>
              {showCounter && authFlowStage === "idle" && (
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
            className="cursor-pointer group fixed bottom-22 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:border-[#d6b46a] active:scale-95 focus-visible:outline-none sm:bottom-24 sm:right-6 sm:h-16 sm:w-16 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#d6b46a] dark:hover:border-[#d6b46a]/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          >
            <span
              className="chat-ping-ring absolute inset-0 rounded-full border border-[#8a6624]/30 dark:border-[#d6b46a]/40"
              style={{
                animation: prefersReducedMotion
                  ? undefined
                  : "chat-ping 2.4s ease-out infinite"
              }}
            />
            {/* Friendly Chat Bubble with Sparkle Icon */}
            <span className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <MessageSquare
                size={24}
                className="stroke-[2] text-[#1f1a12] dark:text-[#d6b46a]"
              />
              <Sparkles
                size={13}
                className="absolute -top-1.5 -right-1.5 fill-[#8a6624] text-[#8a6624] dark:fill-[#d6b46a] dark:text-[#d6b46a]"
              />
            </span>
          </button>
        </>
      )}
    </>
  );
}
