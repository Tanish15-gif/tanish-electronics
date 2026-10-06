import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Check,
  X,
  Search,
  ChevronDown,
  MessageSquare
} from "lucide-react";
import { getProducts, type ProductListItem } from "../Services/productService";
import { useShopSettings } from "../hooks/useShopSettings";
import TanishElectronicsLogo from "../components/common/TanishElectronicsLogo";

type SortOption = "Recommended" | "PriceLow" | "PriceHigh" | "Name";

const sortOptions: { value: SortOption; label: string }[] = [
  {
    value: "Recommended",
    label: "Featured"
  },
  {
    value: "PriceLow",
    label: "Price: Low to High"
  },
  {
    value: "PriceHigh",
    label: "Price: High to Low"
  },
  {
    value: "Name",
    label: "Product Name"
  }
];

function AmazonSortSelect({
  value,
  onChange,
  options
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
  options: { value: SortOption; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center text-xs font-bold"
    >
      <span className="mr-1.5 hidden text-[#817867] sm:inline dark:text-[#928a7d]">
        Sort by:
      </span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Sort products"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d8cdb6] bg-[#fffaf0] px-3 py-1.5 text-xs font-bold text-[#1f1a12] shadow-2xs transition hover:border-[#c8b98f] hover:bg-[#f2eadb] focus:border-[#d6b46a] focus:ring-2 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:border-[#50483b] dark:hover:bg-[#1a1712] cursor-pointer"
      >
        <span className="sm:hidden text-[#817867] dark:text-[#928a7d]">
          Sort:
        </span>
        <span className="truncate max-w-[120px] sm:max-w-none">
          {selected.label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#817867] transition-transform duration-200 dark:text-[#928a7d] ${
            open ? "rotate-180 text-[#8a6624] dark:text-[#d6b46a]" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-[#d8cdb6] bg-[#fffdf7] py-1 shadow-xl dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#817867] dark:text-[#928a7d]">
            Sort by
          </div>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs font-bold text-left transition cursor-pointer ${
                  active
                    ? "bg-[#1f1a12] text-[#f7f5ef] dark:bg-[#d6b46a] dark:text-[#11110f]"
                    : "text-[#1f1a12] hover:bg-[#f2eadb] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
                }`}
              >
                <span>{option.label}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("Recommended");
  const { settings } = useShopSettings();

  useEffect(() => {
    document.title = `Products | ${settings.shopName}`;

    return () => {
      document.title = `${settings.shopName}`;
    };
  });

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.categoryName).filter(Boolean))
    );

    return ["All", ...uniqueCategories];
  }, [products]);

  const conditions = useMemo(() => {
    const uniqueConditions = Array.from(
      new Set(products.map((product) => product.conditionName).filter(Boolean))
    );

    return ["All", ...uniqueConditions];
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    counts.set("All", products.length);

    products.forEach((product) => {
      if (!product.categoryName) return;

      counts.set(
        product.categoryName,
        (counts.get(product.categoryName) ?? 0) + 1
      );
    });

    return counts;
  }, [products]);

  const conditionCounts = useMemo(() => {
    const counts = new Map<string, number>();

    counts.set("All", products.length);

    products.forEach((product) => {
      if (!product.conditionName) return;

      counts.set(
        product.conditionName,
        (counts.get(product.conditionName) ?? 0) + 1
      );
    });

    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.categoryName === selectedCategory;

      const matchesCondition =
        selectedCondition === "All" ||
        product.conditionName === selectedCondition;

      const searchableText = [
        product.productName,
        product.brand,
        product.modelName,
        product.categoryName,
        product.conditionName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchText === "" || searchableText.includes(searchText);

      return matchesCategory && matchesCondition && matchesSearch;
    });

    const sorted = [...filtered];

    switch (sortBy) {
      case "PriceLow":
        return sorted.sort((first, second) => first.price - second.price);

      case "PriceHigh":
        return sorted.sort((first, second) => second.price - first.price);

      case "Name":
        return sorted.sort((first, second) =>
          first.productName.localeCompare(second.productName)
        );

      default:
        return sorted;
    }
  }, [products, search, selectedCategory, selectedCondition, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedCondition !== "All" ||
    sortBy !== "Recommended";

  function clearFilters() {
    setSearch("");
    setSelectedCategory("All");
    setSelectedCondition("All");
    setSortBy("Recommended");
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  function getProductImageUrl(imageUrl?: string | null) {
    if (!imageUrl) {
      return "";
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

    return `${baseUrl}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto w-full max-w-[1720px] px-4 pt-3 pb-12 sm:px-8 sm:pt-4 lg:px-12 xl:px-16 2xl:px-20 lg:pt-5">
        {/* Amazon-style Straightforward Header: Search Bar + Mobile Category Strip */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#817867] dark:text-[#928a7d]">
              <Search className="h-4 w-4" />
            </div>
            <input
              id="product-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, brands, or models (e.g. Sony, Magic Remote)..."
              className="h-11 sm:h-12 w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] pl-10 pr-10 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#817a6e]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear product search"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#817867] hover:text-[#1f1a12] dark:text-[#928a7d] dark:hover:text-[#e8e3d8] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile 1-Tap Category Horizontal Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none lg:hidden">
            {categories.map((category) => {
              const active = selectedCategory === category;
              const count = categoryCounts.get(category) ?? 0;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    active
                      ? "bg-[#1f1a12] text-[#f7f5ef] shadow-xs dark:bg-[#d6b46a] dark:text-[#11110f]"
                      : "border border-[#d8cdb6] bg-[#fffaf0] text-[#6f6758] hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]"
                  }`}
                >
                  <span>{category === "All" ? "All Items" : category}</span>
                  <span className="text-[10px] tabular-nums font-black opacity-75">
                    ({count})
                  </span>
                </button>
              );
            })}

            <Link
              to="/book-repair"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#d6b46a] bg-[#fff8e7] px-3.5 py-1.5 text-xs font-bold text-[#8a6624] transition hover:bg-[#f2eadb] dark:border-[#d6b46a]/50 dark:bg-[#1f1a12] dark:text-[#d6b46a]"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#d6b46a]" />
              <span>Enquire for parts</span>
            </Link>
          </div>
        </div>

        {loading && <ProductsLoading />}

        {error && (
          <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            <p className="text-sm font-black">Products could not be loaded</p>
            <p className="mt-1 text-xs font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-800 dark:bg-red-300 dark:text-red-950"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-4 sm:mt-6 grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
            {/* Desktop Left Filters Sidebar */}
            <aside className="sticky top-28 hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] lg:block">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-[#1f1a12] dark:text-[#f7f5ef]">
                  Filters
                </h2>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-black text-[#8a6624] transition hover:text-[#5e4315] dark:text-[#d6b46a] cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="mt-4">
                <FilterGroup
                  title="Category"
                  items={categories}
                  counts={categoryCounts}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>

              <div className="my-5 h-px bg-[#d8cdb6] dark:bg-[#302c24]" />

              <FilterGroup
                title="Condition"
                items={conditions}
                counts={conditionCounts}
                selected={selectedCondition}
                onSelect={setSelectedCondition}
              />
            </aside>

            {/* Right Section: Amazon-style Results & Sort Bar + Product Grid */}
            <section className="min-w-0">
              {/* Amazon-style Toolbar: Results Count on Left, Sort by on Right */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8cdb6]/60 pb-3 dark:border-[#302c24]">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#1f1a12] dark:text-[#e8e3d8]">
                    {search.trim() ? (
                      <span>
                        {visibleProducts.length}{" "}
                        {visibleProducts.length === 1 ? "result" : "results"}{" "}
                        for &ldquo;
                        <span className="font-black text-[#8a6624] dark:text-[#d6b46a]">
                          {search.trim()}
                        </span>
                        &rdquo;
                      </span>
                    ) : (
                      <span>
                        <span className="font-black">
                          {visibleProducts.length}
                        </span>{" "}
                        {visibleProducts.length === 1 ? "product" : "products"}{" "}
                        available
                      </span>
                    )}
                  </p>
                </div>

                <AmazonSortSelect
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                />
              </div>

              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#817867] dark:text-[#928a7d]">
                    Active:
                  </span>

                  {search.trim() && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#d8cdb6] bg-[#f2eadb] px-2.5 py-0.5 text-[11px] font-bold text-[#1f1a12] dark:border-[#383124] dark:bg-[#242016] dark:text-[#e8e3d8]">
                      <span>&ldquo;{search.trim()}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Remove search filter"
                        className="cursor-pointer hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {selectedCategory !== "All" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#d8cdb6] bg-[#f2eadb] px-2.5 py-0.5 text-[11px] font-bold text-[#1f1a12] dark:border-[#383124] dark:bg-[#242016] dark:text-[#e8e3d8]">
                      <span>{selectedCategory}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("All")}
                        aria-label="Remove category filter"
                        className="cursor-pointer hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {selectedCondition !== "All" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#d8cdb6] bg-[#f2eadb] px-2.5 py-0.5 text-[11px] font-bold text-[#1f1a12] dark:border-[#383124] dark:bg-[#242016] dark:text-[#e8e3d8]">
                      <span>{selectedCondition}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCondition("All")}
                        aria-label="Remove condition filter"
                        className="cursor-pointer hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {sortBy !== "Recommended" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#d8cdb6] bg-[#f2eadb] px-2.5 py-0.5 text-[11px] font-bold text-[#1f1a12] dark:border-[#383124] dark:bg-[#242016] dark:text-[#e8e3d8]">
                      <span>
                        Sort:{" "}
                        {sortOptions.find((o) => o.value === sortBy)?.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSortBy("Recommended")}
                        aria-label="Reset sort"
                        className="cursor-pointer hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-1 text-[11px] font-black text-[#8a6624] hover:underline dark:text-[#d6b46a] cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Product Grid / Mobile Horizontal Listing */}
              <div className="mt-4">
                {visibleProducts.length === 0 ? (
                  <EmptyProducts
                    onClear={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                ) : (
                  <div className="flex flex-col gap-3 sm:grid sm:gap-6 sm:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
                    {visibleProducts.map((product) => (
                      <ProductCard
                        key={product.productId}
                        product={product}
                        formatPrice={formatPrice}
                        getProductImageUrl={getProductImageUrl}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

type ProductCardProps = {
  product: ProductListItem;
  formatPrice: (price: number) => string;
  getProductImageUrl: (imageUrl?: string | null) => string;
};

function ProductCard({
  product,
  formatPrice,
  getProductImageUrl
}: ProductCardProps) {
  const productDetails =
    [product.brand, product.modelName].filter(Boolean).join(" • ") ||
    "Details available";

  const isInStock = product.isAvailable && product.stockQuantity > 0;
  const isLowStock = isInStock && product.stockQuantity <= 2;

  return (
    <Link
      to={`/products/${product.productId}`}
      className="group flex min-w-0 flex-row sm:flex-col overflow-hidden rounded-2xl sm:rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-xs sm:shadow-sm transition duration-300 hover:border-[#c8b98f] hover:shadow-lg hover:shadow-[#d8cdb6]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b] dark:hover:shadow-black/40"
    >
      {/* Product image - compact square thumbnail on mobile, 4/3 hero on desktop */}
      <div className="relative flex aspect-square sm:aspect-[4/3] w-[125px] xs:w-[145px] sm:w-full shrink-0 items-center justify-center overflow-hidden border-r sm:border-r-0 sm:border-b border-[#d8cdb6] bg-gradient-to-b from-[#f3efe6] to-[#eae3d1] p-2.5 sm:p-6 dark:border-[#302c24] dark:from-[#0f0e0c] dark:to-[#151310]">
        {product.primaryImageUrl ? (
          <img
            src={getProductImageUrl(product.primaryImageUrl)}
            alt={product.productName}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain drop-shadow-sm transition duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 text-center">
            <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-[#d8cdb6]/60 bg-[#1f1a12] p-1 shadow-sm dark:border-[#383124] dark:bg-[#161410]">
              <TanishElectronicsLogo className="h-full w-full rounded-lg sm:rounded-xl object-cover" />
            </div>
            <span className="text-[9px] sm:text-[11px] font-bold text-[#817867] dark:text-[#928a7d]">
              Workshop Verified
            </span>
          </div>
        )}

        {/* Desktop Badges (hidden on mobile to keep the left image thumbnail clean) */}
        <div className="absolute inset-x-3 top-3 hidden sm:flex items-center justify-between gap-2">
          <span className="min-w-0 max-w-[55%] truncate rounded-full border border-[#d8cdb6] bg-[#fffdf7]/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#725522] shadow-sm backdrop-blur dark:border-[#302c24] dark:bg-[#1a1712]/95 dark:text-[#d6b46a]">
            {product.categoryName}
          </span>

          {isInStock ? (
            isLowStock ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-1 text-[10px] font-black text-amber-700 shadow-sm backdrop-blur dark:border-amber-400/35 dark:bg-amber-400/20 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Only {product.stockQuantity} left
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-400/35 dark:bg-emerald-400/20 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                In Stock
              </span>
            )
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-500/15 px-2.5 py-1 text-[10px] font-black text-rose-700 shadow-sm backdrop-blur dark:border-rose-400/35 dark:bg-rose-400/20 dark:text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Out of Stock
            </span>
          )}
        </div>

        {/* Featured Product Badge - compact on mobile, full on desktop */}
        {product.isFeatured && (
          <div className="absolute left-1.5 top-1.5 sm:left-3 sm:bottom-3 sm:top-auto">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#d6b46a]/60 bg-[#1f1a12]/90 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-black text-[#d6b46a] shadow-md backdrop-blur">
              <Sparkles size={10} className="text-[#d6b46a]" />
              <span className="hidden xs:inline">Featured</span>
            </span>
          </div>
        )}
      </div>

      {/* Product information - horizontal right column on mobile, bottom on desktop */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-3 xs:p-3.5 sm:p-6">
        <div>
          {/* Category, Condition & Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="sm:hidden rounded-full border border-[#d8cdb6] bg-[#f2eadb] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#725522] dark:border-[#383124] dark:bg-[#242016] dark:text-[#d6b46a]">
              {product.categoryName}
            </span>
            <Badge>{product.conditionName}</Badge>
            {product.brand && (
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8a6624] dark:text-[#d6b46a]">
                {product.brand}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h2 className="mt-1 sm:mt-3 line-clamp-2 text-sm xs:text-base sm:text-2xl font-black leading-snug tracking-tight text-[#1f1a12] transition group-hover:text-[#8a6624] dark:text-[#f7f5ef] dark:group-hover:text-[#d6b46a]">
            {product.productName}
          </h2>

          {/* Model / Subtitle */}
          <p className="mt-0.5 sm:mt-2 line-clamp-1 text-[11px] sm:text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            {productDetails}
          </p>

          {/* Mobile Stock status indicator */}
          <div className="mt-1.5 sm:hidden">
            {isInStock ? (
              isLowStock ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Only {product.stockQuantity} left
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  In Stock
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 dark:text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Price & Action footer */}
        <div className="mt-2.5 sm:mt-auto flex items-center sm:items-end justify-between gap-2 border-t border-[#e4dac5] pt-2 sm:pt-5 dark:border-[#302c24]">
          <div>
            <p className="hidden sm:block text-[10px] font-black uppercase tracking-[0.15em] text-[#8a6624] dark:text-[#d6b46a]">
              Price
            </p>

            <p className="text-base xs:text-lg sm:text-2xl font-black tabular-nums tracking-tight text-[#1f1a12] dark:text-[#f7f5ef]">
              {formatPrice(product.price)}
            </p>
          </div>

          <span className="inline-flex h-8 sm:h-10 shrink-0 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-[#1f1a12] px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-black text-[#f7f5ef] transition group-hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:group-hover:bg-[#d6b46a]">
            <span>View</span>
            <ArrowRightIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

type FilterGroupProps = {
  title: string;
  items: string[];
  counts: Map<string, number>;
  selected: string;
  onSelect: (value: string) => void;
};

function FilterGroup({
  title,
  items,
  counts,
  selected,
  onSelect
}: FilterGroupProps) {
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
        {title}
      </h3>

      <div className="mt-3 space-y-1.5">
        {items.map((item) => {
          const active = selected === item;
          const count = counts.get(item) ?? 0;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-bold transition ${
                active
                  ? "bg-[#1f1a12] text-[#f7f5ef] dark:bg-[#d6b46a] dark:text-[#11110f]"
                  : "text-[#6f6758] hover:bg-[#f2eadb] dark:text-[#a8a093] dark:hover:bg-[#242016]"
              }`}
            >
              <span className="truncate">
                {item === "All" ? `All ${title.toLowerCase()}` : item}
              </span>

              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={`text-[11px] font-black tabular-nums ${
                    active
                      ? "text-[#f7f5ef]/70 dark:text-[#11110f]/60"
                      : "text-[#a8a093] dark:text-[#817a6e]"
                  }`}
                >
                  {count}
                </span>

                {active && <CheckIcon />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductsLoading() {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:grid sm:gap-6 sm:grid-cols-2 lg:ml-[284px] 2xl:grid-cols-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-row sm:flex-col overflow-hidden rounded-2xl sm:rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
        >
          <div className="w-[125px] xs:w-[145px] sm:w-full shrink-0 aspect-square sm:aspect-[4/3] animate-pulse bg-[#eee5d4] dark:bg-[#242016]" />

          <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-6">
            <div>
              <div className="h-4 sm:h-5 w-20 animate-pulse rounded-full bg-[#eee5d4] dark:bg-[#302c24]" />
              <div className="mt-2 sm:mt-4 h-5 sm:h-7 w-4/5 animate-pulse rounded-lg bg-[#eee5d4] dark:bg-[#302c24]" />
              <div className="mt-1.5 sm:mt-3 h-3.5 sm:h-4 w-1/2 animate-pulse rounded-lg bg-[#eee5d4] dark:bg-[#302c24]" />
            </div>
            <div className="mt-3 sm:mt-8 h-8 sm:h-12 animate-pulse rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyProducts({
  onClear,
  hasActiveFilters
}: {
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-[#d8cdb6] bg-[#fffdf7] px-6 py-14 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <SearchIconStatic />
      </div>

      <h2 className="mt-5 text-xl font-black">No matching products</h2>

      <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        Try another search or change the selected filters.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
          >
            Clear all filters
          </button>
        )}
        <Link
          to="/book-repair"
          className="rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 py-3 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#161410] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
        >
          Enquire with Workshop
        </Link>
      </div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="w-fit rounded-full border border-[#d8cdb6] bg-[#fff8e7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
      {children}
    </span>
  );
}

function SearchIconStatic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="m16.5 16.5 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="m5 12.5 4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ProductsPage;
