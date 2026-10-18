import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import HomeFeaturedProduct from "../components/public/HomeFeaturedProduct";
import HomeServiceInformation from "../components/public/HomeServiceInformation";
import HomeFeedbackSection from "../components/public/HomeFeedbackSection";
import HomeAnnouncementPopup from "../components/public/HomeAnnouncementPopup";
import HomeAnnouncementStrip from "../components/public/HomeAnnouncementStrip";
import { useShopSettings } from "../hooks/useShopSettings";

type ServiceIconType = "tv" | "theatre" | "remote" | "speaker";

type ServiceItem = {
  title: string;
  description: string;
  highlights: string[];
  badge: string;
  icon: ServiceIconType;
  imageUrl?: string;
  categoryParam: string;
};

const services: ServiceItem[] = [
  {
    title: "TV Repair",
    description:
      "Inspection and repair support for LED, LCD, Smart TV and box TV problems.",
    highlights: [
      "Display and picture issues",
      "Power and sound problems",
      "Home visit support"
    ],
    badge: "Most requested",
    icon: "tv",
    imageUrl: "/images/services/tv-repair.jpg",
    categoryParam: "tv"
  },
  {
    title: "Home Theatre Repair",
    description:
      "Repair and setup assistance for home theatre systems and connected speakers.",
    highlights: [
      "Sound output issues",
      "Speaker and wiring checks",
      "Setup guidance"
    ],
    badge: "Audio systems",
    icon: "theatre",
    imageUrl: "/images/services/theatre-repair.jpg",
    categoryParam: "theatre"
  },
  {
    title: "Remote Repair & Sales",
    description:
      "Support for faulty remotes and replacement options for TVs and set-top boxes.",
    highlights: ["TV remotes", "Set-top box remotes", "Replacement support"],
    badge: "Quick service",
    icon: "remote",
    imageUrl: "/images/services/remote-repair.jpg",
    categoryParam: "remote"
  },
  {
    title: "Speaker Repair",
    description:
      "Repair support for Bluetooth speakers, wired speakers and other sound devices.",
    highlights: [
      "Bluetooth speakers",
      "Wired audio devices",
      "Sound diagnostics"
    ],
    badge: "Sound devices",
    icon: "speaker",
    imageUrl: "/images/services/speaker-repair.jpg",
    categoryParam: "speaker"
  }
];

const trustItems = [
  {
    value: "20+",
    label: "Years of practical experience",
    icon: "experience" as const
  },
  {
    value: "Local",
    label: "Santacruz West service",
    icon: "location" as const
  },
  {
    value: "Home",
    label: "TV visit support",
    icon: "home" as const
  },
  {
    value: "Online",
    label: "Repair status tracking",
    icon: "track" as const
  }
];

const processSteps = [
  {
    number: "01",
    title: "Submit your request",
    description:
      "Choose the repair category and share the device problem, preferred service type and contact details."
  },
  {
    number: "02",
    title: "Inspection and update",
    description:
      "The device is checked and the customer receives repair status and pricing updates."
  },
  {
    number: "03",
    title: "Repair completion",
    description:
      "The repair is completed and the final status and price can be tracked online."
  }
];

function HomePage() {
  const { settings } = useShopSettings();

  const primaryPhone = getTelHref(settings.primaryPhone);
  const secondaryPhone = getTelHref(settings.secondaryPhone);

  const whatsappMessage = encodeURIComponent(
    `Hello ${settings.shopName}, I need repair help.`
  );

  const whatsappUrl = `https://wa.me/${getWhatsAppNumber(
    settings.whatsAppNumber
  )}?text=${whatsappMessage}`;

  const SHOP_LATITUDE = 19.079166;
  const SHOP_LONGITUDE = 72.828855;
  const shopCoordinates = `${SHOP_LATITUDE},${SHOP_LONGITUDE}`;
  const directionsUrl =
    "https://www.google.com/maps/dir/?api=1" +
    `&destination=${encodeURIComponent(shopCoordinates)}`;

  useEffect(() => {
    document.title = `${settings.shopName} | TV Repair in Santacruz West`;

    return () => {
      document.title = `${settings.shopName}`;
    };
  }, []);

  return (
    <main className="te-sheet-bg min-h-screen text-[#1f1a12] dark:text-[#e8e3d8]">
      <HomeAnnouncementPopup />

      {/* Hero */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-b border-[#d8cdb6] bg-transparent dark:border-[#302c24] lg:min-h-[calc(100svh-72px)]">
        <div
          aria-hidden="true"
          className="home-orb pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#d6b46a]/15 blur-3xl dark:bg-[#d6b46a]/8"
        />

        <div
          aria-hidden="true"
          className="home-orb-delayed pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#8a6624]/10 blur-3xl dark:bg-[#6f5a33]/15"
        />

        <div className="relative mx-auto grid w-full max-w-[1720px] gap-8 px-4 pt-4 pb-12 sm:px-8 sm:pt-6 sm:pb-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)] xl:grid-cols-[minmax(0,1fr)_minmax(540px,1fr)] 2xl:grid-cols-[minmax(0,0.95fr)_minmax(620px,1.05fr)] lg:items-center lg:px-12 xl:px-16 2xl:px-20 lg:pt-8 lg:pb-16">
          <Reveal>
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#d6b46a]/40 bg-[#fff8e7] px-4 py-2 text-xs font-black text-[#6f4e12] shadow-sm dark:border-[#d6b46a]/25 dark:bg-[#1a1712] dark:text-[#d6b46a] sm:text-sm">
                <span className="home-status-dot h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                <span className="truncate">
                  Local electronics repair in Santacruz West
                </span>
              </div>

              <h1 className="font-display mt-6 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-[#1f1a12] dark:text-[#e8e3d8] sm:text-5xl lg:text-6xl">
                Trusted TV and electronics repair{" "}
                <span className="text-[#8a6624] dark:text-[#d6b46a]">
                  near your home.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093] sm:text-lg sm:leading-8">
                TV and home-electronics repair backed by around 20 years of
                practical experience. Book a home visit, bring your device to
                the shop and track the repair online.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/book-repair"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-6 text-sm font-black text-[#f7f5ef] shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#33291b] hover:shadow-xl dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                >
                  Book a Repair
                  <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <a
                  href={primaryPhone}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-6 text-sm font-black transition duration-300 hover:-translate-y-0.5 hover:border-[#c6b991] hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
                >
                  <PhoneIcon />
                  Call the Shop
                </a>

                <Link
                  to="/track-request"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black text-[#8a6624] transition duration-300 hover:bg-[#f2eadb] dark:text-[#d6b46a] dark:hover:bg-[#242016]"
                >
                  Track Repair
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
                <HeroMetric value="Same Day" label="Initial inspection" />

                <HeroMetric value="₹ Clear" label="Pricing upfront" />

                <HeroMetric value="No Calls" label="Track status online" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={140} className="min-w-0">
            <HeroProductVisual />
          </Reveal>
        </div>
      </section>

      <HomeAnnouncementStrip />

      {/* Trust strip */}
      <section className="border-b border-[#d8cdb6] bg-transparent dark:border-[#302c24]">
        <div className="mx-auto grid w-full max-w-[1720px] grid-cols-2 px-4 sm:px-8 lg:grid-cols-4 lg:px-12 xl:px-16 2xl:px-20">
          {trustItems.map((item, index) => (
            <Reveal key={item.label} delay={index * 70} className="h-full">
              <TrustItem
                value={item.value}
                label={item.label}
                icon={item.icon}
                last={index === trustItems.length - 1}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="relative mx-auto w-full max-w-[1720px] px-4 py-14 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20 lg:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Repair services"
            title="Practical help for everyday home electronics."
            description="Choose the service you need and submit a repair request online. Home visits are available for supported TV repair locations."
            action={
              <Link
                to="/book-repair"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d8cdb6] bg-[#fffaf0] px-6 text-sm font-black shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#c7b98e] hover:bg-[#f2eadb] dark:border-[#3b352b] dark:bg-[#1a1712] dark:hover:border-[#5b503d] dark:hover:bg-[#242016]"
              >
                Book a repair
                <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            }
          />
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
          {services.map((service, index) => (
            <Reveal key={service.title} delay={index * 80} className="h-full">
              <ServiceCard service={service} whatsappUrl={whatsappUrl} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* About and benefits */}
      <section className="border-y border-[#d8cdb6] bg-transparent dark:border-[#302c24]">
        <div className="mx-auto w-full max-w-[1720px] px-4 py-14 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center lg:gap-14 xl:gap-20">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                  About {settings.shopName}
                </p>

                <h2 className="font-display mt-4 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
                  Local repair experience built on{" "}
                  <span className="text-[#8a6624] dark:text-[#d6b46a]">
                    practical work and trust.
                  </span>
                </h2>
              </div>

              <div className="border-l-0 border-[#d8cdb6] dark:border-[#3a342a] lg:border-l lg:pl-10 xl:pl-14">
                <p className="text-base font-semibold leading-8 text-[#6f6758] dark:text-[#b5ada0]">
                  {settings.shopName} is a family-run repair and
                  electronics-sales business based in{" "}
                  {settings.area || "Santacruz West"},{" "}
                  {settings.city || "Mumbai"}.
                </p>

                <p className="mt-4 text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
                  The business is handled by{" "}
                  {settings.ownerName || "the founder"}, with around 20 years of
                  hands-on electronics-repair experience. Customers receive
                  clear guidance before work continues, local home-visit support
                  where available and online repair updates.
                </p>

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-black">
                  <AboutPoint text="Clear pricing guidance" />
                  <AboutPoint text="Local home visits" />
                  <AboutPoint text="Online status tracking" />
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/book-repair"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-6 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                  >
                    Book TV Repair
                    <ArrowRightIcon />
                  </Link>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-600/35 bg-emerald-50 px-6 text-sm font-black text-emerald-900 shadow-sm transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-[#052e1b] dark:border-emerald-400/40 dark:bg-[#063f32] dark:text-[#8ff5d2] dark:hover:bg-[#25D366] dark:hover:text-[#052e1b]"
                  >
                    <WhatsAppIcon />
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto w-full max-w-[1720px] px-4 py-14 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="A straightforward repair process."
            description="Submit the device problem once, receive updates and track the repair until completion."
          />
        </Reveal>

        <div className="relative mt-9 grid gap-4 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-[#d8cdb6] dark:bg-[#302c24] md:block"
          />

          {processSteps.map((step, index) => (
            <Reveal key={step.number} delay={index * 100}>
              <ProcessCard
                number={step.number}
                title={step.title}
                description={step.description}
              />
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-center">
            <Link
              to="/book-repair"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-8 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
            >
              Start Your Repair Request
              <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50 px-6 text-sm font-black text-emerald-900 transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-[#052e1b] dark:border-emerald-400/40 dark:bg-[#063f32] dark:text-[#8ff5d2] dark:hover:bg-[#25D366] dark:hover:text-[#052e1b]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </Reveal>
      </section>

      <HomeFeedbackSection />

      <HomeFeaturedProduct />

      <HomeServiceInformation settings={settings} />

      {/* Location and contact */}
      <section className="mx-auto w-full max-w-[1720px] px-4 py-14 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <Reveal>
            <div className="h-full rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Visit the shop
              </p>

              <h2 className="font-display mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                Local repair support in {settings.area || "Santacruz West"}.
              </h2>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#6f6758] dark:text-[#a8a093]">
                {settings.address}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <ContactInformation
                  label="Primary number"
                  value={settings.primaryPhone}
                  href={primaryPhone}
                />

                <ContactInformation
                  label="Alternative number"
                  value={settings.secondaryPhone}
                  href={secondaryPhone}
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <aside className="h-full rounded-[1.75rem] border border-[#302c24] bg-[#1f1a12] p-6 text-[#f7f5ef] shadow-xl shadow-black/15 dark:bg-[#1a1712] sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d6b46a]">
                Need help now?
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight">
                Speak with the shop or submit a repair request.
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-[#d8cdb6] dark:text-[#a8a093]">
                Share the device type and problem so the shop can guide you
                about the next step.
              </p>

              <div className="mt-7 grid gap-3">
                <a
                  href={primaryPhone}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f7f5ef] px-5 text-sm font-black text-[#1f1a12] transition hover:bg-[#d6b46a]"
                >
                  <PhoneIcon />
                  Call {settings.primaryPhone}
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-black text-[#052e1b] shadow-sm transition hover:bg-[#48df7f]"
                >
                  <WhatsAppIcon />
                  WhatsApp the Shop
                </a>

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-black transition hover:bg-white/10"
                >
                  <MapPinIcon />
                  Get Directions in Google Maps
                </a>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

function HeroProductVisual() {
  return (
    <div className="home-product-stage relative mx-auto flex min-h-[360px] w-full max-w-[760px] items-center justify-center py-2 sm:min-h-[430px] lg:min-h-[500px]">
      <div
        aria-hidden="true"
        className="absolute bottom-[10%] left-[8%] right-[5%] h-12 rounded-[50%] bg-black/25 blur-2xl dark:bg-black/55"
      />

      <div className="home-product-tilt relative z-10 w-full">
        <img
          src="/images/hero/tv-remote-speaker-hero-v3.png"
          alt="Two modern televisions, a remote control and a premium speaker"
          width="1727"
          height="911"
          fetchPriority="high"
          decoding="async"
          className="home-product-hero h-auto w-full object-contain drop-shadow-[0_28px_34px_rgba(0,0,0,0.32)]"
        />
      </div>
    </div>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] p-3 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-4">
      <p className="text-lg font-black text-[#8a6624] dark:text-[#d6b46a] sm:text-xl">
        {value}
      </p>

      <p className="mt-1 break-words text-[10px] font-semibold leading-4 text-[#6f6758] dark:text-[#a8a093] sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function TrustItem({
  value,
  label,
  icon,
  last
}: {
  value: string;
  label: string;
  icon: "experience" | "location" | "home" | "track";
  last: boolean;
}) {
  return (
    <div
      className={`flex h-full items-center gap-3 border-b border-[#d8cdb6] px-3 py-5 dark:border-[#302c24] sm:px-5 lg:border-b-0 lg:border-r lg:py-6 ${
        last ? "lg:border-r-0" : ""
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <FeatureIcon type={icon} />
      </span>

      <div className="min-w-0">
        <p className="text-sm font-black">{value}</p>

        <p className="mt-0.5 text-[10px] font-semibold leading-4 text-[#6f6758] dark:text-[#a8a093] sm:text-xs">
          {label}
        </p>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
          {eyebrow}
        </p>

        <h2 className="font-display mt-4 max-w-4xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
          {title}
        </h2>

        <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

function ServiceCard({
  service,
  whatsappUrl
}: {
  service: ServiceItem;
  whatsappUrl?: string;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7]/95 shadow-[0_10px_30px_rgba(47,38,22,0.06)] transition duration-300 hover:-translate-y-1.5 hover:border-[#c7b98e] hover:shadow-[0_22px_50px_rgba(47,38,22,0.14)] dark:border-[#302c24] dark:bg-[#161410]/95 dark:hover:border-[#5a4e3a] dark:hover:shadow-[0_22px_55px_rgba(0,0,0,0.35)]">
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#fff8e7] sm:h-52 dark:bg-[#11110f]">
        {service.imageUrl ? (
          <>
            <img
              src={service.imageUrl}
              alt={`${service.title} service`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover saturate-[0.9] transition duration-700 group-hover:scale-[1.045] group-hover:saturate-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/15" />
          </>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="absolute h-28 w-28 rounded-full bg-[#d6b46a]/15 blur-2xl transition duration-500 group-hover:scale-125"
            />

            <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[#d6b46a]/30 bg-[#fffdf7] text-[#8a6624] shadow-sm transition duration-300 group-hover:scale-105 dark:bg-[#1a1712] dark:text-[#d6b46a]">
              <ServiceIcon type={service.icon} />
            </span>
          </>
        )}

        <span className="absolute left-4 top-4 z-10 w-fit rounded-full border border-white/15 bg-[#11110f]/75 px-3 py-1.5 text-[10px] font-black text-[#f2d785] shadow-lg backdrop-blur-md">
          {service.badge}
        </span>

        <span className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[#11110f]/70 text-[#f2d785] shadow-lg backdrop-blur-md transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#d6b46a] group-hover:text-[#11110f]">
          <ServiceIcon type={service.icon} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl font-black leading-tight sm:text-[1.35rem]">
          {service.title}
        </h3>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#b2aa9d]">
          {service.description}
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {service.highlights.map((highlight) => (
            <li
              key={highlight}
              className="inline-flex items-center gap-2 rounded-full border border-[#e6dbc5] bg-[#fff9ed] px-3 py-1.5 text-[11px] font-bold leading-4 text-[#665d4e] dark:border-[#343027] dark:bg-[#1d1a15] dark:text-[#b8b0a3]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#b7862f] dark:bg-[#d6b46a]" />
              {highlight}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center gap-2 pt-6">
          <Link
            to={`/book-repair?category=${encodeURIComponent(service.categoryParam)}`}
            className="group/action inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1f1a12] px-3 py-2.5 text-xs font-black text-[#f7f5ef] shadow-sm transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
          >
            <span>Book Repair</span>
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover/action:translate-x-0.5" />
          </Link>

          {whatsappUrl && (
            <a
              href={`${whatsappUrl}%20regarding%20${encodeURIComponent(service.title)}`}
              target="_blank"
              rel="noreferrer"
              title={`Enquire about ${service.title} on WhatsApp`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3 py-2.5 text-xs font-black text-emerald-900 transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-[#052e1b] dark:border-emerald-400/45 dark:bg-[#063f32] dark:text-[#8ff5d2] dark:hover:bg-[#25D366] dark:hover:text-[#052e1b]"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span>Enquiry</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function AboutPoint({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[#514838] dark:text-[#d5cec2]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
        ✓
      </span>
      {text}
    </span>
  );
}

function ProcessCard({
  number,
  title,
  description
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="relative h-full rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-[#302c24] dark:bg-[#1a1712]">
      <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f1a12] text-sm font-black text-[#f7f5ef] shadow-sm dark:bg-[#d6b46a] dark:text-[#11110f]">
        {number}
      </span>

      <h3 className="mt-5 text-xl font-black">{title}</h3>

      <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {description}
      </p>
    </article>
  );
}

function ContactInformation({
  label,
  value,
  href
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 text-[#1f1a12] transition hover:-translate-y-0.5 hover:border-[#d6b46a] hover:bg-[#fff4cc] hover:shadow-md dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016]"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-base font-black tracking-wide">{value}</p>

        <span className="text-[#8a6624] transition group-hover:scale-110 dark:text-[#d6b46a]">
          <PhoneIcon />
        </span>
      </div>
    </a>
  );
}

function Reveal({
  children,
  className = "",
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      element.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        element.dataset.visible = "true";
        observer.unobserve(element);
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -45px 0px"
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={`home-reveal ${className}`}
      style={
        {
          "--home-reveal-delay": `${delay}ms`
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

function ServiceIcon({ type }: { type: ServiceIconType }) {
  if (type === "tv") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="h-10 w-10"
      >
        <rect
          x="7"
          y="10"
          width="34"
          height="24"
          rx="4"
          stroke="currentColor"
          strokeWidth="2.8"
        />
        <path
          d="M19 40h10M24 34v6"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="m18 6 6 4 6-4"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "theatre") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="h-10 w-10"
      >
        <rect
          x="5"
          y="10"
          width="10"
          height="30"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.8"
        />
        <rect
          x="33"
          y="10"
          width="10"
          height="30"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.8"
        />
        <rect
          x="18"
          y="18"
          width="12"
          height="15"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.8"
        />
        <circle cx="10" cy="29" r="3" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="38" cy="29" r="3" stroke="currentColor" strokeWidth="2.4" />
      </svg>
    );
  }

  if (type === "remote") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="h-10 w-10"
      >
        <rect
          x="15"
          y="4"
          width="18"
          height="40"
          rx="8"
          stroke="currentColor"
          strokeWidth="2.8"
        />
        <circle cx="24" cy="14" r="4" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="M20 25h8M20 31h3M26 31h2M20 37h3M26 37h2"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <rect
        x="10"
        y="5"
        width="28"
        height="38"
        rx="7"
        stroke="currentColor"
        strokeWidth="2.8"
      />
      <circle cx="24" cy="18" r="7" stroke="currentColor" strokeWidth="2.8" />
      <circle cx="24" cy="33" r="4" stroke="currentColor" strokeWidth="2.8" />
    </svg>
  );
}

function FeatureIcon({
  type
}: {
  type: "experience" | "location" | "home" | "track";
}) {
  if (type === "location") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path
          d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="9"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (type === "home") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path
          d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "track") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 3v18M8 7h8M8 12h8M8 17h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
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

function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 ${className}`}
    >
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
function WhatsAppIcon({
  className = "h-4 w-4 shrink-0"
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.81-.37-4.04-1.07l-.29-.17-3.11.82.83-3.03-.19-.31a8.2 8.2 0 0 1-1.26-4.48c0-4.54 3.7-8.24 8.24-8.24m4.54 11.64c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.65.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.08s.9 2.42 1.02 2.59c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29" />
    </svg>
  );
}

function MapPinIcon({
  className = "h-4 w-4 shrink-0"
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function getWhatsAppNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("91")) {
    return digits;
  }

  return `91${digits}`;
}

function getTelHref(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) {
    return "#";
  }

  if (digits.startsWith("91")) {
    return `tel:+${digits}`;
  }

  return `tel:+91${digits}`;
}

export default HomePage;
