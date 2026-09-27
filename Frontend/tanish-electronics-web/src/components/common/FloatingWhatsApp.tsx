import { useLocation } from "react-router-dom";
import { useShopSettings } from "../../hooks/useShopSettings";

function FloatingWhatsApp() {
  const { settings } = useShopSettings();
  const location = useLocation();
  const phoneNumber = settings.whatsAppNumber;
  const message = encodeURIComponent(
    `Hello ${settings.shopName}, I need help with electronics repair.`
  );

  const isProductDetailsPage = /^\/products\/[^/]+/.test(location.pathname);

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className={`floating-whatsapp fixed z-40 items-center justify-center rounded-full bg-[#00c26e] text-white shadow-2xl shadow-black/25 transition-all duration-300 hover:scale-105 hover:bg-[#00b866] sm:bottom-6 sm:right-6 sm:h-16 sm:w-16 ${
        isProductDetailsPage
          ? "hidden lg:flex"
          : "bottom-5 right-5 flex h-14 w-14"
      }`}
    >
      <svg
        className="h-8 w-8 sm:h-9 sm:w-9"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          fill="white"
          d="M16.02 4C9.4 4 4.02 9.38 4.02 16c0 2.11.55 4.18 1.6 6L4 28l6.15-1.61A11.94 11.94 0 0 0 16.02 28C22.64 28 28 22.62 28 16S22.64 4 16.02 4Zm0 21.95c-1.88 0-3.72-.5-5.33-1.44l-.38-.22-3.65.96.98-3.55-.25-.4A9.88 9.88 0 0 1 5.9 16c0-5.58 4.54-10.12 10.12-10.12S26.12 10.42 26.12 16 21.58 25.95 16.02 25.95Z"
        />
        <path
          fill="white"
          d="M21.52 18.45c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.06 1.04-1.06 2.52s1.09 2.92 1.24 3.12c.15.2 2.14 3.27 5.18 4.58.72.31 1.29.5 1.73.64.73.23 1.39.2 1.91.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.31.18-1.43-.08-.13-.28-.2-.58-.35Z"
        />
      </svg>
    </a>
  );
}

export default FloatingWhatsApp;
