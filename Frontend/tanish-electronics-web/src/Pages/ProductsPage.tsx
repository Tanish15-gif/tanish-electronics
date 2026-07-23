import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { getProducts, type ProductListItem } from "../Services/productService";
import UniversalDropdown, {
  type DropdownOption
} from "../components/UI/UniversalDropdown";
import { useShopSettings } from "../hooks/useShopSettings";

type SortOption = "Recommended" | "PriceLow" | "PriceHigh" | "Name";

const sortOptions: DropdownOption<SortOption>[] = [
  {
    value: "Recommended",
    label: "Recommended"
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
    label: "Product name"
  }
];

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

  const categoryOptions = useMemo<DropdownOption<string>[]>(
    () =>
      categories.map((category) => ({
        value: category,
        label: category === "All" ? "All categories" : category
      })),
    [categories]
  );

  const conditionOptions = useMemo<DropdownOption<string>[]>(
    () =>
      conditions.map((condition) => ({
        value: condition,
        label: condition === "All" ? "All conditions" : condition
      })),
    [conditions]
  );

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
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Compact page header */}
        <header className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] px-5 py-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:px-7 sm:py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                In-store products
              </p>

              <h1 className="font-display mt-2 text-4xl font-bold leading-none tracking-tight sm:text-5xl">
                Products available
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Browse second-hand TVs, remotes and electronics accessories
                currently listed by Tanish Electronics.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {!loading && (
                <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 text-sm font-black text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"}
                </span>
              )}

              <a
                href="tel:8850973399"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                Call shop
              </a>
            </div>
          </div>
        </header>

        {/* Search and mobile filters */}
        <section className="mt-5 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_220px_auto] lg:items-end">
            <div>
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>

              <div className="relative">
                <SearchIcon />

                <input
                  id="product-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product, brand or model..."
                  className="min-h-12 w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] py-3 pl-11 pr-11 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#817a6e]"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear product search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] hover:text-[#1f1a12] dark:text-[#928a7d] dark:hover:bg-[#242016] dark:hover:text-[#e8e3d8]"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            <UniversalDropdown<SortOption>
              label="Sort"
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
            />
          </div>

          {/* Mobile and tablet dropdown filters */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:hidden">
            <UniversalDropdown<string>
              label="Category"
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />

            <UniversalDropdown<string>
              label="Condition"
              options={conditionOptions}
              value={selectedCondition}
              onChange={setSelectedCondition}
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-12 rounded-xl border border-[#d8cdb6] bg-transparent px-5 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

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
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            {/* Desktop filters */}
            <aside className="sticky top-24 hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] lg:block">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Filters</h2>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-black text-[#8a6624] transition hover:text-[#5e4315] dark:text-[#d6b46a]"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="mt-5">
                <FilterGroup
                  title="Category"
                  items={categories}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>

              <div className="my-6 h-px bg-[#d8cdb6] dark:bg-[#302c24]" />

              <FilterGroup
                title="Condition"
                items={conditions}
                selected={selectedCondition}
                onSelect={setSelectedCondition}
              />
            </aside>

            {/* Product results */}
            <section className="min-w-0">
              <div className="mb-5 flex flex-col gap-2 border-b border-[#d8cdb6] pb-4 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-black">
                  {visibleProducts.length}{" "}
                  {visibleProducts.length === 1 ? "product" : "products"}
                </p>

                <p className="text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  Availability may change. Confirm before visiting.
                </p>
              </div>

              {visibleProducts.length === 0 ? (
                <EmptyProducts
                  onClear={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
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

  return (
    <Link
      to={`/products/${product.productId}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#c8b98f] hover:shadow-xl hover:shadow-[#d8cdb6]/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b] dark:hover:shadow-black/30"
    >
      {/* Product image */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-[#d8cdb6] bg-[#f3efe6] p-5 dark:border-[#302c24] dark:bg-[#0f0e0c]">
        {product.primaryImageUrl ? (
          <img
            src={getProductImageUrl(product.primaryImageUrl)}
            alt={product.productName}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#fff4cc] text-3xl font-black text-[#7a570f] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
            {product.productName.trim().charAt(0).toUpperCase()}
          </div>
        )}

        <span className="absolute left-3 top-3 max-w-[65%] truncate rounded-full border border-[#d8cdb6] bg-[#fffdf7]/95 px-3 py-1.5 text-[10px] font-black text-[#725522] shadow-sm backdrop-blur dark:border-[#302c24] dark:bg-[#1a1712]/95 dark:text-[#d6b46a]">
          {product.categoryName}
        </span>

        <span className="absolute right-3 top-3 rounded-full border border-emerald-200 bg-emerald-50/95 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 backdrop-blur dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          Available
        </span>
      </div>

      {/* Product information */}
      <div className="flex flex-1 flex-col p-5">
        <Badge>{product.conditionName}</Badge>

        <h2 className="mt-3 line-clamp-2 text-2xl font-black leading-tight tracking-[-0.025em] transition group-hover:text-[#8a6624] dark:group-hover:text-[#d6b46a]">
          {product.productName}
        </h2>

        <p className="mt-2 truncate text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
          {productDetails}
        </p>

        <p className="mt-4 text-xs font-semibold leading-5 text-[#817867] dark:text-[#928a7d]">
          View complete condition and product details before visiting.
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-[#e4dac5] pt-5 dark:border-[#302c24]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8a6624] dark:text-[#d6b46a]">
              Price
            </p>

            <p className="mt-1 text-2xl font-black">
              {formatPrice(product.price)}
            </p>
          </div>

          <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-4 text-xs font-black text-[#f7f5ef] transition group-hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:group-hover:bg-[#d6b46a]">
            View details
            <ArrowRightIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

type FilterGroupProps = {
  title: string;
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
};

function FilterGroup({ title, items, selected, onSelect }: FilterGroupProps) {
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
        {title}
      </h3>

      <div className="mt-3 space-y-1.5">
        {items.map((item) => {
          const active = selected === item;

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

              {active && <CheckIcon />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductsLoading() {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:ml-[264px] 2xl:grid-cols-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
        >
          <div className="aspect-[4/3] animate-pulse bg-[#eee5d4] dark:bg-[#242016]" />

          <div className="p-5">
            <div className="h-5 w-20 animate-pulse rounded-full bg-[#eee5d4] dark:bg-[#302c24]" />
            <div className="mt-4 h-7 w-4/5 animate-pulse rounded-lg bg-[#eee5d4] dark:bg-[#302c24]" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded-lg bg-[#eee5d4] dark:bg-[#302c24]" />
            <div className="mt-8 h-12 animate-pulse rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
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

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
        >
          Clear all filters
        </button>
      )}
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8f8677]"
    >
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2"
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

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
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
