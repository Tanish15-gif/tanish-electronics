import type { PublicShopSettings } from "../../Services/publicShopSettingsService";
const shopInformation = { hoursLabel: "11 AM–11 PM" };
const telephoneUrl = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return `tel:+${digits.length === 10 ? "91" + digits : digits}`;
};

export default function HomeServiceInformation({
  settings
}: {
  settings: PublicShopSettings;
}) {
  const questions = [
    {
      question: "When can I visit the shop?",
      answer: `Shop hours are ${shopInformation.hoursLabel}. Call before visiting to confirm holiday hours or any closed days.`
    },
    {
      question: "Can I request a home visit?",
      answer: `Home visits are available for TV repairs in supported locations around ${settings.area}. ${settings.homeVisitMessage || "The shop will call to confirm location and availability."} Other devices can be brought to the shop.`
    },
    {
      question: "Is there an inspection or home-visit charge?",
      answer:
        "Ask the shop to confirm any inspection, travel or home-visit charges for your device before arranging service. Repair pricing depends on the device and diagnosis."
    },
    {
      question: "What if I decide not to go ahead with a repair?",
      answer:
        "Discuss the estimate and ask which inspection or visit charges would apply if you decline the repair. Confirm these details with the shop before proceeding."
    },
    {
      question: "How long will a repair take, and is it covered by a warranty?",
      answer:
        "Timing depends on diagnosis and parts availability. Ask the shop for the expected completion time and any applicable parts or repair warranty, including its duration and exclusions, for your specific job."
    },
    {
      question: "Do I need an account to book or track a repair?",
      answer:
        "You can submit a repair request as a guest. Keep your repair number and verification details to track it online. Signing in is optional and lets you manage your requests in one place."
    }
  ];
  return (
    <section
      id="service-information"
      aria-labelledby="faq-heading"
      className="retained-faq home-section home-section-bordered"
    >
      <div className="home-container grid gap-8 lg:grid-cols-[0.7fr_1fr] lg:gap-16">
        <div>
          <p className="home-kicker">Before you book</p>
          <h2 id="faq-heading" className="home-title">
            A few helpful answers.
          </h2>
          <p className="home-copy mt-5 leading-7">
            Have a question about your device or service charges?
          </p>
          <a
            href={telephoneUrl(settings.primaryPhone)}
            className="home-button home-accent mt-3 px-0"
          >
            Call {settings.primaryPhone}
          </a>
        </div>
        <div className="divide-y divide-[#d8cdb6] border-y border-[#d8cdb6] dark:divide-[#302c24] dark:border-[#302c24]">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group py-1">
              <summary className="cursor-pointer py-4 pr-4 text-base font-semibold leading-7">
                {question}
              </summary>
              <p className="home-copy pb-5 pr-5 text-sm leading-7">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
