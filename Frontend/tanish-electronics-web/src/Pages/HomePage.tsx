import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
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
    icon: "tv"
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
    icon: "theatre"
  },
  {
    title: "Remote Repair & Sales",
    description:
      "Support for faulty remotes and replacement options for TVs and set-top boxes.",
    highlights: ["TV remotes", "Set-top box remotes", "Replacement support"],
    badge: "Quick service",
    icon: "remote"
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
    icon: "speaker"
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

const productCategories = [
  {
    title: "Second-hand TVs",
    description: "Checked TVs currently available for enquiry.",
    symbol: "TV"
  },
  {
    title: "Remote Controls",
    description: "TV and set-top box replacement remotes.",
    symbol: "RC"
  },
  {
    title: "Power Adapters",
    description: "Adapters and power accessories for electronics.",
    symbol: "PA"
  },
  {
    title: "Speakers",
    description: "Bluetooth and wired speaker options.",
    symbol: "SP"
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
      <section className="relative overflow-hidden border-b border-[#d8cdb6] bg-transparent dark:border-[#302c24]">
        <div
          aria-hidden="true"
          className="home-orb pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#d6b46a]/15 blur-3xl dark:bg-[#d6b46a]/8"
        />

        <div
          aria-hidden="true"
          className="home-orb-delayed pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#8a6624]/10 blur-3xl dark:bg-[#6f5a33]/15"
        />

        <div className="relative mx-auto grid w-full max-w-[1720px] gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_440px] xl:grid-cols-[minmax(0,1.25fr)_460px] 2xl:grid-cols-[minmax(0,1.35fr)_480px] lg:items-center lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
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
                <HeroMetric value="20+" label="Years experience" />

                <HeroMetric value="Home" label="TV visit support" />

                <HeroMetric value="Local" label="Santacruz West" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <ServiceBookingPanel />
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
      <section className="mx-auto w-full max-w-[1720px] px-4 py-14 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Repair services"
            title="Practical help for everyday home electronics."
            description="Choose the service you need and submit a repair request online. Home visits are available for supported TV repair locations."
            action={
              <Link
                to="/book-repair"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
              >
                Book repair
                <ArrowRightIcon />
              </Link>
            }
          />
        </Reveal>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <Reveal key={service.title} delay={index * 80} className="h-full">
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* About and benefits */}
      <section className="border-y border-[#d8cdb6] bg-transparent dark:border-[#302c24]">
        <div className="mx-auto grid w-full max-w-[1720px] gap-6 px-4 py-14 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
          <Reveal>
            <article className="h-full rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#11110f] sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                About {settings.shopName}
              </p>

              <h2 className="font-display mt-4 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
                Local repair experience built on{" "}
                <span className="text-[#8a6624] dark:text-[#d6b46a]">
                  practical work and trust.
                </span>
              </h2>

              <p className="mt-6 text-base font-semibold leading-8 text-[#6f6758] dark:text-[#a8a093]">
                {settings.shopName} is a family-run repair and electronics-sales
                business based in Gajdhar Bandh, Santacruz West.
              </p>

              <p className="mt-4 text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
                The business is handled by Mr. Subhash Mohanlal Gupta, who has
                around 20 years of hands-on electronics-repair experience. The
                focus is on clear guidance, reasonable pricing and dependable
                local service.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <AboutMetric value="20+" label="Years of experience" />

                <AboutMetric value="TV" label="Main repair speciality" />

                <AboutMetric value="Local" label="Limited service area" />
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
                  href="https://wa.me/918097026781?text=Hello%20Tanish%20Electronics%2C%20I%20need%20help%20with%20an%20electronics%20repair."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d8cdb6] px-6 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
                >
                  WhatsApp
                </a>
              </div>
            </article>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal delay={80}>
              <BenefitCard
                icon="price"
                title="Reasonable pricing"
                description="Clear guidance and pricing discussion before repair work continues."
              />
            </Reveal>

            <Reveal delay={140}>
              <BenefitCard
                icon="home"
                title="Home visit support"
                description="Home visits are available for supported TV repairs in nearby locations."
              />
            </Reveal>

            <Reveal delay={200}>
              <BenefitCard
                icon="track"
                title="Repair tracking"
                description="Customers can check status, estimated price and final updates online."
              />
            </Reveal>

            <Reveal delay={260}>
              <BenefitCard
                icon="experience"
                title="Practical experience"
                description="Repairs are handled with years of hands-on electronics knowledge."
              />
            </Reveal>
          </div>
        </div>
      </section>

      <FounderSection
        photoUrl="/images/GokuBlack.jpg"
        name={settings.ownerName}
        role={`Founder, ${settings.shopName}`}
        bio={`With over 20 years of hands-on electronics-repair experience, ${settings.ownerName} has built ${settings.shopName} on a simple idea — honest guidance, fair pricing and dependable local service for every customer in Santacruz West.`}
      />

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
      </section>

      <HomeFeedbackSection />

      {/* Products */}
      <section className="border-y border-[#d8cdb6] bg-transparent dark:border-[#302c24]">
        <div className="mx-auto grid w-full max-w-[1720px] gap-10 px-4 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
          <Reveal>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Products and sales
              </p>

              <h2 className="font-display mt-4 text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
                Browse available electronics and accessories.
              </h2>

              <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-[#6f6758] dark:text-[#a8a093]">
                View second-hand TVs, remotes, adapters, speakers and
                accessories, then send an enquiry directly from the product
                page.
              </p>

              <Link
                to="/products"
                className="group mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-6 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                View Products
                <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {productCategories.map((product, index) => (
              <Reveal key={product.title} delay={index * 70}>
                <ProductCategoryCard
                  title={product.title}
                  description={product.description}
                  symbol={product.symbol}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Location and contact */}
      <section className="mx-auto w-full max-w-[1720px] px-4 py-14 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <Reveal>
            <div className="h-full rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Visit the shop
              </p>

              <h2 className="font-display mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                Local repair support in Santacruz West.
              </h2>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#6f6758] dark:text-[#a8a093]">
                Hanuman Chowk, Behind Hanuman Mandir, Gajdhar Bandh, Santacruz
                West, Mumbai – 400054.
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <ContactInformation
                  label="Primary number"
                  value="8097026781"
                  href={primaryPhone}
                />

                <ContactInformation
                  label="Alternative number"
                  value="8850973399"
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
                  Call 8097026781
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-black transition hover:bg-white/10"
                >
                  WhatsApp the Shop
                </a>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-14 sm:px-8 sm:pb-16 lg:px-12 xl:px-16 2xl:px-20 lg:pb-20">
        <Reveal>
          <div className="relative mx-auto w-full max-w-[1720px] overflow-hidden rounded-[1.75rem] border border-[#302c24] bg-[#1f1a12] p-6 text-[#f7f5ef] shadow-2xl shadow-black/20 dark:bg-[#1a1712] sm:p-9 lg:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#d6b46a]/15 blur-3xl"
            />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d6b46a]">
                  Start your repair request
                </p>

                <h2 className="font-display mt-4 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
                  Need help with your TV or electronics?
                </h2>

                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#d8cdb6] dark:text-[#a8a093]">
                  Book online and track service updates without calling
                  repeatedly.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/book-repair"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f7f5ef] px-6 text-sm font-black text-[#1f1a12] transition hover:bg-[#d6b46a]"
                >
                  Book Repair
                  <ArrowRightIcon />
                </Link>

                <Link
                  to="/track-request"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-black transition hover:bg-white/10"
                >
                  Track Request
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function ServiceBookingPanel() {
  return (
    <aside className="home-soft-float rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-3 shadow-2xl shadow-[#d8cdb6]/35 dark:border-[#302c24] dark:bg-[#1a1712] dark:shadow-black/30">
      <div className="rounded-[1.35rem] border border-[#d8cdb6] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Local repair support
            </p>

            <h2 className="mt-2 text-2xl font-black leading-tight">
              Need your device checked?
            </h2>
          </div>

          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1f1a12] text-xs font-black text-[#f7f5ef] dark:bg-[#d6b46a] dark:text-[#11110f]">
            TE
          </span>
        </div>

        <div className="mt-6 space-y-3">
          <ServiceFeature
            title="TV repair"
            text="LED, LCD, Smart TV and box TV"
          />

          <ServiceFeature
            title="Home visit"
            text="Available within supported local areas"
          />

          <ServiceFeature
            title="Online tracking"
            text="View repair status and price updates"
          />

          <ServiceFeature
            title="Shop repair"
            text="Bring smaller devices directly to the shop"
          />
        </div>

        <div className="mt-5 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
            Primary service area
          </p>

          <p className="mt-2 text-sm font-black">
            Santacruz West and nearby supported locations
          </p>
        </div>

        <Link
          to="/book-repair"
          className="group mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
        >
          Start Repair Booking
          <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </aside>
  );
}

function ServiceFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#eadfca] bg-[#fffdf7] p-3 dark:border-[#302c24] dark:bg-[#1a1712]">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
        ✓
      </span>

      <div>
        <p className="text-sm font-black">{title}</p>

        <p className="mt-0.5 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
          {text}
        </p>
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

function ServiceCard({ service }: { service: ServiceItem }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#c7b98e] hover:shadow-xl dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b] dark:hover:shadow-black/25">
      <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]">
        <div
          aria-hidden="true"
          className="absolute h-28 w-28 rounded-full bg-[#d6b46a]/15 blur-2xl transition duration-500 group-hover:scale-125"
        />

        <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[#d6b46a]/30 bg-[#fffdf7] text-[#8a6624] shadow-sm transition duration-300 group-hover:scale-105 dark:bg-[#1a1712] dark:text-[#d6b46a]">
          <ServiceIcon type={service.icon} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="w-fit rounded-full border border-[#d6b46a]/40 bg-[#fff4cc] px-3 py-1 text-[10px] font-black text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          {service.badge}
        </span>

        <h3 className="mt-4 text-xl font-black leading-tight">
          {service.title}
        </h3>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          {service.description}
        </p>

        <ul className="mt-4 space-y-2">
          {service.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex items-start gap-2 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6b46a]" />
              {highlight}
            </li>
          ))}
        </ul>

        <Link
          to="/book-repair"
          className="mt-5 inline-flex items-center gap-1 text-xs font-black text-[#8a6624] transition hover:gap-2 dark:text-[#d6b46a]"
        >
          Book this service
          <ArrowRightIcon />
        </Link>
      </div>
    </article>
  );
}

function AboutMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
      <p className="text-2xl font-black text-[#8a6624] dark:text-[#d6b46a]">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
        {label}
      </p>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description
}: {
  icon: "price" | "home" | "track" | "experience";
  title: string;
  description: string;
}) {
  return (
    <article className="group h-full rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#c7b98e] hover:shadow-lg dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#50483b]">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] transition group-hover:scale-105 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <FeatureIcon type={icon} />
      </span>

      <h3 className="mt-5 text-lg font-black">{title}</h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {description}
      </p>
    </article>
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

function ProductCategoryCard({
  title,
  description,
  symbol
}: {
  title: string;
  description: string;
  symbol: string;
}) {
  return (
    <Link
      to="/products"
      className="group flex h-full items-start gap-4 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#c7b98e] hover:shadow-lg dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#50483b]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff4cc] text-xs font-black text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        {symbol}
      </span>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-black">{title}</h3>

          <ArrowRightIcon className="shrink-0 transition-transform group-hover:translate-x-1" />
        </div>

        <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>
    </Link>
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
  type: "experience" | "location" | "home" | "track" | "price";
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

  if (type === "price") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path
          d="M5 5h14v14H5V5Zm4 4h6M9 12h4a2 2 0 1 1 0 4H9M12 8v8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
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
function FounderSection({
  photoUrl,
  name,
  role,
  bio
}: {
  photoUrl: string;
  name: string;
  role: string;
  bio: string;
}) {
  return (
    <section className="border-y border-[#d8cdb6] bg-transparent dark:border-[#302c24]">
      <div className="mx-auto grid w-full max-w-[1720px] gap-10 px-4 py-14 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:px-12 xl:px-16 2xl:px-20 lg:py-20">
        <Reveal>
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#d6b46a]/15 blur-3xl dark:bg-[#d6b46a]/8"
            />

            <img
              src={photoUrl}
              alt={name}
              className="relative aspect-[4/5] w-full rounded-[2rem] border border-[#d8cdb6] object-cover shadow-xl shadow-black/10 dark:border-[#302c24] dark:shadow-black/30 sm:aspect-[5/6] lg:aspect-[4/5]"
            />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
              Meet the founder
            </p>

            <h2 className="font-display mt-4 max-w-xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
              {name}
            </h2>

            <p className="mt-3 text-sm font-black uppercase tracking-[0.08em] text-[#8a6624] dark:text-[#d6b46a]">
              {role}
            </p>

            <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-[#6f6758] dark:text-[#a8a093]">
              {bio}
            </p>

            <div className="mt-7 grid max-w-md grid-cols-2 gap-3">
              <AboutMetric value="20+" label="Years of experience" />
              <AboutMetric value="1000+" label="Devices repaired" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
export default HomePage;
