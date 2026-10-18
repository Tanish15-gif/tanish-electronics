import { useEffect, useState } from "react";
import { ArrowRight, ImageOff } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getProducts,
  type ProductListItem
} from "../../Services/productService";
import { selectHomeFeaturedProduct } from "../../Services/homeFeaturedProduct";

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});
const uiFont = { fontFamily: "var(--font-ui)" };
const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#1f1a12] px-7 py-3 text-sm font-semibold text-[#f7f5ef] transition hover:bg-[#33291b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a6624] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] dark:focus-visible:outline-[#d6b46a]";

function ProductImage({ product }: { product: ProductListItem }) {
  const [failed, setFailed] = useState(false);
  const path = product.primaryImageUrl;
  const url =
    path &&
    (/^https?:\/\//i.test(path)
      ? path
      : `${import.meta.env.VITE_API_BASE_URL || ""}${path.startsWith("/") ? path : `/${path}`}`);
  if (!url || failed)
    return (
      <span className="flex flex-col items-center gap-3 text-[#6f6758]">
        <ImageOff size={34} aria-hidden="true" />
        <span className="text-sm">Photo unavailable</span>
      </span>
    );
  return (
    <img
      src={url}
      alt={product.productName}
      width={480}
      height={360}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full max-h-[360px] w-full object-contain transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
    />
  );
}

export function FeaturedProductShowcase({
  product
}: {
  product: ProductListItem;
}) {
  const detailsUrl = `/products/${product.productId}`;
  const model = [product.brand, product.modelName].filter(Boolean).join(" · ");
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-24">
      <Link
        to={detailsUrl}
        aria-label={`View ${product.productName}`}
        className="group flex aspect-[4/3] min-w-0 items-center justify-center overflow-hidden rounded-[1.75rem] border border-[#e3dccd] bg-white p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a6624] dark:border-[#302c24] dark:focus-visible:outline-[#d6b46a] sm:p-10"
      >
        <ProductImage
          key={`${product.productId}-${product.primaryImageUrl}`}
          product={product}
        />
      </Link>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
          {product.isFeatured ? "Featured product" : "From the shop"}
        </p>
        <h2
          id="featured-product-heading"
          className="font-display mt-4 break-words text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl"
        >
          {product.productName}
        </h2>
        {model && (
          <p className="mt-4 text-sm leading-6 text-[#6f6758] dark:text-[#a8a093]">
            {model}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {product.conditionName && (
            <span className="rounded-full border border-[#d8cdb6] px-3 py-1.5 text-[#514838] dark:border-[#494132] dark:text-[#d5cec2]">
              {product.conditionName}
            </span>
          )}
          <span className="inline-flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-current"
            />
            In stock
          </span>
        </div>
        <p className="mt-7 text-3xl font-semibold tracking-tight sm:text-4xl">
          {Number.isFinite(product.price) && product.price >= 0
            ? priceFormatter.format(product.price)
            : "Price on enquiry"}
        </p>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#6f6758] dark:text-[#a8a093]">
          Take a closer look and enquire with the shop about this item.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to={detailsUrl} className={primaryButton}>
            Shop Now <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link
            to="/products"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg text-sm font-semibold text-[#8a6624] dark:text-[#d6b46a]"
          >
            Browse all products <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomeFeaturedProduct() {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    product: ProductListItem | null;
  }>({ status: "loading", product: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getProducts()
      .then((products) => {
        if (active)
          setState({
            status: "ready",
            product: selectHomeFeaturedProduct(products)
          });
      })
      .catch(() => {
        if (active) setState({ status: "error", product: null });
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <section
      aria-labelledby="featured-product-heading"
      className="border-y border-[#d8cdb6] text-[#1f1a12] dark:border-[#302c24] dark:text-[#e8e3d8]"
      style={uiFont}
    >
      <div className="mx-auto w-full max-w-[1720px] px-4 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        {state.status === "loading" ? (
          <div role="status" aria-busy="true">
            <h2 id="featured-product-heading" className="sr-only">
              Featured product
            </h2>
            <span className="sr-only">Loading product…</span>
            <div
              aria-hidden="true"
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              <div className="aspect-[4/3] rounded-[1.75rem] bg-[#eee7d8] dark:bg-[#1a1712]" />
              <div className="space-y-5">
                <div className="h-3 w-28 rounded bg-[#e4dac7] dark:bg-[#302c24]" />
                <div className="h-12 w-3/4 rounded bg-[#e4dac7] dark:bg-[#302c24]" />
                <div className="h-8 w-24 rounded bg-[#e4dac7] dark:bg-[#302c24]" />
                <div className="h-12 w-36 rounded-xl bg-[#e4dac7] dark:bg-[#302c24]" />
              </div>
            </div>
          </div>
        ) : state.product ? (
          <FeaturedProductShowcase product={state.product} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                From the shop
              </p>
              <h2
                id="featured-product-heading"
                className="font-display mt-4 text-4xl font-bold"
              >
                Electronics &amp; accessories.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#6f6758] dark:text-[#a8a093]">
                {state.status === "error"
                  ? "The featured item couldn’t load. You can still browse the catalogue."
                  : "Explore the catalogue or contact the shop about availability."}
              </p>
              {state.status === "error" && (
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#8a6624] dark:text-[#d6b46a]"
                  onClick={() => {
                    setState({ status: "loading", product: null });
                    setAttempt((value) => value + 1);
                  }}
                >
                  Try again
                </button>
              )}
            </div>
            <Link to="/products" className={primaryButton}>
              Shop Now <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
