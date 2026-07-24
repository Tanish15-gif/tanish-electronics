import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { Link } from "react-router-dom";
import ActionButton from "../../components/UI/ActionButton";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import {
  deleteAdminProduct,
  getAdminProducts,
  getProductCategories,
  getProductConditions,
  type AdminProductListItem
} from "../../Services/adminProductService";
import type { LookUpItem } from "../../Services/serviceRequestService";
import { exportProducts } from "../../Services/adminExportService";

function AdminProductsPage() {
  const { getToken } = useApiAuth();

  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [categories, setCategories] = useState<LookUpItem[]>([]);
  const [conditions, setConditions] = useState<LookUpItem[]>([]);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [categoryId, setCategoryId] = useState(0);
  const [conditionId, setConditionId] = useState(0);

  const [productToDelete, setProductToDelete] =
    useState<AdminProductListItem | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const startRecord = totalRecords === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endRecord = Math.min(pageNumber * pageSize, totalRecords);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    document.title = "Products | Tanish Electronics Admin";

    return () => {
      document.title = "Tanish Electronics";
    };
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  const categoryOptions = useMemo<DropdownOption<number>[]>(
    () => [
      {
        value: 0,
        label: "All categories"
      },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name
      }))
    ],
    [categories]
  );

  const conditionOptions = useMemo<DropdownOption<number>[]>(
    () => [
      {
        value: 0,
        label: "All conditions"
      },
      ...conditions.map((condition) => ({
        value: condition.id,
        label: condition.name
      }))
    ],
    [conditions]
  );

  const availableCount = useMemo(
    () => products.filter((product) => product.isAvailable).length,
    [products]
  );

  const hiddenCount = products.length - availableCount;

  const hasActiveFilters =
    appliedSearch.trim() !== "" || categoryId !== 0 || conditionId !== 0;

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const [categoryData, conditionData, productData] = await Promise.all([
        getProductCategories(),
        getProductConditions(),
        getAdminProducts(
          {
            categoryId: 0,
            conditionId: 0,
            search: "",
            pageNumber: 1,
            pageSize
          },
          token
        )
      ]);

      setCategories(categoryData);
      setConditions(conditionData);

      setProducts(productData.items);
      setTotalPages(Math.max(productData.totalPages, 1));
      setTotalRecords(productData.totalRecords);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(
    selectedCategoryId = categoryId,
    selectedConditionId = conditionId,
    searchText = appliedSearch,
    selectedPageNumber = pageNumber,
    clearSuccess = true
  ) {
    try {
      setError("");

      if (clearSuccess) {
        setSuccess("");
      }

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const data = await getAdminProducts(
        {
          categoryId: selectedCategoryId === 0 ? null : selectedCategoryId,
          conditionId: selectedConditionId === 0 ? null : selectedConditionId,
          search: searchText.trim(),
          pageNumber: selectedPageNumber,
          pageSize
        },
        token
      );

      const safeTotalPages = Math.max(data.totalPages, 1);

      setProducts(data.items);
      setTotalPages(safeTotalPages);
      setTotalRecords(data.totalRecords);
      setPageNumber(selectedPageNumber);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load products."
      );
    }
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchText = search.trim();

    setSearching(true);
    setAppliedSearch(searchText);

    await loadProducts(categoryId, conditionId, searchText, 1);

    setSearching(false);
  }

  function handleCategoryChange(value: number) {
    setCategoryId(value);
    setPageNumber(1);

    void loadProducts(value, conditionId, appliedSearch, 1);
  }

  function handleConditionChange(value: number) {
    setConditionId(value);
    setPageNumber(1);

    void loadProducts(categoryId, value, appliedSearch, 1);
  }

  async function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setCategoryId(0);
    setConditionId(0);
    setPageNumber(1);

    setResetting(true);
    await loadProducts(0, 0, "", 1);
    setResetting(false);
  }

  async function goToPreviousPage() {
    const previousPage = Math.max(pageNumber - 1, 1);

    await loadProducts(categoryId, conditionId, appliedSearch, previousPage);
  }

  async function goToNextPage() {
    const nextPage = Math.min(pageNumber + 1, totalPages);

    await loadProducts(categoryId, conditionId, appliedSearch, nextPage);
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return;

    try {
      setDeletingId(productToDelete.productId);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await deleteAdminProduct(productToDelete.productId, token);

      const expectedRecordsAfterDelete = Math.max(totalRecords - 1, 0);

      const expectedTotalPages = Math.max(
        Math.ceil(expectedRecordsAfterDelete / pageSize),
        1
      );

      const targetPage = Math.min(pageNumber, expectedTotalPages);

      setSuccess(`"${productToDelete.productName}" was deleted.`);
      setProductToDelete(null);

      await loadProducts(
        categoryId,
        conditionId,
        appliedSearch,
        targetPage,
        false
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExportCsv() {
    if (exporting) {
      return;
    }

    try {
      setExporting(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await exportProducts(token, {
        search: appliedSearch.trim() || undefined,
        categoryId: categoryId === 0 ? null : categoryId,
        isAvailable: null
      });

      setSuccess("Products CSV downloaded successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to export products."
      );
    } finally {
      setExporting(false);
    }
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  function getProductImageUrl(imageUrl?: string | null) {
    if (!imageUrl) return "";

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

    return `${baseUrl}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Inventory management
              </p>

              <h1 className="font-display mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Products
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Manage product information, stock, availability and public
                listings.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-3 gap-2">
                <SummaryCard label="Total" value={totalRecords} />

                <SummaryCard label="Page available" value={availableCount} />

                <SummaryCard label="Page hidden" value={hiddenCount} />
              </div>

              <div className="flex gap-3">
                <ActionButton
                  type="button"
                  variant="outline"
                  fullWidth={false}
                  loading={exporting}
                  loadingText=""
                  onClick={() => void handleExportCsv()}
                  disabled={exporting || loading || totalRecords === 0}
                  className="min-h-12 px-5"
                >
                  <span className="inline-flex items-center gap-2">
                    <DownloadIcon />
                    Export CSV
                  </span>
                </ActionButton>

                <Link
                  to="/admin/products/new"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                >
                  <PlusIcon />
                  Add product
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_210px_210px_auto] lg:items-end"
          >
            <div>
              <label
                htmlFor="admin-product-search"
                className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#5f574a] dark:text-[#b5ada0]"
              >
                Search products
              </label>

              <div className="relative">
                <SearchIcon />

                <input
                  id="admin-product-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Product, brand or model..."
                  className="h-12 w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] py-3 pl-11 pr-11 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#817a6e]"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear product search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] dark:hover:bg-[#242016]"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            <UniversalDropdown<number>
              label="Category"
              options={categoryOptions}
              value={categoryId}
              onChange={handleCategoryChange}
              placeholder="All categories"
            />

            <UniversalDropdown<number>
              label="Condition"
              options={conditionOptions}
              value={conditionId}
              onChange={handleConditionChange}
              placeholder="All conditions"
            />

            <div className="flex gap-3">
              <ActionButton
                type="submit"
                variant="dark"
                fullWidth={false}
                loading={searching}
                loadingText="Searching..."
                disabled={loading || searching}
                className="flex-1 lg:flex-none"
              >
                Search
              </ActionButton>

              {hasActiveFilters && (
                <ActionButton
                  type="button"
                  variant="outline"
                  fullWidth={false}
                  loading={resetting}
                  loadingText="Resetting..."
                  disabled={loading || resetting}
                  onClick={() => void clearFilters()}
                  className="flex-1 lg:flex-none"
                >
                  Reset
                </ActionButton>
              )}
            </div>
          </form>
        </section>

        {(error || success) && (
          <div className="mt-5 space-y-3">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              >
                {success}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <ProductsLoading />
        ) : products.length === 0 ? (
          <EmptyProducts
            hasActiveFilters={hasActiveFilters}
            onClear={() => void clearFilters()}
          />
        ) : (
          <section className="mt-6">
            <div className="mb-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
                Showing {startRecord}-{endRecord} of {totalRecords} products
              </p>

              <p className="text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Edit product details or preview the public listing.
              </p>
            </div>

            <div className="space-y-4">
              {products.map((product) => (
                <AdminProductCard
                  key={product.productId}
                  product={product}
                  deleting={deletingId === product.productId}
                  formatPrice={formatPrice}
                  getProductImageUrl={getProductImageUrl}
                  onDelete={() => setProductToDelete(product)}
                />
              ))}
            </div>

            <PaginationBar
              pageNumber={pageNumber}
              totalPages={totalPages}
              totalRecords={totalRecords}
              startRecord={startRecord}
              endRecord={endRecord}
              loading={loading || searching || resetting}
              onPrevious={() => void goToPreviousPage()}
              onNext={() => void goToNextPage()}
            />
          </section>
        )}
      </section>

      <DeleteProductModal
        product={productToDelete}
        deleting={
          productToDelete !== null && deletingId === productToDelete.productId
        }
        onCancel={() => {
          if (!deletingId) {
            setProductToDelete(null);
          }
        }}
        onConfirm={() => void confirmDeleteProduct()}
      />
    </main>
  );
}

type AdminProductCardProps = {
  product: AdminProductListItem;
  deleting: boolean;
  formatPrice: (price: number) => string;
  getProductImageUrl: (imageUrl?: string | null) => string;
  onDelete: () => void;
};

function AdminProductCard({
  product,
  deleting,
  formatPrice,
  getProductImageUrl,
  onDelete
}: AdminProductCardProps) {
  const productMeta =
    [product.brand, product.modelName].filter(Boolean).join(" • ") ||
    "No brand or model";

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm transition hover:border-[#c8b98f] hover:shadow-md dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b]">
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[110px_minmax(0,1fr)_210px_220px] lg:items-center">
        <div className="flex items-center gap-4 lg:block">
          <div className="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8cdb6] bg-[#f3efe6] p-2 dark:border-[#302c24] dark:bg-[#0f0e0c] lg:h-20 lg:w-full">
            {product.primaryImageUrl ? (
              <img
                src={getProductImageUrl(product.primaryImageUrl)}
                alt={product.productName}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xl font-black text-[#8a6624] dark:text-[#d6b46a]">
                TE
              </span>
            )}
          </div>

          <div className="min-w-0 lg:hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#817867] dark:text-[#928a7d]">
              Product #{product.productId}
            </p>

            <AvailabilityBadge isAvailable={product.isAvailable} />
          </div>
        </div>

        <div className="min-w-0 border-t border-[#eadfca] pt-5 dark:border-[#302c24] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/admin/products/${product.productId}/edit`}
              className="truncate text-lg font-black transition hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
            >
              {product.productName}
            </Link>

            {product.isFeatured && (
              <span className="rounded-full border border-[#d6b46a]/40 bg-[#fff4cc] px-2.5 py-1 text-[10px] font-black text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                Featured
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            {productMeta}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <ProductMetaBadge>{product.categoryName}</ProductMetaBadge>
            <ProductMetaBadge>{product.conditionName}</ProductMetaBadge>
          </div>

          <p className="mt-3 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
            Added {formatDate(product.createdAt)} · Product #{product.productId}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#eadfca] pt-5 dark:border-[#302c24] lg:block lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
              Price
            </p>

            <p className="mt-1 text-xl font-black">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="lg:mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
              Stock
            </p>

            <p className="mt-1 text-sm font-black">
              {product.stockQuantity}{" "}
              {product.stockQuantity === 1 ? "unit" : "units"}
            </p>
          </div>

          <div className="col-span-2 mt-1 hidden lg:block">
            <AvailabilityBadge isAvailable={product.isAvailable} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#eadfca] pt-5 dark:border-[#302c24] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <Link
            to={`/admin/products/${product.productId}/edit`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-4 text-xs font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
          >
            <EditIcon />
            Edit
          </Link>

          <Link
            to={`/products/${product.productId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] px-4 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
          >
            Preview
            <ExternalIcon />
          </Link>

          <ActionButton
            type="button"
            variant="outline"
            loading={deleting}
            loadingText="Deleting product..."
            onClick={onDelete}
            className="col-span-2 !h-10 !min-h-0 !py-0 border-none text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
          >
            <span className="inline-flex items-center gap-2">
              <DeleteIcon />
              Delete product
            </span>
          </ActionButton>
        </div>
      </div>
    </article>
  );
}

function PaginationBar({
  pageNumber,
  totalPages,
  totalRecords,
  startRecord,
  endRecord,
  loading,
  onPrevious,
  onNext
}: {
  pageNumber: number;
  totalPages: number;
  totalRecords: number;
  startRecord: number;
  endRecord: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] px-5 py-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-[#6f6758] dark:text-[#a8a093]">
        Showing {startRecord}-{endRecord} of {totalRecords} products
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pageNumber <= 1 || loading}
          onClick={onPrevious}
          className="rounded-xl border border-[#d8cdb6] px-4 py-2 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:hover:bg-[#242016]"
        >
          Previous
        </button>

        <span className="rounded-xl border border-[#d8cdb6] bg-[#fff8e7] px-4 py-2 text-sm font-black dark:border-[#302c24] dark:bg-[#11110f]">
          Page {pageNumber} of {totalPages}
        </span>

        <button
          type="button"
          disabled={pageNumber >= totalPages || loading}
          onClick={onNext}
          className="rounded-xl bg-[#1f1a12] px-4 py-2 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[82px] rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3 py-3 text-center dark:border-[#302c24] dark:bg-[#11110f] sm:min-w-[96px]">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function ProductMetaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#d8cdb6] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-black text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
      {children}
    </span>
  );
}

function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return isAvailable ? (
    <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
      Available
    </span>
  ) : (
    <span className="inline-flex w-fit rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
      Hidden
    </span>
  );
}

function DeleteProductModal({
  product,
  deleting,
  onCancel,
  onConfirm
}: {
  product: AdminProductListItem | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
        className="w-full max-w-md rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-2xl dark:border-[#302c24] dark:bg-[#1a1712]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300">
          <DeleteIcon />
        </div>

        <h2 id="delete-product-title" className="mt-5 text-2xl font-black">
          Delete this product?
        </h2>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          <span className="font-black text-[#1f1a12] dark:text-[#e8e3d8]">
            {product.productName}
          </span>{" "}
          will be permanently removed from the admin and public product pages.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <ActionButton
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={onCancel}
            className="!h-12"
          >
            Cancel
          </ActionButton>

          <ActionButton
            type="button"
            variant="dark"
            loading={deleting}
            loadingText="Deleting..."
            onClick={onConfirm}
            className="!h-12 !bg-red-700 text-white hover:!bg-red-800 dark:!bg-red-700 dark:!text-white dark:hover:!bg-red-800"
          >
            Delete product
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function ProductsLoading() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 dark:border-[#302c24] dark:bg-[#1a1712]"
        >
          <div className="grid gap-5 lg:grid-cols-[110px_1fr_210px_220px]">
            <div className="h-20 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />

            <div>
              <div className="h-6 w-48 rounded bg-[#eee5d4] dark:bg-[#302c24]" />
              <div className="mt-3 h-4 w-36 rounded bg-[#eee5d4] dark:bg-[#302c24]" />
            </div>

            <div className="h-14 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />

            <div className="h-11 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyProducts({
  hasActiveFilters,
  onClear
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mt-6 rounded-[1.75rem] border border-dashed border-[#d8cdb6] bg-[#fffdf7] px-6 py-14 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <BoxIcon />
      </div>

      <h2 className="mt-5 text-xl font-black">No products found</h2>

      <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        No products match the current search and filters.
      </p>

      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-[#d8cdb6] px-5 py-3 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
          >
            Clear filters
          </button>
        )}

        <Link
          to="/admin/products/new"
          className="rounded-xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
        >
          Add product
        </Link>
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m5 19 3.5-.7L18 8.8 15.2 6 5.7 15.5 5 19ZM13.8 7.4l2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M14 5h5v5M19 5l-8 8M18 13v6H5V6h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 7h14M10 11v5M14 11v5M8 7l1-3h6l1 3M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default AdminProductsPage;
