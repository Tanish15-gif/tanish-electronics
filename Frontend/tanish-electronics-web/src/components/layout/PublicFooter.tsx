import { useShopSettings } from "../../hooks/useShopSettings";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import TanishElectronicsLogo from "../common/TanishElectronicsLogo";

const quickLinks = [
  {
    label: "Home",
    to: "/"
  },
  {
    label: "Book Repair",
    to: "/book-repair"
  },
  {
    label: "Track Request",
    to: "/track-request"
  },
  {
    label: "Products",
    to: "/products"
  }
];

const services = [
  "LED, LCD & Box TV Repair",
  "Remote Repair & Sales",
  "Home Theatre Support",
  "Electronics Accessories"
];

function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const { settings } = useShopSettings();

  const primaryPhoneHref = getTelHref(settings.primaryPhone);
  const secondaryPhoneHref = getTelHref(settings.secondaryPhone);

  const formattedPrimaryPhone = formatIndianPhone(settings.primaryPhone);
  const formattedSecondaryPhone = formatIndianPhone(settings.secondaryPhone);

  const whatsappMessage = encodeURIComponent(
    `Hello ${settings.shopName}, I need help with TV repair.`
  );

  const whatsappUrl =
    `https://wa.me/${getWhatsAppNumber(settings.whatsAppNumber)}` +
    `?text=${whatsappMessage}`;

  const SHOP_LATITUDE = 19.079166;
  const SHOP_LONGITUDE = 72.828855;

  const shopCoordinates = `${SHOP_LATITUDE},${SHOP_LONGITUDE}`;

  const directionsUrl =
    "https://www.google.com/maps/dir/?api=1" +
    `&destination=${encodeURIComponent(shopCoordinates)}`;

  return (
    <footer className="border-t border-[#d8cdb6] bg-[#f7f5ef] text-[#1f1a12] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <div className="mx-auto w-full max-w-[1720px] px-4 py-12 sm:px-8 sm:py-14 lg:px-12 xl:px-16 2xl:px-20 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.7fr_0.85fr_1.05fr] lg:gap-12">
          {/* Brand */}
          <section className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              aria-label={`${settings.shopName} home`}
              className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#d8cdb6]/60 bg-[#1f1a12] p-0.5 shadow-sm transition hover:scale-[1.04] dark:border-[#383124] dark:bg-[#161410]">
                <TanishElectronicsLogo className="h-full w-full rounded-xl object-cover" />
              </span>

              <span>
                <span className="font-display block text-2xl font-bold leading-none">
                  {settings.shopName}
                </span>

                <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                  Repair & Sales
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
              Trusted electronics repair and sales in {settings.area},{" "}
              {settings.city}, backed by more than 20 years of hands-on
              experience.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#33291b] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/25 dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#c9a85f]"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>

              <a
                href={primaryPhoneHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 py-3 text-sm font-black text-[#1f1a12] transition hover:-translate-y-0.5 hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                <PhoneIcon />
                Call shop
              </a>
            </div>
          </section>

          {/* Quick links */}
          <FooterSection title="Quick links">
            <nav aria-label="Footer navigation" className="space-y-2">
              {quickLinks.map((link) => (
                <FooterLink key={link.to} to={link.to}>
                  {link.label}
                </FooterLink>
              ))}
            </nav>
          </FooterSection>

          {/* Services */}
          <FooterSection title="Services">
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service}
                  className="flex items-start gap-2.5 text-sm font-bold leading-6 text-[#6f6758] dark:text-[#a8a093]"
                >
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                    <CheckIcon />
                  </span>

                  <span>{service}</span>
                </div>
              ))}
            </div>
          </FooterSection>

          {/* Shop information */}
          <FooterSection title="Shop details">
            <div className="space-y-5">
              <ShopDetail icon={<LocationIcon />} title="Address">
                <p>{settings.address}</p>

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-[#8a6624] transition hover:text-[#664812] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:text-[#d6b46a] dark:hover:text-[#f3d68e]"
                >
                  Get directions
                  <ArrowUpRightIcon />
                </a>
              </ShopDetail>

              <ShopDetail icon={<PhoneIcon />} title="Contact">
                <div className="space-y-1">
                  <a
                    href={primaryPhoneHref}
                    className="block font-bold transition hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
                  >
                    {formattedPrimaryPhone}
                  </a>

                  <a
                    href={secondaryPhoneHref}
                    className="block font-bold transition hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
                  >
                    {formattedSecondaryPhone}
                  </a>
                </div>
              </ShopDetail>

              <ShopDetail icon={<HomeVisitIcon />} title="Home visits">
                <p>
                  {settings.homeVisitMessage ||
                    "Home visit depends on location and availability. Our shop will call you to confirm."}
                </p>
              </ShopDetail>
            </div>
          </FooterSection>
        </div>

        {/* Trust highlights */}
        <div className="mt-12 grid gap-3 rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-3 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:grid-cols-3 sm:p-4">
          <FooterHighlight
            icon={<ExperienceIcon />}
            title="20+ Years"
            text="Hands-on repair experience"
          />

          <FooterHighlight
            icon={<TelevisionIcon />}
            title="TV Specialists"
            text="LED, LCD and box TVs"
          />

          <FooterHighlight
            icon={<ShieldCheckIcon />}
            title="Clear Guidance"
            text="Practical advice before repair"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#d8cdb6] dark:border-[#302c24]">
        <div className="mx-auto flex w-full max-w-[1720px] flex-col items-center justify-between gap-2 px-4 py-5 text-center text-xs font-semibold text-[#6f6758] dark:text-[#8f8778] sm:flex-row sm:px-8 sm:text-left lg:px-12 xl:px-16 2xl:px-20">
          <p>
            © {currentYear} {settings.shopName}. All rights reserved.
          </p>

          <p>Serving {settings.area} and nearby local areas.</p>
        </div>
      </div>
    </footer>
  );
}

function getOnlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function getTelHref(phoneNumber: string) {
  const digits = getOnlyDigits(phoneNumber);

  if (!digits) {
    return "#";
  }

  if (digits.startsWith("91")) {
    return `tel:+${digits}`;
  }

  return `tel:+91${digits}`;
}

function getWhatsAppNumber(phoneNumber: string) {
  const digits = getOnlyDigits(phoneNumber);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("91")) {
    return digits;
  }

  return `91${digits}`;
}

function formatIndianPhone(phoneNumber: string) {
  const digits = getOnlyDigits(phoneNumber);

  const withoutCountryCode = digits.startsWith("91") ? digits.slice(2) : digits;

  if (withoutCountryCode.length !== 10) {
    return phoneNumber;
  }

  return `+91 ${withoutCountryCode.slice(0, 5)} ${withoutCountryCode.slice(5)}`;
}

function FooterSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
        {title}
      </h2>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex min-h-9 items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm font-bold text-[#6f6758] transition hover:bg-[#fff8e7] hover:text-[#8a6624] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:text-[#a8a093] dark:hover:bg-[#1a1712] dark:hover:text-[#d6b46a]"
    >
      <span>{children}</span>

      <span className="translate-x-0 text-[#a79c88] transition group-hover:translate-x-0.5 group-hover:text-[#8a6624] dark:group-hover:text-[#d6b46a]">
        <ChevronRightIcon />
      </span>
    </Link>
  );
}

function ShopDetail({
  icon,
  title,
  children
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fff8e7] text-[#8a6624] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#d6b46a]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#1f1a12] dark:text-[#e8e3d8]">
          {title}
        </p>

        <div className="mt-1 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          {children}
        </div>
      </div>
    </div>
  );
}

function FooterHighlight({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#eadfca] bg-[#fff8e7] p-4 text-left dark:border-[#302c24] dark:bg-[#11110f]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        {icon}
      </span>

      <div>
        <p className="text-base font-black text-[#1f1a12] dark:text-[#e8e3d8]">
          {title}
        </p>

        <p className="mt-0.5 text-xs font-bold leading-5 text-[#6f6758] dark:text-[#a8a093]">
          {text}
        </p>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M8.5 8.5c.5 3.1 2.4 5 5.5 5.8l1.3-1.2 2.2 1.4c.3.2.4.5.3.8-.3 1.1-1.3 1.8-2.4 1.6-5-.8-8.2-4-9-9-.2-1.1.5-2.1 1.6-2.4.3-.1.6 0 .8.3l1.3 2.2-1.6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
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
        d="M7.5 4.5 10 8l-2 2c1.3 2.7 3.3 4.7 6 6l2-2 3.5 2.5c.3.2.5.6.4 1-.3 1.6-1.7 2.8-3.4 2.5C9.6 18.9 5.1 14.4 4 7.5 3.7 5.8 4.9 4.4 6.5 4.1c.4-.1.8.1 1 .4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function HomeVisitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m4 11 8-7 8 7v9h-6v-6h-4v6H4v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3 w-3">
      <path
        d="m7 12 3 3 7-7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExperienceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TelevisionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect
        x="3"
        y="5"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 21h8M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 3 20 6v5c0 4.7-3.1 8.1-8 10-4.9-1.9-8-5.3-8-10V6l8-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m8.5 12 2.2 2.2 4.8-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
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

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default PublicFooter;
