import { useApiAuth } from "../hooks/useApiAuth";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type TouchEvent
} from "react";
import { Link, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import ActionButton from "../components/UI/ActionButton";
import { getCustomerProfile } from "../Services/customerProfileService";
import {
  createEnquiry,
  getProductById,
  getProducts,
  type ProductDetails,
  type ProductListItem
} from "../Services/productService";
import { useShopSettings } from "../hooks/useShopSettings";
import TanishElectronicsLogo from "../components/common/TanishElectronicsLogo";

const SWIPE_THRESHOLD = 50;

function ProductDetailsPage() {
  const { settings } = useShopSettings();
  const { id } = useParams();
  const { isSignedIn, isLoaded, getToken } = useApiAuth();

  const enquirySectionRef = useRef<HTMLDivElement | null>(null);

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ProductListItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const previousTitle = document.title;
    if (product) {
      document.title = `${product.productName} | ${settings.shopName}`;
    } else {
      document.title = `Product Details | ${settings.shopName}`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [product, settings.shopName]);

  useEffect(() => {
    async function autoFillCustomerDetails() {
      if (!isLoaded || !isSignedIn) return;

      try {
        const token = await getToken();

        if (!token) return;

        const profile = await getCustomerProfile(token);

        setFullName(profile.fullName || "");
        setPhoneNumber(profile.phoneNumber || "");
      } catch {
        // Public customers can still fill the form manually.
      }
    }

    void autoFillCustomerDetails();
  }, [isLoaded, isSignedIn, getToken]);

  async function loadProduct() {
    try {
      if (!id || Number.isNaN(Number(id))) {
        setProductError("Invalid product.");
        return;
      }

      setLoading(true);
      setProductError("");
      setSelectedImageIndex(0);

      const [data, allProducts] = await Promise.all([
        getProductById(Number(id)),
        getProducts().catch(() => [] as ProductListItem[])
      ]);

      setProduct(data);

      if (data && allProducts.length > 0) {
        const otherCandidates = allProducts.filter(
          (candidate) => candidate.productId !== data.productId
        );

        const scored = otherCandidates
          .map((candidate) => ({
            item: candidate,
            score: calculateSimilarityScore(data, candidate)
          }))
          .filter((entry) => entry.score > 0)
          .sort(
            (a, b) => b.score - a.score || b.item.productId - a.item.productId
          );

        // Strictly take products that match brand/compatibility (no irrelevant fallbacks)
        const topMatches = scored.map((entry) => entry.item);
        setSimilarProducts(topMatches.slice(0, 4));
      } else {
        setSimilarProducts([]);
      }
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "Product not found."
      );
      setProduct(null);
      setSimilarProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // This route change intentionally starts the product request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProduct();
    // Product loading is intentionally keyed to the route identifier.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!product) return;

    if (fullName.trim().length < 2) {
      setFormError("Please enter your full name.");
      return;
    }

    const normalizedPhone = phoneNumber.replace(/\D/g, "");

    if (normalizedPhone.length !== 10) {
      setFormError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      setSuccess("");

      const result = await createEnquiry({
        productId: product.productId,
        fullName: fullName.trim(),
        phoneNumber: normalizedPhone,
        subject: `Product enquiry: ${product.productName}`,
        message:
          message.trim() ||
          `I am interested in ${product.productName}. Please confirm availability and condition.`
      });

      setSuccess(result.message || "Your enquiry has been sent.");
      setMessage("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to submit your enquiry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToEnquiry() {
    enquirySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function getProductImageUrl(imageUrl?: string | null) {
    if (!imageUrl) return "";

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

    return `${baseUrl}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  function getWhatsAppLink() {
    if (!product) return "#";

    const whatsappNumber = settings.whatsAppNumber.replace(/\D/g, "");

    const messageText = [
      `Hello ${settings.shopName},`,
      `I am interested in ${product.productName}.`,
      `Product ID: ${product.productId}`,
      `Listed price: ${formatPrice(product.price)}`,
      "Please confirm availability and condition."
    ].join("\n");

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      messageText
    )}`;
  }

  const shopPhone = settings.primaryPhone || "8850973399";
  const shopPhoneHref = `tel:${shopPhone.replace(/\D/g, "")}`;

  if (loading) {
    return <ProductDetailsLoading />;
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-black text-[#8a6624] dark:text-[#d6b46a]"
          >
            <ArrowLeftIcon />
            Back to products
          </Link>

          <div className="mt-8 rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-12 text-center text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            <h1 className="text-2xl font-black">Product unavailable</h1>

            <p className="mt-2 text-sm font-semibold">
              {productError || "This product could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const imageUrls = product.imageUrls?.filter(Boolean) || [];

  const activeImage = imageUrls[selectedImageIndex] || imageUrls[0] || "";

  const productMeta =
    [product.brand, product.modelName].filter(Boolean).join(" • ") ||
    "Product details available";

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] pb-32 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] lg:pb-0">
      <section className="mx-auto w-full max-w-[1720px] px-4 pt-3 pb-12 sm:px-8 sm:pt-4 sm:pb-16 lg:px-12 xl:px-16 2xl:px-20 lg:pt-5">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#817867] dark:text-[#928a7d]"
        >
          <Link
            to="/"
            className="transition hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
          >
            Home
          </Link>

          <ChevronRightIcon />

          <Link
            to="/products"
            className="transition hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
          >
            Products
          </Link>

          <ChevronRightIcon />

          <span className="max-w-[220px] truncate text-[#1f1a12] dark:text-[#e8e3d8]">
            {product.productName}
          </span>
        </nav>

        {/* Main product area */}
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(400px,0.9fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(450px,0.8fr)]">
          <ProductImageGallery
            productName={product.productName}
            imageUrls={imageUrls}
            activeImage={activeImage}
            selectedImageIndex={selectedImageIndex}
            onSelectImage={setSelectedImageIndex}
            getProductImageUrl={getProductImageUrl}
          />

          <section className="min-w-0 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7]/90 p-6 shadow-[0_24px_70px_-50px_rgba(31,26,18,0.7)] backdrop-blur dark:border-[#302c24] dark:bg-[#15130f]/90 sm:p-8 lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="category">{product.categoryName}</Badge>
              <Badge variant="condition">{product.conditionName}</Badge>
              {product.isAvailable && product.stockQuantity > 0 ? (
                product.stockQuantity <= 2 ? (
                  <Badge variant="lowStock">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Only {product.stockQuantity} left
                  </Badge>
                ) : (
                  <Badge variant="available">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    In Stock
                  </Badge>
                )
              ) : (
                <Badge variant="outOfStock">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Out of Stock
                </Badge>
              )}
              {product.isFeatured && (
                <Badge variant="featured">
                  <Sparkles className="h-3 w-3 text-[#d6b46a]" />
                  Featured Item
                </Badge>
              )}
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
              Product #{product.productId}
            </p>

            <h1 className="font-display mt-2 text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
              {product.productName}
            </h1>

            <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093] sm:text-base">
              {productMeta}
            </p>

            <div className="mt-7 rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] p-5 dark:border-[#3a342a] dark:bg-[#1d1a15]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#817867] dark:text-[#928a7d]">
                Listed price
              </p>

              <p className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                {formatPrice(product.price)}
              </p>

              <p className="mt-3 max-w-xl text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                Final condition, included accessories and availability should be
                confirmed before visiting the shop.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={scrollToEnquiry}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-6 py-3.5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                Send enquiry
                <ArrowRightIcon />
              </button>

              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50 px-6 py-3.5 text-sm font-black text-emerald-900 transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-[#052e1b] dark:border-emerald-400/40 dark:bg-[#063f32] dark:text-[#8ff5d2] dark:hover:bg-[#25D366] dark:hover:text-[#052e1b]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp
              </a>
            </div>

            <a
              href={shopPhoneHref}
              className="mt-3 inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 py-3 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
            >
              <PhoneIcon />
              Call shop: {shopPhone}
            </a>

            <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#d8cdb6] bg-[#fffaf0]/70 p-4 dark:border-[#302c24] dark:bg-[#11110f]/70">
              <ServicePoint
                icon={<StoreIcon />}
                title="Local pickup"
                text="Santacruz West"
              />

              <ServicePoint
                icon={<CheckCircleIcon />}
                title="Shop listed"
                text="Verified listing"
              />

              <ServicePoint
                icon={<ChatIcon />}
                title="Quick reply"
                text="Call or WhatsApp"
              />
            </div>
          </section>
        </div>

        {/* Product details and enquiry */}
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                Product details
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Description
              </h2>

              <p className="mt-5 whitespace-pre-line text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093] sm:text-base sm:leading-8">
                {product.description ||
                  "No detailed description is available for this product. Contact the shop for condition and accessory information."}
              </p>
            </section>

            <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-8">
              <h2 className="text-xl font-black">Product information</h2>

              <dl className="mt-5 divide-y divide-[#e4dac5] dark:divide-[#302c24]">
                <SpecificationRow
                  label="Category"
                  value={product.categoryName}
                />

                <SpecificationRow
                  label="Condition"
                  value={product.conditionName}
                />

                <SpecificationRow
                  label="Brand"
                  value={product.brand || "Not specified"}
                />

                <SpecificationRow
                  label="Model"
                  value={product.modelName || "Not specified"}
                />

                <SpecificationRow
                  label="Availability"
                  value={
                    product.isAvailable && product.stockQuantity > 0
                      ? `In Stock (${product.stockQuantity} ${product.stockQuantity === 1 ? "unit" : "units"} available)`
                      : "Out of Stock — Enquiry required for procurement"
                  }
                />

                <SpecificationRow
                  label="Pickup"
                  value="Tanish Electronics, Santacruz West"
                />
              </dl>
            </section>
          </div>

          <aside
            id="product-enquiry"
            ref={enquirySectionRef}
            className="scroll-mt-24 rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] lg:sticky lg:top-24"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Product enquiry
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Interested in this product?
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
              Leave your contact details and the shop will confirm availability.
            </p>

            <div className="mt-5 flex items-center gap-4 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
              {activeImage ? (
                <img
                  src={getProductImageUrl(activeImage)}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain p-1"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8cdb6] bg-[#1f1a12] p-1 shadow-xs dark:border-[#383124] dark:bg-[#161410]">
                  <TanishElectronicsLogo className="h-full w-full rounded-lg object-cover" />
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  {product.productName}
                </p>

                <p className="mt-1 text-lg font-black">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleEnquiry}>
              <FormField label="Full name" htmlFor="enquiry-full-name">
                <input
                  id="enquiry-full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  placeholder="Enter your name"
                  className="product-input"
                />
              </FormField>

              <FormField label="Phone number" htmlFor="enquiry-phone">
                <input
                  id="enquiry-phone"
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(
                      event.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  className="product-input"
                />
              </FormField>

              <FormField label="Message (optional)" htmlFor="enquiry-message">
                <textarea
                  id="enquiry-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask about condition, accessories or pickup..."
                  rows={4}
                  className="product-input resize-none"
                />
              </FormField>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  {formError}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                >
                  {success}
                </div>
              )}

              <ActionButton
                type="submit"
                loading={submitting}
                loadingText="Sending..."
                variant="dark"
                fullWidth
                className="h-12 cursor-pointer rounded-xl"
              >
                Send Enquiry
              </ActionButton>
            </form>

            <p className="mt-4 text-center text-[11px] font-semibold leading-5 text-[#817867] dark:text-[#928a7d]">
              No online payment is required. The shop will contact you first.
            </p>
          </aside>
        </div>

        {/* Similar & Compatible Products Section */}
        <section className="mt-12 sm:mt-16 border-t border-[#d8cdb6] pt-8 sm:pt-10 dark:border-[#302c24]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#d6b46a]/60 bg-[#1f1a12] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#d6b46a]">
                  <Sparkles size={11} className="text-[#d6b46a]" />
                  {similarProducts.length > 0
                    ? "Recommended For You"
                    : "Compatibility Check"}
                </span>
                {product.brand && (
                  <span className="text-xs font-black uppercase tracking-wider text-[#8a6624] dark:text-[#d6b46a]">
                    • {product.brand} Ecosystem
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#1f1a12] dark:text-[#f7f5ef] sm:text-3xl">
                Similar Products & Matching Accessories
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Original remotes, power adapters, and verified companion
                electronics for this setup
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs font-black text-[#8a6624] transition hover:text-[#5e4315] hover:underline dark:text-[#d6b46a] dark:hover:text-[#edd9a8]"
            >
              <span>View all products</span>
              <ArrowRightIcon />
            </Link>
          </div>

          {similarProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarProducts.map((item) => (
                <SimilarProductCard
                  key={item.productId}
                  product={item}
                  currentProduct={product}
                  formatPrice={formatPrice}
                  getProductImageUrl={getProductImageUrl}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[#d8cdb6] bg-[#fffdf7]/60 p-8 text-center dark:border-[#302c24] dark:bg-[#1a1712]/60 sm:p-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8cdb6]/60 bg-[#1f1a12] p-1.5 shadow-sm dark:border-[#383124] dark:bg-[#161410]">
                <TanishElectronicsLogo className="h-full w-full rounded-xl object-cover" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-black text-[#1f1a12] dark:text-[#f7f5ef]">
                No matching products found
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                {product.brand
                  ? `There are currently no matching remotes or accessories in stock for ${product.brand}.`
                  : "There are currently no matching accessories or similar products in stock for this item."}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={scrollToEnquiry}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1f1a12] px-4 text-xs font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                >
                  Enquire for {product.brand || "this device"} parts
                </button>
                <Link
                  to="/products"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8cdb6] bg-transparent px-4 text-xs font-black text-[#1f1a12] transition hover:bg-[#f3efe6] dark:border-[#302c24] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
                >
                  Browse all products
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>

      {/* Mobile sticky purchase-style action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d8cdb6] bg-[#fffdf7]/95 px-4 py-3 shadow-[0_-12px_35px_-20px_rgba(31,26,18,0.45)] backdrop-blur dark:border-[#302c24] dark:bg-[#11110f]/95 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
              Price
            </p>

            <p className="truncate text-xl font-black">
              {formatPrice(product.price)}
            </p>
          </div>

          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp about this product"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-[#052e1b] shadow-sm transition active:scale-95 hover:bg-[#48df7f]"
          >
            <WhatsAppIcon className="h-6 w-6" />
          </a>

          <button
            type="button"
            onClick={scrollToEnquiry}
            className="inline-flex h-12 min-w-[130px] items-center justify-center rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
          >
            Enquire now
          </button>
        </div>
      </div>
    </main>
  );
}

type ProductImageGalleryProps = {
  productName: string;
  imageUrls: string[];
  activeImage: string;
  selectedImageIndex: number;
  onSelectImage: (index: number) => void;
  getProductImageUrl: (imageUrl?: string | null) => string;
};

function ProductImageGallery({
  productName,
  imageUrls,
  activeImage,
  selectedImageIndex,
  onSelectImage,
  getProductImageUrl
}: ProductImageGalleryProps) {
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const hasMultipleImages = imageUrls.length > 1;

  function goPrevious() {
    if (!hasMultipleImages) return;

    onSelectImage(
      selectedImageIndex === 0 ? imageUrls.length - 1 : selectedImageIndex - 1
    );
  }

  function goNext() {
    if (!hasMultipleImages) return;

    onSelectImage(
      selectedImageIndex === imageUrls.length - 1 ? 0 : selectedImageIndex + 1
    );
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0].clientX;
    touchCurrentX.current = event.touches[0].clientX;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    touchCurrentX.current = event.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (touchStartX.current === null || touchCurrentX.current === null) {
      return;
    }

    const distance = touchCurrentX.current - touchStartX.current;

    if (Math.abs(distance) >= SWIPE_THRESHOLD) {
      if (distance > 0) {
        goPrevious();
      } else {
        goNext();
      }
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
  }

  return (
    <section className="min-w-0">
      <div
        className={
          hasMultipleImages
            ? "grid gap-4 sm:grid-cols-[76px_minmax(0,1fr)]"
            : "grid grid-cols-1"
        }
      >
        {/* Thumbnails */}
        {hasMultipleImages && (
          <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">
            {imageUrls.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                onClick={() => onSelectImage(index)}
                aria-label={`View product image ${index + 1}`}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-[#fffdf7] p-1 transition sm:h-[76px] sm:w-[76px] ${
                  selectedImageIndex === index
                    ? "border-[#8a6624] ring-2 ring-[#d6b46a]/30 dark:border-[#d6b46a]"
                    : "border-[#d8cdb6] hover:border-[#b99d62] dark:border-[#302c24]"
                }`}
              >
                <img
                  src={getProductImageUrl(imageUrl)}
                  alt={`${productName} thumbnail ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full rounded-lg object-contain"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={`relative flex aspect-square touch-pan-y items-center justify-center overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[radial-gradient(circle_at_50%_42%,#fffdf7_0%,#eee7d8_72%)] p-6 shadow-[0_24px_70px_-50px_rgba(31,26,18,0.7)] dark:border-[#302c24] dark:bg-[radial-gradient(circle_at_50%_42%,#211e18_0%,#0f0e0c_72%)] sm:p-8 ${
            hasMultipleImages ? "order-1 sm:order-2" : "order-1"
          }`}
        >
          {activeImage ? (
            <img
              src={getProductImageUrl(activeImage)}
              alt={productName}
              loading="eager"
              decoding="async"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-[#d8cdb6] bg-[#1f1a12] p-2 shadow-sm dark:border-[#383124] dark:bg-[#161410]">
                <TanishElectronicsLogo className="h-full w-full rounded-2xl object-cover" />
              </div>
              <span className="text-xs font-bold text-[#817867] dark:text-[#928a7d]">
                Workshop Verified Electronics
              </span>
            </div>
          )}

          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={goPrevious}
                aria-label="Previous product image"
                className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8cdb6] bg-[#fffdf7]/90 shadow-sm backdrop-blur transition hover:bg-white sm:flex dark:border-[#302c24] dark:bg-[#1a1712]/90"
              >
                <ArrowLeftIcon />
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next product image"
                className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8cdb6] bg-[#fffdf7]/90 shadow-sm backdrop-blur transition hover:bg-white sm:flex dark:border-[#302c24] dark:bg-[#1a1712]/90"
              >
                <ArrowRightIcon />
              </button>

              <span className="absolute bottom-3 right-3 rounded-full bg-[#11110f]/75 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                {selectedImageIndex + 1} / {imageUrls.length}
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function FormField({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs font-black text-[#5f574a] dark:text-[#b5ada0]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function SpecificationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[170px_1fr] sm:gap-6">
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </dt>

      <dd className="text-sm font-bold text-[#1f1a12] dark:text-[#e8e3d8]">
        {value}
      </dd>
    </div>
  );
}

function ServicePoint({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        {icon}
      </div>

      <p className="mt-2 truncate text-xs font-black">{title}</p>

      <p className="mt-0.5 truncate text-[10px] font-semibold text-[#817867] dark:text-[#928a7d]">
        {text}
      </p>
    </div>
  );
}

function Badge({
  children,
  variant
}: {
  children: ReactNode;
  variant:
    | "category"
    | "condition"
    | "available"
    | "lowStock"
    | "outOfStock"
    | "featured";
}) {
  const styles = {
    category:
      "border-[#d6b46a]/40 bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]",
    condition:
      "border-[#d8cdb6] bg-[#fffdf7] text-[#6f6758] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#a8a093]",
    available:
      "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-400/20 dark:text-emerald-300",
    lowStock:
      "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:border-amber-400/35 dark:bg-amber-400/20 dark:text-amber-300",
    outOfStock:
      "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:border-rose-400/35 dark:bg-rose-400/20 dark:text-rose-300",
    featured:
      "border-[#d6b46a]/60 bg-[#1f1a12] text-[#d6b46a] shadow-xs dark:bg-[#1f1a12] dark:text-[#d6b46a]"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function ProductDetailsLoading() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-8 dark:bg-[#11110f] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl animate-pulse gap-7 lg:grid-cols-2">
        <div className="aspect-square rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />

        <div className="py-4">
          <div className="h-6 w-40 rounded-full bg-[#eee5d4] dark:bg-[#302c24]" />
          <div className="mt-6 h-14 w-4/5 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
          <div className="mt-4 h-5 w-1/2 rounded-lg bg-[#eee5d4] dark:bg-[#302c24]" />
          <div className="mt-8 h-20 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
          <div className="mt-6 h-13 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
        </div>
      </div>
    </main>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m15 18-6-6 6-6"
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

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3 w-3">
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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M8.4 3.5 10 7.2 7.8 9c1.3 2.8 3.5 5 6.2 6.2l1.8-2.2 3.7 1.6v3c0 1-.8 1.9-1.9 1.9A14.1 14.1 0 0 1 4.5 6.4c0-1 .8-1.9 1.9-1.9h2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="currentColor"
        d="M16.02 4C9.4 4 4.02 9.38 4.02 16c0 2.11.55 4.18 1.6 6L4 28l6.15-1.61A11.94 11.94 0 0 0 16.02 28C22.64 28 28 22.62 28 16S22.64 4 16.02 4Zm0 21.95c-1.88 0-3.72-.5-5.33-1.44l-.38-.22-3.65.96.98-3.55-.25-.4A9.88 9.88 0 0 1 5.9 16c0-5.58 4.54-10.12 10.12-10.12S26.12 10.42 26.12 16 21.58 25.95 16.02 25.95Z"
      />
      <path
        fill="currentColor"
        d="M21.52 18.45c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.06 1.04-1.06 2.52s1.09 2.92 1.24 3.12c.15.2 2.14 3.27 5.18 4.58.72.31 1.29.5 1.73.64.73.23 1.39.2 1.91.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.31.18-1.43-.08-.13-.28-.2-.58-.35Z"
      />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 10h16v10H4V10Zm1-6h14l2 6H3l2-6Zm4 16v-6h6v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="m8 12 2.6 2.6L16.5 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 5h16v12H9l-5 3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const KNOWN_ELECTRONICS_BRANDS = [
  "vu",
  "lg",
  "samsung",
  "sony",
  "sansui",
  "kodak",
  "croma",
  "mi",
  "xiaomi",
  "oneplus",
  "tcl",
  "panasonic",
  "philips",
  "haier",
  "videocon",
  "onida",
  "bpl",
  "toshiba",
  "sharp",
  "micromax",
  "realme",
  "intex",
  "lloyd",
  "iffalcon",
  "hisense",
  "motorola",
  "nxt",
  "tata sky",
  "airtel",
  "dish tv",
  "d2h"
];

function extractProductBrand(
  brand?: string | null,
  name?: string | null
): string {
  const brandVal = (brand || "").trim().toLowerCase();
  if (
    brandVal &&
    brandVal !== "general" &&
    brandVal !== "remote" &&
    brandVal !== "accessories" &&
    brandVal !== "unknown"
  ) {
    return brandVal;
  }
  const nameVal = (name || "").toLowerCase();
  for (const b of KNOWN_ELECTRONICS_BRANDS) {
    const regex = new RegExp(`\\b${b}\\b`, "i");
    if (regex.test(nameVal)) {
      return b;
    }
  }
  return brandVal;
}

function containsBrand(text: string, brand: string): boolean {
  if (!text || !brand) return false;
  const regex = new RegExp(`\\b${brand}\\b`, "i");
  return regex.test(text);
}

function calculateSimilarityScore(
  current: ProductDetails,
  candidate: ProductListItem
): number {
  if (current.productId === candidate.productId) return -1;

  const currentBrand = extractProductBrand(current.brand, current.productName);
  const candidateBrand = extractProductBrand(
    candidate.brand,
    candidate.productName
  );

  const currentCategory = (current.categoryName || "").toLowerCase();
  const candidateCategory = (candidate.categoryName || "").toLowerCase();
  const currentName = current.productName.toLowerCase();
  const candidateName = candidate.productName.toLowerCase();

  const isCurrentTv =
    currentCategory.includes("tv") ||
    currentCategory.includes("television") ||
    currentName.includes("tv") ||
    currentName.includes("television") ||
    currentName.includes("led") ||
    currentName.includes("oled") ||
    currentName.includes("smart tv");

  const isCandidateRemote =
    candidateCategory.includes("remote") ||
    candidateName.includes("remote") ||
    candidateName.includes("magic remote");

  const isCurrentRemote =
    currentCategory.includes("remote") || currentName.includes("remote");

  const isCandidateTv =
    candidateCategory.includes("tv") ||
    candidateCategory.includes("television") ||
    candidateName.includes("tv");

  const isCandidateAccessory =
    candidateCategory.includes("accessory") ||
    candidateCategory.includes("accessories") ||
    candidateCategory.includes("adapter") ||
    candidateCategory.includes("cable") ||
    candidateCategory.includes("stand") ||
    candidateName.includes("adapter") ||
    candidateName.includes("cable") ||
    candidateName.includes("stand");

  const isCandidateUniversal =
    candidateName.includes("universal") ||
    candidateCategory.includes("universal");

  // Check if candidate explicitly targets the current brand
  const brandDirectMatch = Boolean(
    (currentBrand && candidateBrand && currentBrand === candidateBrand) ||
    (currentBrand && containsBrand(candidateName, currentBrand)) ||
    (candidateBrand && containsBrand(currentName, candidateBrand))
  );

  // Check if candidate belongs to a conflicting/different known brand
  const hasConflictingBrand = Boolean(
    currentBrand &&
    candidateBrand &&
    currentBrand !== candidateBrand &&
    !brandDirectMatch &&
    !isCandidateUniversal
  );

  // 1. Remotes & TVs (Cross-Sell Affinity)
  // A remote of brand Y CAN NEVER be recommended for brand X (e.g. LG remote for Vu TV)
  if (isCurrentTv && isCandidateRemote) {
    if (hasConflictingBrand) return -1;
    if (brandDirectMatch) return 100;
    if (isCandidateUniversal) return 40;
    return -1; // Unmatched remote -> Never recommend!
  }

  if (isCurrentRemote && isCandidateTv) {
    if (hasConflictingBrand) return -1;
    if (brandDirectMatch) return 100;
    if (isCandidateUniversal) return 40;
    return -1;
  }

  // 2. Companion Accessories
  if (isCandidateAccessory) {
    if (hasConflictingBrand) return -1;
    if (brandDirectMatch) return 80;
    if (isCandidateUniversal) return 30;
    return -1;
  }

  // 3. Same Category Items (e.g. TVs with TVs)
  // If current is a TV, only recommend other TVs of the SAME BRAND!
  if (isCurrentTv && isCandidateTv) {
    if (brandDirectMatch) {
      let score = 50;
      if (candidate.isAvailable && candidate.stockQuantity > 0) score += 10;
      if (candidate.isFeatured) score += 5;
      return score;
    }
    // TVs of different brands are NOT compatible/matching
    return -1;
  }

  // 4. Same brand general devices
  if (brandDirectMatch) {
    let score = 40;
    if (candidate.isAvailable && candidate.stockQuantity > 0) score += 10;
    if (candidate.isFeatured) score += 5;
    return score;
  }

  // Everything else is unrelated / incompatible
  return -1;
}

type SimilarProductCardProps = {
  product: ProductListItem;
  currentProduct: ProductDetails;
  formatPrice: (price: number) => string;
  getProductImageUrl: (imageUrl?: string | null) => string;
};

function SimilarProductCard({
  product,
  currentProduct,
  formatPrice,
  getProductImageUrl
}: SimilarProductCardProps) {
  const currentBrand = extractProductBrand(
    currentProduct.brand,
    currentProduct.productName
  );
  const candidateBrand = extractProductBrand(
    product.brand,
    product.productName
  );
  const currentCategory = (currentProduct.categoryName || "").toLowerCase();
  const candidateCategory = (product.categoryName || "").toLowerCase();
  const currentName = currentProduct.productName.toLowerCase();
  const candidateName = product.productName.toLowerCase();

  const isCurrentTv =
    currentCategory.includes("tv") ||
    currentCategory.includes("television") ||
    currentName.includes("tv") ||
    currentName.includes("television") ||
    currentName.includes("led");

  const isCandidateRemote =
    candidateCategory.includes("remote") || candidateName.includes("remote");

  const isUniversal =
    candidateName.includes("universal") ||
    candidateCategory.includes("universal");

  const brandMatches = Boolean(
    (currentBrand && candidateBrand && currentBrand === candidateBrand) ||
    (currentBrand && containsBrand(candidateName, currentBrand))
  );

  const isMatchingRemote =
    isCurrentTv && isCandidateRemote && (brandMatches || isUniversal);

  const isInStock = product.isAvailable && product.stockQuantity > 0;
  const isLowStock = isInStock && product.stockQuantity <= 2;

  const productDetails =
    [product.brand, product.modelName].filter(Boolean).join(" • ") ||
    product.categoryName;

  return (
    <Link
      to={`/products/${product.productId}`}
      className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[#c8b98f] hover:shadow-xl hover:shadow-[#d8cdb6]/40 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b] dark:hover:shadow-black/40"
    >
      {/* Product Image */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-[#d8cdb6] bg-gradient-to-b from-[#f3efe6] to-[#eae3d1] p-5 dark:border-[#302c24] dark:from-[#0f0e0c] dark:to-[#151310]">
        {product.primaryImageUrl ? (
          <img
            src={getProductImageUrl(product.primaryImageUrl)}
            alt={product.productName}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain drop-shadow-sm transition duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#d8cdb6]/60 bg-[#1f1a12] p-1 shadow-sm dark:border-[#383124] dark:bg-[#161410]">
              <TanishElectronicsLogo className="h-full w-full rounded-xl object-cover" />
            </div>
            <span className="text-[10px] font-bold text-[#817867] dark:text-[#928a7d]">
              Workshop Verified
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-1.5">
          {isMatchingRemote ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d6b46a]/60 bg-[#1f1a12] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#d6b46a] shadow-xs">
              <Sparkles size={10} className="text-[#d6b46a]" />
              {isUniversal ? "Universal Remote" : "Matching Remote"}
            </span>
          ) : brandMatches && product.brand ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d6b46a]/40 bg-[#fff4cc] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7a570f] shadow-xs dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
              {product.brand} Compatible
            </span>
          ) : (
            <span className="truncate rounded-full border border-[#d8cdb6] bg-[#fffdf7]/95 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#725522] shadow-xs backdrop-blur dark:border-[#302c24] dark:bg-[#1a1712]/95 dark:text-[#d6b46a]">
              {product.categoryName}
            </span>
          )}

          {isInStock ? (
            isLowStock ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-black text-amber-700 shadow-xs backdrop-blur dark:border-amber-400/35 dark:bg-amber-400/20 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Only {product.stockQuantity} left
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black text-emerald-700 shadow-xs backdrop-blur dark:border-emerald-400/35 dark:bg-emerald-400/20 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                In Stock
              </span>
            )
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-500/35 bg-rose-500/15 px-2 py-0.5 text-[9px] font-black text-rose-700 shadow-xs backdrop-blur dark:border-rose-400/35 dark:bg-rose-400/20 dark:text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-[#d8cdb6] bg-[#fffdf7] px-2 py-0.5 text-[10px] font-black text-[#6f6758] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#a8a093]">
            {product.conditionName}
          </span>
          {product.brand && (
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8a6624] dark:text-[#d6b46a]">
              {product.brand}
            </span>
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-black leading-snug tracking-tight text-[#1f1a12] transition group-hover:text-[#8a6624] dark:text-[#f7f5ef] dark:group-hover:text-[#d6b46a]">
          {product.productName}
        </h3>

        <p className="mt-1 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
          {productDetails}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#e4dac5] pt-4 dark:border-[#302c24]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-[#8a6624] dark:text-[#d6b46a]">
              Price
            </p>
            <p className="text-lg font-black tabular-nums tracking-tight text-[#1f1a12] dark:text-[#f7f5ef]">
              {formatPrice(product.price)}
            </p>
          </div>

          <span className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-[#1f1a12] px-3 text-xs font-black text-[#f7f5ef] transition group-hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:group-hover:bg-[#d6b46a]">
            View
            <ArrowRightIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ProductDetailsPage;
