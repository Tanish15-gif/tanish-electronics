import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  type ReactNode
} from "react";
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
  CheckCircle2,
  AlertTriangle,
  Download,
  Zap,
  ShieldCheck,
  Wrench,
  MoreHorizontal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
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
    document.title = `AI Knowledge | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, [settings.shopName]);

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
    { value: "Active", label: "Active in AI" },
    { value: "Inactive", label: "Drafts" }
  ];

  const modalCategoryOptions = useMemo<DropdownOption<string>[]>(
    () => [
      ...categories.map((c) => ({ value: c, label: c })),
      { value: "__custom__", label: "+ Enter Custom Category..." }
    ],
    [categories]
  );

  const articleRequest = useRef(0);

  // Ignore superseded requests when filters change quickly.
  const fetchArticles = useCallback(async () => {
    const request = ++articleRequest.current;
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

      if (request !== articleRequest.current) return;
      const lastPage = Math.max(
        1,
        Math.ceil((res.totalRecords ?? res.totalCount ?? 0) / pageSize)
      );
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }
      setArticles(res.items || []);
      setTotalRecords(res.totalRecords ?? res.totalCount ?? 0);
    } catch (err: unknown) {
      if (request !== articleRequest.current) return;
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load store knowledge articles."
      );
    } finally {
      if (request === articleRequest.current) setIsLoading(false);
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
    // Debounce typing and cancel scheduled requests during cleanup.
    const timer = window.setTimeout(() => void fetchArticles(), 200);
    return () => {
      window.clearTimeout(timer);
      articleRequest.current += 1;
    };
  }, [fetchArticles]);

  useEffect(() => {
    // Scheduling lets StrictMode cleanup cancel a redundant initial request.
    const timer = window.setTimeout(() => void fetchCategories(), 0);
    return () => window.clearTimeout(timer);
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
    return {
      total,
      active: activeOnScreen,
      drafts: articles.length - activeOnScreen,
      categoriesCount: categories.length
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
        showToast(`Article "${payload.title}" updated.`);
      } else {
        await createStoreKnowledge(token, payload);
        showToast(`Article "${payload.title}" created.`);
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

      if (statusFilter !== "All") void fetchArticles();
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
  const handleCopy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError(
        "Could not copy this article. Please check clipboard access and try again."
      );
    }
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
    showToast("Articles on this page exported as CSV.");
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

  const renderArticleContent = (rawText: string, isExpanded: boolean) => {
    if (!isExpanded)
      return (
        <p className="line-clamp-2 text-[13px] leading-6 text-[#716958] dark:text-[#b3aa99]">
          {rawText}
        </p>
      );
    const parts = rawText.split(
      /(Symptom:|Root Cause:|Solution:|Honest Technical Advice:|Scope:|Conditions:|Coverage Area:|Process:|Visit Charge:)/gi
    );
    return (
      <div className="grid gap-4 text-[13px] leading-6 text-[#514938] dark:text-[#c4bba8] sm:grid-cols-2">
        {parts[0].trim() && (
          <p className="whitespace-pre-wrap sm:col-span-2">{parts[0]}</p>
        )}
        {parts.slice(1).map((part, index, all) =>
          index % 2 === 0 ? (
            <div key={index}>
              <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8a6624] dark:text-[#d6b46a]">
                {part.replace(/:$/, "")}
              </h4>
              <p className="whitespace-pre-wrap">{all[index + 1]?.trim()}</p>
            </div>
          ) : null
        )}
      </div>
    );
  };
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

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
    <div className="knowledge-page te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#8a6624] dark:text-[#d6b46a]">
            <BrainCircuit size={15} /> AI workspace{" "}
            <span className="text-[#b8ad99]">/</span> Knowledge
          </div>
          <div className="mt-3 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="max-w-xl">
              <h1 className="font-display text-[32px] font-semibold leading-tight text-[#241e14] dark:text-[#f8f5ee] sm:text-[38px]">
                Store knowledge base
              </h1>
              <p className="mt-2 max-w-lg text-[13px] leading-6 text-[#716958] dark:text-[#b3aa99]">
                Manage the repair advice, warranties, and store policies your AI
                assistant uses to help customers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchArticles()}
                disabled={isLoading}
                className="kb-button kb-button-quiet"
                aria-label="Refresh articles"
                title="Reload articles"
              >
                <RefreshCw
                  size={15}
                  className={isLoading ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isLoading || articles.length === 0}
                className="kb-button"
                title="Export articles on this page"
              >
                <Download size={15} /> Export CSV
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="kb-button kb-button-primary"
              >
                <Plus size={16} /> Add article
              </button>
            </div>
          </div>
        </header>
        <div
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Knowledge overview"
          aria-busy={isLoading}
        >
          {[
            {
              label: hasActiveFilters ? "Matching articles" : "Total articles",
              value: stats.total,
              note: hasActiveFilters
                ? "Across your filtered results"
                : "Across your knowledge base",
              icon: BookOpen
            },
            {
              label: "Active in AI",
              value: stats.active,
              note: "Articles on this page",
              icon: Sparkles
            },
            {
              label: "Categories",
              value: stats.categoriesCount,
              note: "Available topic categories",
              icon: Layers
            },
            {
              label: "Draft articles",
              value: stats.drafts,
              note: "Inactive articles on this page",
              icon: FileText
            }
          ].map(({ label, value, note, icon: Icon }) => (
            <div key={label} className="kb-metric">
              <div className="kb-metric-label">
                <span>{label}</span>
                <Icon
                  size={16}
                  className="text-[#a4803e] dark:text-[#d6b46a]"
                />
              </div>
              <p className="kb-metric-value">
                {isLoading || error ? "..." : value}
              </p>
              <p className="kb-metric-note">{note}</p>
            </div>
          ))}
        </div>

        {successToast && (
          <div
            role="status"
            className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
          >
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
              aria-label="Dismiss notification"
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <section className="mt-7" aria-labelledby="knowledge-library-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h2
                id="knowledge-library-title"
                className="text-base font-semibold"
              >
                Article library
              </h2>
              <span className="rounded-full border border-[#e4ddce] bg-[#fffdf8] px-2 py-0.5 text-[11px] tabular-nums text-[#716958] dark:border-[#363025] dark:bg-[#1a1712] dark:text-[#b3aa99]">
                {isLoading || error ? "..." : totalRecords}
              </span>
            </div>
            <p className="text-xs text-[#716958] dark:text-[#b3aa99]">
              Only active articles are used by the assistant
            </p>
          </div>
          <div className="mb-4 rounded-xl border border-[#e4ddce] bg-[#fffdf8] p-4 dark:border-[#363025] dark:bg-[#1a1712]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_200px_180px]">
              <div className="sm:col-span-2 xl:col-span-1">
                <label
                  htmlFor="knowledge-search"
                  className="mb-2 block text-xs font-medium text-[#716958] dark:text-[#b3aa99]"
                >
                  Search articles
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7f6c]"
                    size={16}
                  />
                  <input
                    id="knowledge-search"
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search titles, symptoms, or tags..."
                    className="h-11 w-full rounded-lg border border-[#d8cdb6] bg-transparent pl-10 pr-3 text-[13px] outline-none placeholder:text-[#8a7f6c] dark:border-[#363025]"
                  />
                </div>
              </div>
              <UniversalDropdown<string>
                menuClassName="kb-dropdown-menu"
                className="kb-filter"
                label="Category"
                options={categoryFilterOptions}
                value={selectedCategory}
                onChange={(value) => {
                  setSelectedCategory(value);
                  setPage(1);
                }}
              />
              <UniversalDropdown<StatusFilterType>
                menuClassName="kb-dropdown-menu"
                className="kb-filter"
                label="AI status"
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              />
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#e4ddce] pt-3 text-xs text-[#716958] dark:border-[#363025] dark:text-[#b3aa99]">
                <span>
                  {isLoading
                    ? "Finding articles..."
                    : totalRecords +
                      " matching article" +
                      (totalRecords === 1 ? "" : "s")}
                  {selectedCategory !== "All" ? " / " + selectedCategory : ""}
                  {statusFilter !== "All"
                    ? " / " +
                      (statusFilter === "Active" ? "Active in AI" : "Drafts")
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-8 items-center gap-1 font-semibold text-[#8a6624] dark:text-[#d6b46a]"
                >
                  <X size={13} /> Clear filters
                </button>
              </div>
            )}
          </div>
          <div aria-busy={isLoading}>
            {error ? (
              <div
                role="alert"
                className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm font-bold text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-400"
              >
                <AlertTriangle size={18} className="shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  className="kb-button"
                  onClick={() => void fetchArticles()}
                >
                  Try again
                </button>
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
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#ded5c2] bg-[#fffdf7] p-16 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ded5c2] bg-[#fbf9f4] text-[#8a6624] dark:border-[#302c24] dark:bg-[#12100d] dark:text-[#d6b46a]">
                  <BookOpen size={28} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#1a160f] dark:text-[#f8f5ee]">
                  No articles found
                </h3>
                <p className="mt-1.5 max-w-md text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  {hasActiveFilters
                    ? "Try a different search or clear your filters to see more articles."
                    : "Add your first repair guide, warranty detail, or store policy to help your assistant answer customers."}
                </p>
                <div className="mt-5 flex gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="rounded-xl border border-[#ded5c2] bg-white px-4 py-2 text-xs font-semibold text-[#1f1a12] transition hover:bg-[#faf7f0] dark:border-[#302c24] dark:bg-[#15120c] dark:text-[#f8f5ee] cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="rounded-xl bg-[#1f1a12] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#382f21] dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#dfc383] cursor-pointer"
                  >
                    + Add New Article
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((art) => {
                  const isExpanded = expandedCardIds.has(art.storeKnowledgeId);
                  const theme = getCategoryTheme(art.category);
                  const tags = (art.tags || "")
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean);
                  const contentId = "article-content-" + art.storeKnowledgeId;
                  return (
                    <article key={art.storeKnowledgeId} className="kb-article">
                      <div className="p-4 sm:px-5 sm:pt-5">
                        <div className="flex items-start gap-3">
                          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e8dfca] bg-[#f6f0e3] text-[#947035] dark:border-[#423724] dark:bg-[#2b2418] dark:text-[#d6b46a] sm:flex">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0 flex-1 break-words">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span
                                className={
                                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium " +
                                  theme.badge
                                }
                              >
                                {theme.icon}
                                {art.category}
                              </span>
                              <span
                                className={
                                  "inline-flex items-center gap-1.5 text-[11px] font-medium " +
                                  (art.isActive
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-[#716958] dark:text-[#b3aa99]")
                                }
                              >
                                {art.isActive ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                                ) : (
                                  <EyeOff size={12} />
                                )}
                                {art.isActive ? "Active in AI" : "Draft"}
                              </span>
                            </div>
                            <h3 className="text-[15px] font-semibold leading-6 text-[#292218] dark:text-[#f2eadc]">
                              <button
                                type="button"
                                className="text-left hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
                                aria-expanded={isExpanded}
                                aria-controls={contentId}
                                onClick={() =>
                                  toggleCardExpand(art.storeKnowledgeId)
                                }
                              >
                                {art.title}
                              </button>
                            </h3>
                            <div id={contentId} className="mt-2">
                              {renderArticleContent(art.content, isExpanded)}
                            </div>
                            {tags.length > 0 && (
                              <div
                                className="mt-3 flex flex-wrap items-center gap-1.5"
                                aria-label="Article tags"
                              >
                                {(isExpanded ? tags : tags.slice(0, 3)).map(
                                  (tag, index) => (
                                    <span key={index} className="kb-tag">
                                      {tag.replace(/^#/, "")}
                                    </span>
                                  )
                                )}
                                {!isExpanded && tags.length > 3 && (
                                  <span className="text-[11px] text-[#716958] dark:text-[#b3aa99]">
                                    +{tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[#eee8dc] px-4 py-2.5 dark:border-[#302a20] sm:px-5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#716958] dark:text-[#b3aa99]">
                          <span>
                            {art.updatedAt ? "Updated" : "Created"}{" "}
                            <time dateTime={art.updatedAt || art.createdAt}>
                              {formatDate(art.updatedAt || art.createdAt)}
                            </time>
                          </span>
                          <button
                            type="button"
                            className="inline-flex min-h-8 items-center gap-1 font-medium text-[#8a6624] dark:text-[#d6b46a]"
                            aria-expanded={isExpanded}
                            aria-controls={contentId}
                            onClick={() =>
                              toggleCardExpand(art.storeKnowledgeId)
                            }
                          >
                            {isExpanded ? "Show less" : "Read article"}
                            {isExpanded ? (
                              <ChevronUp size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )}
                          </button>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            className="kb-button kb-button-quiet"
                            onClick={() => setPreviewArticle(art)}
                            aria-label={"Preview AI context for " + art.title}
                          >
                            <Sparkles size={14} />
                            <span className="hidden sm:inline">AI preview</span>
                          </button>
                          <button
                            type="button"
                            className="kb-button"
                            onClick={() => openEditModal(art)}
                            aria-label={"Edit " + art.title}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <details
                            className="kb-more relative"
                            onBlur={(event) => {
                              if (
                                !event.currentTarget.contains(
                                  event.relatedTarget
                                )
                              )
                                event.currentTarget.open = false;
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                event.currentTarget.open = false;
                                event.currentTarget
                                  .querySelector("summary")
                                  ?.focus();
                              }
                            }}
                          >
                            <summary
                              className="kb-button kb-button-quiet px-2"
                              aria-label={"More actions for " + art.title}
                              title="More actions"
                            >
                              <MoreHorizontal size={18} />
                            </summary>
                            <div className="kb-actions-menu">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(art.storeKnowledgeId, art.content)
                                }
                              >
                                {copiedId === art.storeKnowledgeId ? (
                                  <Check size={14} />
                                ) : (
                                  <Copy size={14} />
                                )}
                                {copiedId === art.storeKnowledgeId
                                  ? "Copied"
                                  : "Copy article text"}
                              </button>
                              <button
                                type="button"
                                disabled={togglingIds.has(art.storeKnowledgeId)}
                                onClick={() =>
                                  void handleToggleActive(art.storeKnowledgeId)
                                }
                              >
                                {togglingIds.has(art.storeKnowledgeId) ? (
                                  <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : art.isActive ? (
                                  <EyeOff size={14} />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                                {art.isActive
                                  ? "Move to draft"
                                  : "Activate in AI"}
                              </button>
                              <div className="my-1 border-t border-[#e4ddce] dark:border-[#363025]" />
                              <button
                                type="button"
                                className="text-rose-700 dark:text-rose-400"
                                onClick={() => setDeleteTarget(art)}
                              >
                                <Trash2 size={14} /> Delete article
                              </button>
                            </div>
                          </details>
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          {!isLoading && !error && totalRecords > 0 && totalPages === 1 && (
            <p className="mt-4 text-xs text-[#716958] dark:text-[#b3aa99]">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, totalRecords)} of {totalRecords}{" "}
              articles
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#716958] dark:text-[#b3aa99]">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, totalRecords)} of {totalRecords}{" "}
                articles
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3.5 py-1.5 text-xs font-semibold text-[#1f1a12] transition hover:bg-[#fff4cc] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712] cursor-pointer"
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
                      aria-current={pNum === page ? "page" : undefined}
                      aria-label={"Go to page " + pNum}
                      disabled={isLoading}
                      onClick={() => setPage(pNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
                  className="rounded-xl bg-[#1f1a12] px-3.5 py-1.5 text-xs font-semibold text-[#f7f5ef] transition hover:bg-[#382f21] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </section>

      {/* Article editor */}
      {isModalOpen && (
        <KnowledgeDialog
          label={
            editingArticle
              ? "Edit knowledge article"
              : "Create knowledge article"
          }
          onClose={() => setIsModalOpen(false)}
          busy={isSubmitting}
        >
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-2xl dark:border-[#383125] dark:bg-[#161410] text-left sm:p-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ded5c2] pb-4 dark:border-[#302c24]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f1a12] text-[#d6b46a] dark:bg-[#d6b46a] dark:text-[#11110f]">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1a160f] dark:text-[#f8f5ee]">
                    {editingArticle
                      ? "Edit Knowledge Article"
                      : "New AI Knowledge Article"}
                  </h3>
                  <p className="text-xs font-semibold text-[#786d5b] dark:text-[#a89d87]">
                    Add clear, accurate information for the customer assistant.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close article editor"
                className="rounded-xl p-1.5 text-[#8a7f6c] transition hover:bg-[#f0ebd8] hover:text-[#1a160f] dark:hover:bg-[#201a13] dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="mt-5 space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="article-title"
                  className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]"
                >
                  Article title{" "}
                  <span className="text-red-500 font-semibold">*</span>
                </label>
                <input
                  id="article-title"
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
                  menuClassName="kb-dropdown-menu"
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
                    <label
                      htmlFor="article-category"
                      className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]"
                    >
                      New Category Name{" "}
                      <span className="text-red-500 font-semibold">*</span>
                    </label>
                    <input
                      id="article-category"
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
                <label
                  htmlFor="article-tags"
                  className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]"
                >
                  Tags (comma separated)
                </label>
                <input
                  id="article-tags"
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
                  <label
                    htmlFor="article-content"
                    className="block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]"
                  >
                    Article content{" "}
                    <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <span className="text-xs font-semibold text-[#8a7f6c] dark:text-[#8e8574]">
                    {formData.content.length} characters
                  </span>
                </div>
                <textarea
                  id="article-content"
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
                  <p className="text-sm font-semibold text-[#1a160f] dark:text-[#f8f5ee]">
                    Use in AI answers
                  </p>
                  <p className="text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                    Active articles help the assistant answer customer
                    questions.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label="Use this article in AI answers"
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
                  disabled={isSubmitting}
                  aria-label="Close article editor"
                  className="rounded-xl border border-[#ded5c2] bg-white px-5 py-2.5 text-xs font-semibold text-[#6f6758] transition hover:bg-[#faf7f0] dark:border-[#302c24] dark:bg-[#14110d] dark:text-[#a8a093] dark:hover:bg-[#201a13] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#1f1a12] px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#382f21] active:scale-95 disabled:opacity-50 dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#dfc383] cursor-pointer"
                >
                  {isSubmitting && (
                    <RefreshCw size={13} className="animate-spin" />
                  )}
                  <span>
                    {editingArticle ? "Save Changes" : "Create article"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </KnowledgeDialog>
      )}

      {/* AI context preview */}
      {previewArticle && (
        <KnowledgeDialog
          label="AI context preview"
          onClose={() => setPreviewArticle(null)}
        >
          <div className="w-full max-w-xl rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-2xl dark:border-[#383125] dark:bg-[#161410] text-left sm:p-7">
            <div className="flex items-center justify-between border-b border-[#ded5c2] pb-3.5 dark:border-[#302c24]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d6b46a]/20 text-[#8a6624] dark:text-[#d6b46a]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1a160f] dark:text-[#f8f5ee]">
                    AI context preview
                  </h3>
                  <p className="text-[11px] font-semibold text-[#786d5b] dark:text-[#a89d87]">
                    Review the information available to your AI assistant.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                aria-label="Close AI preview"
                className="rounded-xl p-1.5 text-[#8a7f6c] hover:text-[#1a160f] dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="rounded-xl border border-[#ded5c2] bg-[#fbf9f4] p-3 text-xs dark:border-[#302c24] dark:bg-[#12100d]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a6624] dark:text-[#d6b46a]">
                  Article details
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
                      AI status:
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#786d5b] dark:text-[#a89d87] mb-1.5">
                  Article content
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
                Preview of saved article content
              </span>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                aria-label="Close AI preview"
                className="rounded-xl bg-[#1f1a12] px-4 py-2 text-xs font-semibold text-white dark:bg-[#d6b46a] dark:text-[#11110f] cursor-pointer"
              >
                Close preview
              </button>
            </div>
          </div>
        </KnowledgeDialog>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <KnowledgeDialog
          label="Delete knowledge article"
          onClose={() => setDeleteTarget(null)}
          busy={isDeleting}
        >
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-[#fffdf7] p-6 shadow-2xl dark:border-rose-400/40 dark:bg-[#161410] text-left">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1a160f] dark:text-[#f8f5ee]">
                  Delete Knowledge Article?
                </h3>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="mt-3.5 text-xs font-semibold leading-relaxed text-[#786d5b] dark:text-[#a89d87]">
              Are you sure you want to permanently remove{" "}
              <strong className="text-[#1a160f] dark:text-white font-semibold">
                "{deleteTarget.title}"
              </strong>
              ? It will be removed from the database and immediately purged from
              the AI chatbot's vector grounding cache.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-xl border border-[#ded5c2] bg-white px-4 py-2 text-xs font-semibold text-[#786d5b] transition hover:bg-[#faf7f0] dark:border-[#302c24] dark:bg-[#1d1812] dark:text-[#a89d87] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting && <RefreshCw size={13} className="animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </KnowledgeDialog>
      )}
    </div>
  );
}

function KnowledgeDialog({
  children,
  label,
  onClose,
  busy = false
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
  busy?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    const restore =
      active?.closest("details")?.querySelector("summary") || active;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current
      ?.querySelector<HTMLElement>("input, textarea, button")
      ?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      restore?.focus();
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="kb-dialog fixed inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onKeyDown={(event) => {
        if (event.defaultPrevented) return;
        if (event.key === "Escape" && !busy) {
          event.stopPropagation();
          onClose();
        }
        if (event.key === "Tab") {
          const controls = Array.from(
            dialogRef.current?.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
            ) || []
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      {children}
    </div>
  );
}
