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
import ActionButton from "../components/UI/ActionButton";
import { getCustomerProfile } from "../Services/customerProfileService";
import {
  createEnquiry,
  getProductById,
  type ProductDetails
} from "../Services/productService";

const SHOP_PHONE = "8850973399";
const SWIPE_THRESHOLD = 50;

function ProductDetailsPage() {
  const { id } = useParams();
  const { isSignedIn, isLoaded, getToken } = useApiAuth();

  const enquirySectionRef = useRef<HTMLDivElement | null>(null);

  const [product, setProduct] = useState<ProductDetails | null>(null);
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
    void loadProduct();
  }, [id]);
  useEffect(() => {
    if (product) {
      document.title = `${product.productName} | Tanish Electronics`;
    } else {
      document.title = "Product Details | Tanish Electronics";
    }

    return () => {
      document.title = "Tanish Electronics";
    };
  }, [product]);

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

      const data = await getProductById(Number(id));
      setProduct(data);
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "Product not found."
      );
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

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

    const messageText = [
      "Hello Tanish Electronics,",
      `I am interested in ${product.productName}.`,
      `Product ID: ${product.productId}`,
      `Listed price: ${formatPrice(product.price)}`,
      "Please confirm availability and condition."
    ].join("\n");

    return `https://wa.me/91${SHOP_PHONE}?text=${encodeURIComponent(
      messageText
    )}`;
  }

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
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5ef] pb-24 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] lg:pb-0">
      <title>{product.productName} | Tanish Electronics</title>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
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
        <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
          <ProductImageGallery
            productName={product.productName}
            imageUrls={imageUrls}
            activeImage={activeImage}
            selectedImageIndex={selectedImageIndex}
            onSelectImage={setSelectedImageIndex}
            getProductImageUrl={getProductImageUrl}
          />

          <section className="min-w-0 lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="category">{product.categoryName}</Badge>
              <Badge variant="condition">{product.conditionName}</Badge>
              <Badge variant="available">Available</Badge>
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
              Product #{product.productId}
            </p>

            <h1 className="mt-2 text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              {product.productName}
            </h1>

            <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093] sm:text-base">
              {productMeta}
            </p>

            <div className="mt-7 border-y border-[#d8cdb6] py-6 dark:border-[#302c24]">
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
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-transparent px-6 py-3.5 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            </div>

            <a
              href={`tel:${SHOP_PHONE}`}
              className="mt-3 inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 py-3 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
            >
              <PhoneIcon />
              Call shop: {SHOP_PHONE}
            </a>

            <div className="mt-7 grid grid-cols-3 gap-2 border-t border-[#d8cdb6] pt-6 dark:border-[#302c24]">
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
        <div className="mt-10 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
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
                  value="Available — confirmation required"
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
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-2xl font-black text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                  {product.productName.charAt(0).toUpperCase()}
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
      </section>

      {/* Mobile sticky purchase-style action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d8cdb6] bg-[#fffdf7]/95 px-4 py-3 shadow-[0_-12px_35px_-20px_rgba(31,26,18,0.45)] backdrop-blur dark:border-[#302c24] dark:bg-[#11110f]/95 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
              Price
            </p>

            <p className="truncate text-xl font-black">
              {formatPrice(product.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToEnquiry}
            className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
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
          className={`relative flex aspect-square touch-pan-y items-center justify-center overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#f3efe6] p-5 dark:border-[#302c24] dark:bg-[#0f0e0c] ${
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
            <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-[#fff4cc] text-5xl font-black text-[#7a570f] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
              {productName.charAt(0).toUpperCase()}
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
  variant: "category" | "condition" | "available";
}) {
  const styles = {
    category:
      "border-[#d6b46a]/40 bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]",
    condition:
      "border-[#d8cdb6] bg-[#fffdf7] text-[#6f6758] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#a8a093]",
    available:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-[11px] font-black ${styles[variant]}`}
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

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M20 11.5a8 8 0 0 1-11.9 7L4 19.5l1.1-4A8 8 0 1 1 20 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9 8.5c.3 2.7 2 4.4 4.7 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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

export default ProductDetailsPage;
