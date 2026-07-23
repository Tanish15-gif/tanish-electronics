import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  getPublicRepairFeedbacks,
  type PublicRepairFeedback
} from "../../Services/publicFeedbackService";

function HomeFeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<PublicRepairFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  async function loadFeedbacks() {
    try {
      const data = await getPublicRepairFeedbacks(12);
      setFeedbacks(data);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden bg-[#fffaf0] px-4 py-20 text-[#1f1a12] dark:bg-[#1a1712] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
      <ReviewLoopStyles />

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 border-b border-[#d8cdb6] pb-8 dark:border-[#302c24] lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8a6624] dark:text-[#d6b46a] sm:text-sm">
              Customer Reviews
            </p>

            <h2 className="font-display mt-3 max-w-4xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Trusted by local customers.
            </h2>

            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
              Real repair experiences shared by customers after their service is
              completed.
            </p>
          </div>

          <Link
            to="/book-repair"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f1a12] px-6 py-4 text-sm font-black text-[#f7f5ef] shadow-[0_12px_30px_-18px_rgba(31,26,18,0.8)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] sm:w-auto"
          >
            Book Repair
          </Link>
        </div>

        {loading ? (
          <LoadingReviews />
        ) : feedbacks.length === 0 ? (
          <EmptyFeedbackState />
        ) : feedbacks.length <= 3 ? (
          <StaticFeedbackGrid feedbacks={feedbacks} />
        ) : (
          <DoubleDeckerReviewLoop feedbacks={feedbacks} />
        )}
      </div>
    </section>
  );
}

function DoubleDeckerReviewLoop({
  feedbacks
}: {
  feedbacks: PublicRepairFeedback[];
}) {
  const firstRow = feedbacks.filter((_, index) => index % 2 === 0);
  const secondRow = feedbacks.filter((_, index) => index % 2 !== 0);

  return (
    <div className="relative mt-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-[#fffaf0] via-[#fffaf0]/90 to-transparent dark:from-[#1a1712] dark:via-[#1a1712]/90 sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[#fffaf0] via-[#fffaf0]/90 to-transparent dark:from-[#1a1712] dark:via-[#1a1712]/90 sm:w-20" />

      <div className="review-loop-stack space-y-4 sm:space-y-5">
        <ReviewLoopRow
          feedbacks={firstRow}
          duration={Math.max(34, firstRow.length * 8)}
        />

        <ReviewLoopRow
          feedbacks={secondRow.length > 0 ? secondRow : firstRow}
          duration={Math.max(38, secondRow.length * 8.5)}
          reverse
        />
      </div>

      <p className="mt-6 text-center text-[11px] font-bold uppercase tracking-[0.13em] text-[#817867] dark:text-[#928a7d]">
        Reviews
      </p>
    </div>
  );
}

function ReviewLoopRow({
  feedbacks,
  duration,
  reverse = false
}: {
  feedbacks: PublicRepairFeedback[];
  duration: number;
  reverse?: boolean;
}) {
  const animationStyle = {
    "--review-loop-duration": `${duration}s`
  } as CSSProperties;

  return (
    <div className="review-loop-viewport">
      <div
        style={animationStyle}
        className={`review-loop-track ${
          reverse ? "review-loop-track-reverse" : ""
        }`}
      >
        {[0, 1].map((copyIndex) => (
          <div
            key={copyIndex}
            className="review-loop-group"
            aria-hidden={copyIndex === 1}
          >
            {feedbacks.map((feedback, index) => (
              <div
                key={`${feedback.customerRepairFeedbackId}-${copyIndex}-${index}`}
                className="w-[285px] shrink-0 sm:w-[330px] lg:w-[350px]"
              >
                <FeedbackCard feedback={feedback} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: PublicRepairFeedback }) {
  return (
    <article className="group relative flex min-h-[230px] flex-col overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-[0_14px_40px_-30px_rgba(31,26,18,0.55)] transition duration-300 hover:-translate-y-1 hover:border-[#b99a58] hover:shadow-[0_24px_55px_-30px_rgba(31,26,18,0.65)] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#665736] dark:hover:shadow-black/40">
      <span className="pointer-events-none absolute -right-2 -top-8 font-display text-[8rem] leading-none text-[#d8cdb6]/30 transition duration-300 group-hover:text-[#d6b46a]/20 dark:text-[#302c24]/65 dark:group-hover:text-[#d6b46a]/10">
        “
      </span>

      <div className="relative z-10">
        <Stars rating={feedback.rating} />

        <p className="mt-5 line-clamp-4 text-sm font-semibold leading-7 text-[#5f574a] dark:text-[#b8b0a2]">
          “{feedback.comment}”
        </p>
      </div>

      <div className="relative z-10 mt-auto pt-6">
        <div className="h-px bg-[#d8cdb6] dark:bg-[#302c24]" />

        <div className="flex items-end justify-between gap-4 pt-4">
          <div className="min-w-0">
            <p className="truncate text-base font-black text-[#1f1a12] dark:text-[#f7f5ef]">
              {feedback.customerName}
            </p>

            <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
              {feedback.serviceCategory}
            </p>
          </div>

          <span className="h-2 w-2 shrink-0 rounded-full bg-[#d6b46a] shadow-[0_0_0_5px_rgba(214,180,106,0.12)]" />
        </div>
      </div>
    </article>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className={`text-lg leading-none ${
            star <= rating
              ? "text-[#d6b46a]"
              : "text-[#d8cdb6] dark:text-[#302c24]"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function EmptyFeedbackState() {
  return (
    <div className="mt-10 overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-8 shadow-sm dark:border-[#302c24] dark:bg-[#11110f] sm:p-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
        First Review Awaits
      </p>

      <h3 className="font-display mt-4 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl">
        Be one of the first customers to share your repair experience.
      </h3>

      <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
        Book your repair online and share your experience after the service is
        completed.
      </p>

      <Link
        to="/book-repair"
        className="mt-7 inline-flex justify-center rounded-2xl bg-[#1f1a12] px-6 py-4 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
      >
        Book Your First Repair
      </Link>
    </div>
  );
}

function LoadingReviews() {
  return (
    <div className="mt-10 space-y-5 overflow-hidden">
      {[0, 1].map((row) => (
        <div key={row} className="flex gap-5">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-[230px] w-[285px] shrink-0 animate-pulse rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#11110f] sm:w-[330px]"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StaticFeedbackGrid({
  feedbacks
}: {
  feedbacks: PublicRepairFeedback[];
}) {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {feedbacks.map((feedback) => (
        <FeedbackCard
          key={feedback.customerRepairFeedbackId}
          feedback={feedback}
        />
      ))}
    </div>
  );
}

function ReviewLoopStyles() {
  return (
    <style>{`
      .review-loop-viewport {
        width: 100%;
        overflow: hidden;
      }

      .review-loop-track {
        display: flex;
        width: max-content;
        animation: review-loop-forward var(--review-loop-duration, 40s) linear infinite;
        will-change: transform;
      }

      .review-loop-track-reverse {
        animation-name: review-loop-reverse;
      }

      .review-loop-group {
        display: flex;
        flex-shrink: 0;
        gap: 1.25rem;
        padding-right: 1.25rem;
      }

      .review-loop-stack:hover .review-loop-track,
      .review-loop-stack:focus-within .review-loop-track {
        animation-play-state: paused;
      }

      @keyframes review-loop-forward {
        from {
          transform: translate3d(0, 0, 0);
        }

        to {
          transform: translate3d(-50%, 0, 0);
        }
      }

      @keyframes review-loop-reverse {
        from {
          transform: translate3d(-50%, 0, 0);
        }

        to {
          transform: translate3d(0, 0, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .review-loop-viewport {
          overflow-x: auto;
          scrollbar-width: none;
        }

        .review-loop-viewport::-webkit-scrollbar {
          display: none;
        }

        .review-loop-track {
          animation: none;
        }

        .review-loop-group[aria-hidden="true"] {
          display: none;
        }
      }
    `}</style>
  );
}

export default HomeFeedbackSection;
