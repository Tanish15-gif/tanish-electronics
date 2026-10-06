import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BrainCircuit,
  BookOpen,
  Sparkles,
  Layers,
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Download,
  Zap,
  ShieldCheck,
  Wrench,
  Activity,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  XCircle,
  Lightbulb,
  EyeOff
} from "lucide-react";
import { useApiAuth } from "../../hooks/useApiAuth";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import {
  getStoreKnowledgeArticles,
  getStoreKnowledgeCategories,
  createStoreKnowledge,
  updateStoreKnowledge,
  toggleStoreKnowledgeActive,
  deleteStoreKnowledge,
  type StoreKnowledgeItem,
  type CreateStoreKnowledgePayload
} from "../../Services/adminStoreKnowledgeService";
import { useShopSettings } from "../../hooks/useShopSettings";

const DEFAULT_CATEGORIES = [
  "Troubleshooting",
  "Warranty",
  "Policy",
  "Home Visit",
  "Service",
  "Products"
];

type StatusFilterType = "All" | "Active" | "Inactive";

export default function AdminStoreKnowledgePage() {
  const { getToken } = useApiAuth();

  const [articles, setArticles] = useState<StoreKnowledgeItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("All");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const { settings } = useShopSettings();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Store Information | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  // Interactive Card Expansion
  const [expandedCardIds, setExpandedCardIds] = useState<Set<number>>(
    new Set()
  );

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] =
    useState<StoreKnowledgeItem | null>(null);
  const [formData, setFormData] = useState<CreateStoreKnowledgePayload>({
    title: "",
    category: "Troubleshooting",
    content: "",
    tags: "",
    isActive: true
  });
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<StoreKnowledgeItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Active Toggle Loading State
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // AI Grounding Preview Modal
  const [previewArticle, setPreviewArticle] =
    useState<StoreKnowledgeItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Dropdown Options
  const categoryFilterOptions = useMemo<DropdownOption<string>[]>(
    () => [
      { value: "All", label: "All Categories" },
      ...categories.map((c) => ({ value: c, label: c }))
    ],
    [categories]
  );

  const statusFilterOptions: DropdownOption<StatusFilterType>[] = [
    { value: "All", label: "All Statuses" },
    { value: "Active", label: "Active in AI Grounding" },
    { value: "Inactive", label: "Inactive (Draft)" }
  ];

  const modalCategoryOptions = useMemo<DropdownOption<string>[]>(
    () => [
      ...categories.map((c) => ({ value: c, label: c })),
      { value: "__custom__", label: "+ Enter Custom Category..." }
    ],
    [categories]
  );

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token)
        throw new Error("Authentication token expired. Please refresh.");

      const isActiveParam =
        statusFilter === "Active"
          ? true
          : statusFilter === "Inactive"
            ? false
            : undefined;

      const res = await getStoreKnowledgeArticles(token, {
        pageNumber: page,
        pageSize,
        search: search.trim() || undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        isActive: isActiveParam
      });

      setArticles(res.items || []);
      setTotalRecords(res.totalRecords ?? res.totalCount ?? 0);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load store knowledge articles."
      );
    } finally {
      setIsLoading(false);
    }
  }, [getToken, page, pageSize, search, selectedCategory, statusFilter]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const cats = await getStoreKnowledgeCategories(token);
      const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...cats]));
      setCategories(combined);
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, [getToken]);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  // Toast Helper
  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3600);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = totalRecords;
    const activeOnScreen = articles.filter((a) => a.isActive).length;
    const activeRate =
      articles.length > 0
        ? Math.round((activeOnScreen / articles.length) * 100)
        : 100;
    return {
      total,
      active: activeOnScreen,
      categoriesCount: categories.length,
      activeRate
    };
  }, [totalRecords, articles, categories]);

  // Modal Openers
  const openCreateModal = () => {
    setEditingArticle(null);
    setIsCustomCategory(false);
    setCustomCategory("");
    setFormData({
      title: "",
      category: categories[0] || "Troubleshooting",
      content: "",
      tags: "",
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (article: StoreKnowledgeItem) => {
    setEditingArticle(article);
    const isStandardCat = categories.includes(article.category);
    setIsCustomCategory(!isStandardCat);
    setCustomCategory(!isStandardCat ? article.category : "");
    setFormData({
      title: article.title,
      category: article.category,
      content: article.content,
      tags: article.tags || "",
      isActive: article.isActive
    });
    setIsModalOpen(true);
  };

  // Toggle Card Expansion
  const toggleCardExpand = (id: number) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Title and Technical Content are required.");
      return;
    }

    const finalCategory = isCustomCategory
      ? customCategory.trim() || "General"
      : formData.category;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expired. Please sign in again.");

      const payload: CreateStoreKnowledgePayload = {
        title: formData.title.trim(),
        category: finalCategory,
        content: formData.content.trim(),
        tags: formData.tags?.trim() || null,
        isActive: formData.isActive
      };

      if (editingArticle) {
        await updateStoreKnowledge(
          token,
          editingArticle.storeKnowledgeId,
          payload
        );
        showToast(`Article "${payload.title}" updated and re-vectorized!`);
      } else {
        await createStoreKnowledge(token, payload);
        showToast(
          `Article "${payload.title}" created & indexed into AI chatbot!`
        );
      }

      setIsModalOpen(false);
      void fetchArticles();
      void fetchCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save article.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Switch
  const handleToggleActive = async (id: number) => {
    if (togglingIds.has(id)) return;
    setTogglingIds((prev) => new Set(prev).add(id));

    try {
      const token = await getToken();
      if (!token) return;

      const res = await toggleStoreKnowledgeActive(token, id);

      setArticles((prev) =>
        prev.map((a) =>
          a.storeKnowledgeId === id ? { ...a, isActive: res.isActive } : a
        )
      );

      showToast(
        res.message ||
          (res.isActive ? "Article activated in AI." : "Article deactivated.")
      );
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Failed to toggle article status."
      );
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;

      await deleteStoreKnowledge(token, deleteTarget.storeKnowledgeId);
      showToast(
        `Article "${deleteTarget.title}" deleted and purged from vector store.`
      );
      setDeleteTarget(null);
      void fetchArticles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete article.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Content to Clipboard
  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Client-side CSV Exporter
  const handleExportCsv = () => {
    if (articles.length === 0) return;
    const headers = [
      "ID",
      "Title",
      "Category",
      "Content",
      "Tags",
      "IsActive",
      "CreatedAt",
      "UpdatedAt"
    ];
    const rows = articles.map((a) => [
      a.storeKnowledgeId,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.category.replace(/"/g, '""')}"`,
      `"${a.content.replace(/"/g, '""')}"`,
      `"${(a.tags || "").replace(/"/g, '""')}"`,
      a.isActive ? "Active" : "Inactive",
      a.createdAt,
      a.updatedAt || ""
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `tanish_store_knowledge_base_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Knowledge Base exported as CSV!");
  };

  // Category Color Badges
  const getCategoryTheme = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("troubleshoot")) {
      return {
        badge:
          "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300 dark:bg-blue-500/20 dark:border-blue-400/30",
        dot: "bg-blue-500",
        icon: <Wrench className="h-3.5 w-3.5" />
      };
    }
    if (cat.includes("warrant")) {
      return {
        badge:
          "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-300 dark:bg-purple-500/20 dark:border-purple-400/30",
        dot: "bg-purple-500",
        icon: <ShieldCheck className="h-3.5 w-3.5" />
      };
    }
    if (cat.includes("policy")) {
      return {
        badge:
          "bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-300 dark:bg-amber-500/20 dark:border-amber-400/30",
        dot: "bg-amber-500",
        icon: <BookOpen className="h-3.5 w-3.5" />
      };
    }
    if (cat.includes("home") || cat.includes("visit")) {
      return {
        badge:
          "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-400/30",
        dot: "bg-emerald-500",
        icon: <Zap className="h-3.5 w-3.5" />
      };
    }
    return {
      badge:
        "bg-[#d6b46a]/15 text-[#8a6624] border-[#d6b46a]/30 dark:text-[#d6b46a] dark:bg-[#d6b46a]/10 dark:border-[#d6b46a]/30",
      dot: "bg-[#d6b46a]",
      icon: <BrainCircuit className="h-3.5 w-3.5" />
    };
  };

  // Single compact sort parser for the middle of each card (matching the image)
  const renderCompactContent = (rawText: string, isExpanded: boolean) => {
    const labelPattern =
      /(Symptom:|Root Cause:|Solution:|Honest Technical Advice:|Scope:|Conditions:|Coverage Area:|Process:|Visit Charge:)/gi;
    const parts = rawText.split(labelPattern);

    if (parts.length > 1) {
      return (
        <p
          className={`text-xs leading-relaxed text-[#403728] dark:text-[#c4bba8] ${isExpanded ? "" : "line-clamp-2"}`}
        >
          {parts.map((segment, idx) => {
            const isLabel =
              /(Symptom:|Root Cause:|Solution:|Honest Technical Advice:|Scope:|Conditions:|Coverage Area:|Process:|Visit Charge:)/i.test(
                segment
              );
            if (isLabel) {
              return (
                <strong
                  key={idx}
                  className="font-bold text-[#1a160f] dark:text-[#f8f5ee] mr-1"
                >
                  {segment}
                </strong>
              );
            }
            return <span key={idx}>{segment} </span>;
          })}
        </p>
      );
    }

    return (
      <p
        className={`text-xs leading-relaxed text-[#403728] dark:text-[#c4bba8] ${isExpanded ? "" : "line-clamp-2"}`}
      >
        {rawText}
      </p>
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "All" ||
    statusFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setStatusFilter("All");
    setPage(1);
  };

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* ── Signature Executive Header Banner ────────────────────────────── */}
        <header className="overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm transition-all dark:border-[#302c24] dark:bg-[#1a1712] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Context */}
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d6b46a]/40 bg-[#fff5d6] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                  <Sparkles
                    size={12}
                    className="text-[#8a6624] dark:text-[#d6b46a]"
                  />
                  AI Grounding & Vector Store
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live RAG Active
                </span>
              </div>

              <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#1a160f] dark:text-[#f8f5ee] sm:text-4xl lg:text-5xl">
                Store Knowledge Base
              </h1>

              <p className="mt-3 text-sm font-semibold leading-relaxed text-[#6f6758] dark:text-[#a8a093] sm:text-base">
                Authoritative repair diagnosis, shop warranties, and store
                policies grounding Subhash's AI assistant in real-time across
                Mumbai.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
              <button
                type="button"
                onClick={() => void fetchArticles()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d8cdb6] bg-white px-4 py-2.5 text-xs font-black text-[#1f1a12] shadow-xs transition hover:bg-[#faf7f0] active:scale-95 disabled:opacity-50 dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#e8e3d8] dark:hover:bg-[#201a13] cursor-pointer"
                title="Refresh and sync index"
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin text-[#8a6624]" : ""}
                />
                <span>Refresh Index</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d8cdb6] bg-white px-4 py-2.5 text-xs font-black text-[#1f1a12] shadow-xs transition hover:bg-[#faf7f0] active:scale-95 dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#e8e3d8] dark:hover:bg-[#201a13] cursor-pointer"
                title="Export Knowledge Articles to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1f1a12] px-5 py-2.5 text-xs font-black text-[#f8f5ee] shadow-md transition hover:bg-[#382f21] active:scale-95 dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#dfc383] cursor-pointer"
              >
                <Plus size={16} strokeWidth={3} />
                <span>Add Knowledge Article</span>
              </button>
            </div>
          </div>

          {/* ── KPI Summary Cards ────────────────────────────────────────── */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {/* Total Articles */}
            <div className="rounded-2xl border border-[#d8cdb6] bg-[#fbf9f4] p-4 shadow-2xs dark:border-[#302c24] dark:bg-[#14110d]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#786d5b] dark:text-[#a89d87]">
                <span>Total Articles</span>
                <BookOpen
                  size={15}
                  className="text-[#8a6624] dark:text-[#d6b46a]"
                />
              </div>
              <p className="mt-2 text-3xl font-black text-[#1a160f] dark:text-[#f8f5ee]">
                {stats.total}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#8a7f6c] dark:text-[#8e8574]">
                Indexed in SQL Server
              </p>
            </div>

            {/* Live in AI Vector Space */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-4 shadow-2xs dark:border-emerald-400/20 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                <span>Vector Grounding</span>
                <Zap
                  size={15}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-700 dark:text-emerald-400">
                {stats.active}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-400/80">
                Active in RAG Cosine Search
              </p>
            </div>

            {/* Topics / Categories */}
            <div className="rounded-2xl border border-[#d8cdb6] bg-[#fbf9f4] p-4 shadow-2xs dark:border-[#302c24] dark:bg-[#14110d]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#786d5b] dark:text-[#a89d87]">
                <span>Topic Buckets</span>
                <Layers
                  size={15}
                  className="text-[#8a6624] dark:text-[#d6b46a]"
                />
              </div>
              <p className="mt-2 text-3xl font-black text-[#1a160f] dark:text-[#f8f5ee]">
                {stats.categoriesCount}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#8a7f6c] dark:text-[#8e8574]">
                Troubleshooting, Warranty, Policies
              </p>
            </div>

            {/* Sync Rate */}
            <div className="rounded-2xl border border-[#d8cdb6] bg-[#fbf9f4] p-4 shadow-2xs dark:border-[#302c24] dark:bg-[#14110d]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#786d5b] dark:text-[#a89d87]">
                <span>Coverage Health</span>
                <Activity
                  size={15}
                  className="text-[#8a6624] dark:text-[#d6b46a]"
                />
              </div>
              <p className="mt-2 text-3xl font-black text-[#1a160f] dark:text-[#f8f5ee]">
                {stats.activeRate}%
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#ded5c2] dark:bg-[#2e261b]">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${stats.activeRate}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* ── Toast Alert ─────────────────────────────────────────────────── */}
        {successToast && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={16}
                className="text-emerald-600 dark:text-emerald-400"
              />
              <span>{successToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Filter & Search Section with Custom UniversalDropdown ───────── */}
        <section className="mt-6 rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_240px_240px_auto] lg:items-end">
            {/* Search Input */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                Search Knowledge
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a7f6c] dark:text-[#a89d87]"
                  size={16}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search symptom, root cause, or tag..."
                  className="flex min-h-12 w-full items-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] py-3 pl-10 pr-9 text-sm font-bold text-[#1f1a12] placeholder-[#8a7f6c] outline-none transition focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder-[#6b6251]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#8a7f6c] hover:text-[#1a160f] dark:hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Custom Category UniversalDropdown */}
            <UniversalDropdown<string>
              label="Topic Category"
              options={categoryFilterOptions}
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value);
                setPage(1);
              }}
              placeholder="All Categories"
            />

            {/* Custom Status UniversalDropdown */}
            <UniversalDropdown<StatusFilterType>
              label="Vector Grounding Status"
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              placeholder="All Statuses"
            />

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-12 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 text-xs font-black text-[#1f1a12] transition hover:bg-[#faf7f0] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* ── Compact Row View Content Area ────────────────────────────── */}
        <section className="mt-6">
          {error ? (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm font-bold text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-400">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-[#ded5c2] bg-white/70 dark:border-[#302c24] dark:bg-[#1a1712]/70"
                />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#ded5c2] bg-[#fffdf7] p-16 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ded5c2] bg-[#fbf9f4] text-[#8a6624] dark:border-[#302c24] dark:bg-[#12100d] dark:text-[#d6b46a]">
                <BookOpen size={28} />
              </div>
              <h3 className="mt-4 text-base font-black text-[#1a160f] dark:text-[#f8f5ee]">
                No Knowledge Articles Found
              </h3>
              <p className="mt-1.5 max-w-md text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                {hasActiveFilters
                  ? "No articles matched your active filters. Try searching for symptoms like 'backlight', 'lines', 'home visit', or click Reset."
                  : "Start grounding your AI assistant by adding your first technical troubleshooting article or shop policy."}
              </p>
              <div className="mt-5 flex gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-[#ded5c2] bg-white px-4 py-2 text-xs font-black text-[#1f1a12] transition hover:bg-[#faf7f0] dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#f8f5ee] cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="rounded-xl bg-[#1f1a12] px-4 py-2 text-xs font-black text-white transition hover:bg-[#382f21] dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#dfc383] cursor-pointer"
                >
                  + Add New Article
                </button>
              </div>
            </div>
          ) : (
            /* ── Compact Row Layout ───────────────────────────────────────── */
            <div className="space-y-3">
              {articles.map((art) => {
                const isExpanded = expandedCardIds.has(art.storeKnowledgeId);
                const theme = getCategoryTheme(art.category);
                const isToggling = togglingIds.has(art.storeKnowledgeId);
                const isCopied = copiedId === art.storeKnowledgeId;

                return (
                  <div
                    key={art.storeKnowledgeId}
                    className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                      art.isActive
                        ? "border-[#d8cdb6] bg-[#fffdf7] shadow-xs hover:border-[#8a6624]/50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#d6b46a]/40"
                        : "border-dashed border-[#ded5c2] bg-[#fbf9f4]/60 opacity-80 dark:border-[#302c24] dark:bg-[#14110d]/60"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#ded5c2] bg-[#fbf9f4] text-[#8a6624] dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#d6b46a]">
                          <FileText size={17} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-[#1a160f] dark:text-[#f8f5ee] truncate">
                              {art.title}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${theme.badge}`}
                            >
                              {theme.icon}
                              <span>{art.category}</span>
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                art.isActive
                                  ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                  : "bg-neutral-500/15 text-neutral-600 border border-neutral-500/20 dark:bg-neutral-500/10 dark:text-neutral-400"
                              }`}
                            >
                              {art.isActive ? (
                                <Sparkles
                                  size={10}
                                  className="text-emerald-600 dark:text-emerald-400 shrink-0"
                                />
                              ) : (
                                <EyeOff
                                  size={10}
                                  className="text-neutral-500 dark:text-neutral-400 shrink-0"
                                />
                              )}
                              <span>
                                {art.isActive
                                  ? "Active in AI"
                                  : "Inactive (Draft)"}
                              </span>
                            </span>
                          </div>

                          {/* Tags Chips */}
                          {art.tags && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              <Tag
                                size={11}
                                className="text-[#8a7f6c] dark:text-[#8e8574] shrink-0"
                              />
                              {art.tags.split(",").map((t, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-[#f0ebd8] px-1.5 py-0.5 text-[9.5px] font-semibold text-[#5e533f] dark:bg-[#251f17] dark:text-[#b8ad96]"
                                >
                                  #{t.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Buttons */}
                      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                        {/* Toggle Active Status */}
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() =>
                            handleToggleActive(art.storeKnowledgeId)
                          }
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                            art.isActive
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                          }`}
                          title={
                            art.isActive
                              ? "Deactivate from AI chat"
                              : "Activate for AI chat"
                          }
                        >
                          {isToggling ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : art.isActive ? (
                            <XCircle size={13} />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          <span>
                            {art.isActive ? "Deactivate" : "Activate"}
                          </span>
                        </button>

                        {/* Copy Content */}
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(art.storeKnowledgeId, art.content)
                          }
                          className="flex items-center justify-center rounded-lg border border-[#ded5c2] bg-[#fbf9f4] p-1.5 text-[#6f6758] transition hover:bg-[#ede6d6] hover:text-[#1a160f] dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#a8a093] dark:hover:bg-[#251f16] dark:hover:text-[#f8f5ee] dark:hover:border-[#42392b] cursor-pointer"
                          title="Copy article text"
                        >
                          {isCopied ? (
                            <Check
                              size={13}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>

                        {/* Inspect AI Grounding */}
                        <button
                          type="button"
                          onClick={() => setPreviewArticle(art)}
                          className="flex items-center justify-center rounded-lg border border-[#ded5c2] bg-[#fbf9f4] p-1.5 text-[#8a6624] transition hover:bg-[#ede6d6] hover:text-[#6b4e18] dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#d6b46a] dark:hover:bg-[#251f16] dark:hover:text-[#dfc383] dark:hover:border-[#42392b] cursor-pointer"
                          title="Inspect AI Grounding context"
                        >
                          <Sparkles size={13} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(art)}
                          className="flex items-center gap-1 rounded-lg border border-[#ded5c2] bg-[#fbf9f4] px-2.5 py-1 text-xs font-bold text-[#1f1a12] transition hover:bg-[#ede6d6] hover:text-black dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#f8f5ee] dark:hover:bg-[#251f16] dark:hover:border-[#42392b] cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(art)}
                          className="flex items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-600 transition hover:bg-rose-500/20 dark:border-rose-400/30 dark:text-rose-400 dark:hover:bg-rose-500/25 cursor-pointer"
                          title="Delete article"
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* Expand / Collapse Chevron */}
                        <button
                          type="button"
                          onClick={() => toggleCardExpand(art.storeKnowledgeId)}
                          className="flex items-center justify-center rounded-lg border border-[#ded5c2] bg-[#fbf9f4] p-1.5 text-[#786d5b] transition hover:bg-[#ede6d6] hover:text-[#1f1a12] dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#a8a093] dark:hover:bg-[#251f16] dark:hover:text-white dark:hover:border-[#42392b] cursor-pointer"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ── Content Preview / Expanded (Compact Middle Like Image) ── */}
                    <div className="border-t border-[#f0ebd8] bg-[#faf7f0]/50 px-4 pb-3 pt-3 dark:border-[#272118] dark:bg-[#14100b]/50">
                      {renderCompactContent(art.content, isExpanded)}

                      <div className="mt-2 flex items-center justify-between text-[10px] text-[#8a7f6c] dark:text-[#6b6251]">
                        <span>
                          Created{" "}
                          {new Date(art.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        {art.updatedAt && (
                          <span>
                            Updated{" "}
                            {new Date(art.updatedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination Footer Bar ──────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] px-6 py-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-[#6f6758] dark:text-[#a8a093]">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, totalRecords)} of {totalRecords}{" "}
                articles
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3.5 py-1.5 text-xs font-black text-[#1f1a12] transition hover:bg-[#fff4cc] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712] cursor-pointer"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  if (
                    totalPages > 6 &&
                    Math.abs(pNum - page) > 2 &&
                    pNum !== 1 &&
                    pNum !== totalPages
                  ) {
                    return null;
                  }
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-black transition cursor-pointer ${
                        pNum === page
                          ? "bg-[#1f1a12] text-white shadow-xs dark:bg-[#d6b46a] dark:text-[#11110f]"
                          : "border border-[#d8cdb6] bg-white text-[#6f6758] hover:bg-[#fbf9f4] dark:border-[#302c24] dark:bg-[#14110d] dark:text-[#a8a093]"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="rounded-xl bg-[#1f1a12] px-3.5 py-1.5 text-xs font-black text-[#f7f5ef] transition hover:bg-[#382f21] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </section>

      {/* ── Luxury Create / Edit Modal Drawer ─────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-2xl dark:border-[#383125] dark:bg-[#161410] text-left sm:p-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ded5c2] pb-4 dark:border-[#302c24]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f1a12] text-[#d6b46a] dark:bg-[#d6b46a] dark:text-[#11110f]">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1a160f] dark:text-[#f8f5ee]">
                    {editingArticle
                      ? "Edit Knowledge Article"
                      : "New AI Knowledge Article"}
                  </h3>
                  <p className="text-xs font-semibold text-[#786d5b] dark:text-[#a89d87]">
                    Indexed directly into the semantic vector space grounding
                    the customer chatbot.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-[#8a7f6c] transition hover:bg-[#f0ebd8] hover:text-[#1a160f] dark:hover:bg-[#201a13] dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="mt-5 space-y-5">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                  Article Title / Key Problem{" "}
                  <span className="text-red-500 font-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. TV Sound Working But No Picture (Backlight Failure)"
                  className="flex min-h-12 w-full items-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#1f1a12] outline-none transition focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
                />
              </div>

              {/* Category Selection via Custom UniversalDropdown */}
              <div className="grid grid-cols-1 gap-4">
                <UniversalDropdown<string>
                  label="Category"
                  required
                  options={modalCategoryOptions}
                  value={isCustomCategory ? "__custom__" : formData.category}
                  onChange={(val) => {
                    if (val === "__custom__") {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setFormData({ ...formData, category: val });
                    }
                  }}
                  placeholder="Select Category"
                />

                {isCustomCategory && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                      New Category Name{" "}
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Motherboard Repair, Soundbar Fix"
                      className="flex min-h-12 w-full items-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#1f1a12] outline-none transition focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
                    />
                  </div>
                )}
              </div>

              {/* Semantic Keywords / Tags */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                  Semantic Search Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g. black screen, backlight, led strip, no video, sound ok, dark display"
                  className="flex min-h-12 w-full items-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#1f1a12] outline-none transition focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
                />
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#8a7f6c] dark:text-[#8e8574]">
                  <Lightbulb size={13} className="text-amber-500 shrink-0" />
                  <span>
                    Pro-tip: Include colloquial terms customers use in chat
                    (e.g., "telly", "awaaz aa rahi hai screen band").
                  </span>
                </p>
              </div>

              {/* Technical Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                    Authoritative Guidance & Diagnostics{" "}
                    <span className="text-red-500 font-black">*</span>
                  </label>
                  <span className="text-xs font-semibold text-[#8a7f6c] dark:text-[#8e8574]">
                    {formData.content.length} characters
                  </span>
                </div>
                <textarea
                  required
                  rows={7}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Structure with clear diagnosis steps: Describe Symptom, Root Cause, Workshop Solution, Parts Quality, Estimated Repair Timeframe, and Warranty details..."
                  className="w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] p-4 text-xs font-semibold leading-relaxed text-[#1f1a12] outline-none transition focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between rounded-xl border border-[#ded5c2] bg-[#fbf9f4] p-4 dark:border-[#302c24] dark:bg-[#12100d]">
                <div>
                  <p className="text-sm font-black text-[#1a160f] dark:text-[#f8f5ee]">
                    Live in AI Chat Grounding
                  </p>
                  <p className="text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                    When active, the Groq RAG model retrieves this text to
                    answer customer queries.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isActive}
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isActive
                      ? "bg-emerald-600"
                      : "bg-[#ded5c2] dark:bg-[#383124]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-[#ded5c2] pt-4 dark:border-[#302c24]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#ded5c2] bg-white px-5 py-2.5 text-xs font-black text-[#6f6758] transition hover:bg-[#faf7f0] dark:border-[#302c24] dark:bg-[#14110d] dark:text-[#a8a093] dark:hover:bg-[#201a13] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#1f1a12] px-6 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#382f21] active:scale-95 disabled:opacity-50 dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#dfc383] cursor-pointer"
                >
                  {isSubmitting && (
                    <RefreshCw size={13} className="animate-spin" />
                  )}
                  <span>
                    {editingArticle
                      ? "Save Changes"
                      : "Create & Vectorize Article"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AI Grounding Inspector & Simulator Modal ──────────────────────── */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-2xl dark:border-[#383125] dark:bg-[#161410] text-left sm:p-7">
            <div className="flex items-center justify-between border-b border-[#ded5c2] pb-3.5 dark:border-[#302c24]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d6b46a]/20 text-[#8a6624] dark:text-[#d6b46a]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1a160f] dark:text-[#f8f5ee]">
                    AI Grounding Inspection
                  </h3>
                  <p className="text-[11px] font-semibold text-[#786d5b] dark:text-[#a89d87]">
                    How this article is transformed and fed into Groq LLM vector
                    context.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="rounded-xl p-1.5 text-[#8a7f6c] hover:text-[#1a160f] dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="rounded-xl border border-[#ded5c2] bg-[#fbf9f4] p-3 text-xs dark:border-[#302c24] dark:bg-[#12100d]">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8a6624] dark:text-[#d6b46a]">
                  RAG Document Metadata
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs font-semibold">
                  <div>
                    <span className="text-[#786d5b] dark:text-[#a89d87]">
                      Topic:
                    </span>{" "}
                    {previewArticle.category}
                  </div>
                  <div>
                    <span className="text-[#786d5b] dark:text-[#a89d87]">
                      Vector Status:
                    </span>{" "}
                    {previewArticle.isActive ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} />
                        Active in Search
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={12} />
                        Excluded
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#786d5b] dark:text-[#a89d87]">
                      Keywords:
                    </span>{" "}
                    {previewArticle.tags || "None specified"}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-[#786d5b] dark:text-[#a89d87] mb-1.5">
                  Extracted Context Chunk:
                </p>
                <div className="rounded-xl border border-[#ded5c2] bg-white p-3.5 text-xs font-mono leading-relaxed text-[#3b3225] dark:border-[#302c24] dark:bg-[#0e0d0b] dark:text-[#ded5c5] max-h-60 overflow-y-auto">
                  <p className="font-bold text-[#8a6624] dark:text-[#d6b46a] mb-1">
                    # {previewArticle.title} ({previewArticle.category})
                  </p>
                  <p>{previewArticle.content}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[#ded5c2] pt-3.5 dark:border-[#302c24]">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} />
                Synchronized with SQL vector model
              </span>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="rounded-xl bg-[#1f1a12] px-4 py-2 text-xs font-black text-white dark:bg-[#d6b46a] dark:text-[#11110f] cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[2rem] border border-rose-500/40 bg-[#fffdf7] p-6 shadow-2xl dark:border-rose-400/40 dark:bg-[#161410] text-left">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1a160f] dark:text-[#f8f5ee]">
                  Delete Knowledge Article?
                </h3>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="mt-3.5 text-xs font-semibold leading-relaxed text-[#786d5b] dark:text-[#a89d87]">
              Are you sure you want to permanently remove{" "}
              <strong className="text-[#1a160f] dark:text-white font-black">
                "{deleteTarget.title}"
              </strong>
              ? It will be removed from the database and immediately purged from
              the AI chatbot's vector grounding cache.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#ded5c2] bg-white px-4 py-2 text-xs font-black text-[#786d5b] transition hover:bg-[#faf7f0] dark:border-[#302c24] dark:bg-[#1d1812] dark:text-[#a89d87] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting && <RefreshCw size={13} className="animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

