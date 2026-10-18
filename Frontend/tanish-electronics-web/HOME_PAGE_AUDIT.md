# Tanish Electronics home page audit

Date: 15 October 2026

## Verdict and scope

The existing warm cream, gold, dark theme, electronics artwork and repair-first positioning provide a coherent foundation. The most useful improvements are clearer customer expectations, stronger evidence of the real business, fewer interruptions, working category navigation, and faster initial loading.

This is a source, asset and local HTTP audit of the landing/home page, shared navigation/footer, reviews, announcements, sign-in prompt and floating support controls. Destination pages were checked where needed to trace home-page links. Application source code was not changed.

The local home page returned HTTP 200. Local public endpoints returned shop settings, 11 reviews (requested limit 12), and two announcements, both marked showOnce. These are local development observations, not verified production data. showOnce makes announcements eligible for the popup selection; it does not mean both appear together or that a returning visitor will see them.

No browser surface was available through the session browser tool. Consequently, this report does not claim a rendered desktop/mobile inspection, successful click-through testing, Lighthouse scores, screen-reader testing, or WCAG certification. Layout risks are identified from responsive classes and need browser verification. Business promises and review authenticity were not independently verified.

## Keep

- Preserve the established warm brand palette, grid motif and transparent electronics hero composition.
- Keep Book a Repair as the primary action; retain direct calling and guest booking.
- Keep online tracking as a useful differentiator.
- Keep the four clear repair categories and their category-specific booking links. The booking page does read the category query parameter.
- Keep real customer feedback, local address, directions and family-business context.
- Preserve existing image alt text, hero intrinsic dimensions/high fetch priority, lazy-loaded service images, and reduced-motion handling.

## Findings and recommendations

Priority: P1 = address first; P2 = next improvement; P3 = polish. No numerical design score is assigned without a rendered inspection.

### 1. P1 — Product-category links do not apply their intended filter

Confirmed in source: HomePage.tsx:821 links to `/products?search=...`, while ProductsPage.tsx:128 initializes search to an empty string and does not read URL query parameters. Visitors selecting Remote Controls or Power Adapters reach the catalogue without the intended category search.

Recommendation: initialize and synchronize catalogue filters from the URL. Prefer stable category identifiers to broad keyword matching when actual categories are available. Verify all four links, refreshing a filtered URL, and browser Back navigation.

### 2. P1 — Remove the timed account interruption

Confirmed in source: SignInExperienceModal.tsx:8 opens an account suggestion after eight seconds for eligible signed-out visitors. It can also appear on booking/tracking routes, which are not excluded. A visitor can already browse and book as a guest.

Recommendation: remove this automatic modal. Offer account benefits after a successful booking or through a small optional inline message. Keep the existing account entry in navigation. The customer should be able to understand the business and request help without dismissing an account promotion.

### 3. P1 — Qualify the hero promises

Confirmed in source: HomePage.tsx:259–263 says Same Day / Initial inspection, Pricing upfront, and No Calls / Track status online. The local shop settings say home visits depend on availability and the shop will call to confirm. The repair process describes pricing updates after inspection.

Recommendation: replace No Calls with Online Updates. State whether an estimate is provided after diagnosis and whether approval is required before repair. Publish same-day inspection only if the shop can support it, with relevant availability conditions. The distinction between inspection, appointment confirmation and completed repair should be explicit.

Suggested short trust labels: Experienced technician; Estimate before repair; Online status updates. Use each only if operationally true.

### 4. P1 — Publish essential service details

Confirmed absence from the home-page content and public settings model: opening hours, inspection/home-visit charging policy, repair-warranty terms and a clear no-repair charging explanation. The settings have a service-radius value, but the homepage does not explain specific coverage.

Recommendation: add a compact Service information / FAQ block covering:

- Shop opening hours and closed days.
- Areas supported for TV home visits, and how availability is confirmed.
- Inspection/home-visit fees and what happens if a customer declines the estimate.
- Repair estimate and approval process.
- Warranty scope and exclusions, if offered.
- Approximate turnaround expectations and dependence on diagnosis/parts.

Use actual shop policies; do not invent prices, warranties or guaranteed completion times.

### 5. P1 — Fix mobile menu keyboard behavior

Confirmed in source: PublicNavbar.tsx:433 keeps the mobile drawer mounted while closed, hides it through transforms/pointer-events and aria-hidden, and does not make its descendants inert. Its key handler handles Escape but does not contain Tab focus or restore focus to the opener.

Recommendation: unmount or make the closed drawer inert; contain focus while open; make the background inert; restore focus to the menu button on close. Test signed-in and signed-out menus below the desktop breakpoint. aria-hidden alone does not remove links/buttons from the keyboard tab order.

The sign-in suggestion also lacks complete focus containment and restoration. Removing it resolves that surface; otherwise use the same accessible dialog pattern. The announcement popup already includes a Tab loop and focus restoration, which should be retained and supplemented with background inertness.

### 6. P1 — Reduce initial download cost

Verified by npm run build: the main JavaScript output is 1,930.14 kB, 483.83 kB gzip, and the build emits its large-chunk warning. App.tsx eagerly imports admin and customer pages. The hero PNG is 2,006,273 bytes, approximately 2 MB.

Recommendation: split non-home routes, especially admin/customer pages, into lazy-loaded chunks. Serve appropriately sized transparent WebP/AVIF hero variants with a compatible fallback; use srcset/sizes. Keep the hero eager/high priority and avoid adding video backgrounds. Compress service photos after visual comparison. Actual loading gains need device/network measurement.

### 7. P2 — Make the hero more specific

Current headline: Trusted TV and electronics repair near your home. The badge and title metadata identify Santacruz West, but the main headline is generic.

Suggested direction: TV & Electronics Repair in Santacruz West. Supporting copy can explain TV, home theatre, remote and speaker repairs, shop service and supported TV home visits in two short sentences. Keep Book a Repair primary, Call the Shop secondary, and Track Repair a quieter utility action.

The green pulsing badge dot is decorative rather than a live opening/availability indicator. Avoid presenting it as Open now unless connected to actual hours.

### 8. P2 — Give services priority over routine news

Confirmed order: hero, announcement slideshow, trust strip, services, about, process, reviews, products, contact, footer. Announcement slides reserve approximately 300–360 px minimum height before section heading/padding, placing news ahead of the service choices.

Recommendation: place services directly after a short trust line. Show an urgent closure/service alert in a compact prominent banner; move routine offers/product news farther down. Reserve modal announcements for information that warrants interrupting a visitor, and avoid repeating the same promotion as both a modal and a large slideshow.

### 9. P2 — Simplify repeated calls to action and benefit strips

Confirmed: Book Repair, contact options, experience, clear guidance and tracking repeat across hero, services, about, process, reviews, final contact and footer. The footer adds another three-card trust panel.

Recommendation: keep strong booking actions in the header, hero, service cards and final contact area. Remove the separate footer trust panel and unnecessary duplicate CTA rows. Condense About into a short evidence-led introduction. Keep useful repetition at decision points without making every section another sales prompt.

### 10. P2 — Strengthen the three-step repair process

Current process moves from request to inspection/update to completion. Customer approval is not an explicit step.

Suggested wording, subject to the shop's actual process:

1. Tell us the device and problem.
2. Receive an inspection and approve the estimate.
3. Collect the repaired device or confirm completion, with online updates.

State that a requested home-visit time awaits confirmation where applicable.

### 11. P2 — Use reviews as readable proof

The local endpoint returned 11 reviews. For more than three, HomeFeedbackSection renders two continuously moving rows; comments are clamped to four lines with no full-review control. Hover/focus pause and reduced-motion styles exist, but there is no explicit pause button and the cards have no normal focusable reading control. createdAt exists in the data but is not displayed.

Recommendation: show three static representative reviews, dates, service type and an optional full-review expansion. Identify their source accurately as website repair feedback. If adding a Google Reviews link/rating, use verified current Google data and distinguish it from website reviews. Do not treat the limited endpoint response as the business's total review count or overall rating.

### 12. P2 — Separate missing reviews from failed loading

Confirmed: an API error sets feedbacks to an empty array, which renders First Review Awaits / Book Your First Repair. A temporary outage can therefore present an established shop as having no reviews.

Recommendation: give loading, empty and error separate states. On failure, use a discreet unavailable/retry message or omit the optional section. Avoid a large empty-state marketing panel. This is a confirmed fallback defect, not a claim that the endpoint is currently failing.

### 13. P2 — Improve photographic consistency and real-business evidence

Inspected all five home-page image assets. The hero has a polished product composition. Service images have different lighting and framing: an exposed TV board, home theatre in a busy workshop, remotes on fabric/in packaging, and a tightly framed speaker grille.

Recommendation: retain authentic repair photography but reshoot/crop it consistently, with even light, a clear device focal point and less distracting background. Add one real technician/workshop or shopfront photograph beside the brief About section, with an accurate caption. Preserve the existing hero direction. Use genuine shop evidence rather than adding more decorative effects.

### 14. P2 — Connect product claims to actual stock

Confirmed: the homepage has category descriptions and static badges such as Ready Stock and Verified Stock. It has no live product cards, prices or per-item condition/warranty details. The page's product enquiry message also begins I need repair help before appending the product category.

Recommendation: if product sales matter, show up to three available items with real photos, price, condition, availability and View details / Enquire. Otherwise keep a compact category section. Replace permanent stock claims with neutral category labels unless backed by live inventory. For second-hand TVs, show actual testing/condition/warranty information. Use a product-specific WhatsApp message.

### 15. P2 — Improve location and navigation usefulness

Contact information and Google Maps directions exist, but visit planning is near the bottom and no opening hours are shown. Desktop navigation contains Home, Track Request and Products plus Book Repair, without service/contact section shortcuts.

Recommendation: add lightweight Services and Visit us anchors if header space permits; standardize Track Request / Track Repair to one customer-facing label. Place hours and directions together. A small map preview or real shopfront image is optional; retain the directions link and avoid a heavy mandatory map embed.

### 16. P2 — Reduce support-widget competition

Confirmed: WhatsApp and the AI assistant have separate stacked floating launchers, and the assistant can show a proactive suggestion bubble. Announcement and sign-in modals add further overlays. The assistant panel uses z-index 99999, higher than the page's 900-level modals.

Recommendation: use one Help launcher that offers WhatsApp, call and assistant options, or choose one persistent primary support control. Keep the assistant opt-in. Define which overlay can be open and suppress other launchers/prompts while a modal is active. Test narrow screens, the on-screen keyboard and final contact actions before deciding the exact layout. Actual overlap was not visually verified.

### 17. P2 — Establish a clearer typography hierarchy

Confirmed: the global body uses Newsreader, the display serif, while Inter is loaded and available. Homepage paragraphs frequently use font-semibold and labels/actions font-black; many supporting labels are 10–11 px.

Recommendation: keep Newsreader for major headings and use Inter for descriptions, forms, buttons and utility text. Use regular/medium for paragraphs, semibold for actions and a limited set of bold headings. Raise important small text and avoid long uppercase labels. Preserve the warm theme while reducing typographic weight and visual clutter.

### 18. P2 — Correct low-contrast small text and small controls

Calculated opaque color-pair contrast from source tokens:

| Foreground / background | Ratio | Normal-text threshold |
|---|---:|---|
| #6f6758 / #f7f5ef | 5.13:1 | Meets 4.5:1 |
| #8a6624 / #f7f5ef | 4.81:1 | Meets 4.5:1 |
| #a8a093 / #11110f | 7.30:1 | Meets 4.5:1 |
| #8f8778 / #fffdf7 | 3.50:1 | Below 4.5:1 |
| #817867 / #f7f5ef | 4.00:1 | Below 4.5:1 |
| #746d61 / #11110f | 3.69:1 | Below 4.5:1 |

Examples include muted brand/utility text, announcement helper text and popup small print. These are source-token calculations, not a complete rendered contrast survey; use actual backgrounds when validating each instance.

The announcement pagination dots use 8 px-high buttons. Expand their clickable areas while keeping the visual dots small. Aim for 44–48 px controls for comfortable touch use. WCAG 2.2 AA's minimum target-size criterion is 24×24 CSS px or its specified spacing/other exceptions; 44 px is an enhanced/usability target, not the AA minimum.

### 19. P2 — Make motion optional and content reliably visible

Confirmed: reviews move indefinitely, announcements rotate every six seconds, and the hero/orbs/status dot animate. Reduced-motion handling exists. The reviews/announcements do not expose explicit pause controls. Home reveal wrappers begin at opacity 0 until IntersectionObserver marks them visible, including the hero content.

Recommendation: favor static reviews and manual announcements, or add persistent pause controls. Keep only a small amount of decorative motion. Render the above-the-fold heading and actions immediately; make lower-page reveal animation progressive enhancement so observer failures do not leave content hidden. Verify keyboard focus never lands in visually unrevealed content.

### 20. P2 — Correct landmarks and add a skip link

Confirmed: PublicLayout.tsx:19 provides main and HomePage.tsx:194 nests another main inside it. No skip-to-content link was found in the public shell.

Recommendation: expose one main landmark with a stable id and add a visible-on-focus Skip to content link before navigation. Preserve the meaningful heading hierarchy and existing labels/alt text. Run keyboard and screen-reader checks after the drawer fixes.

### 21. P2 — Improve local search and sharing metadata

Confirmed: index.html has a generic description and initial title; HomePage changes the title after mounting. No canonical, Open Graph, Twitter card or LocalBusiness structured data was found in the inspected entry/home/public-shell code. No sitemap.xml or robots.txt is shipped under public; production/server equivalents were not checked.

Recommendation: use a precise service/location title and description, a canonical production URL, sharing image metadata and factual LocalBusiness JSON-LD consistent with visible contact details/hours. Confirm production indexing and sitemap configuration. Consider prerendering the public homepage if reliable initial HTML metadata/content is needed. Schema helps describe the business; it does not guarantee rankings or a rich result. Do not promise review stars for the business's own reviews.

### 22. P3 — Make the footer smaller and more complete

Recommendation: keep brand, essential navigation, address, hours, phone and directions. Remove the duplicate trust-card panel. Add useful links to actual Privacy, service terms and warranty/returns information when those pages and policies exist. Product claims such as Original & high-grade should be item-specific and verifiable. Standardize 20+ / around 20 / more than 20 years to one accurate statement.

## Proposed page order

1. Existing brand/navigation, with Book Repair and useful section shortcuts.
2. Hero: service + location, short supporting copy, Book Repair / Call, quieter tracking link.
3. One short factual trust line.
4. Four repair services, with clear home-visit/shop-service applicability.
5. Three-step repair and estimate approval process.
6. Three readable customer reviews.
7. Brief About section with a real business/technician photo.
8. Compact available products or categories, if sales are a current priority.
9. FAQ/service policies.
10. Visit/contact: address, hours, directions and final booking action.
11. Compact footer.

Urgent operational notices can appear prominently; routine news belongs later and can be omitted when there is nothing useful to announce.

## Suggested implementation sequence

First: repair product deep links; remove the timed sign-in prompt; fix mobile drawer focus/closed-state behavior and nested main landmarks; qualify hero claims; publish essential service policies.

Next: optimize hero and route loading; simplify announcements/reviews/support launchers; correct low-contrast text; improve service photography and typography.

Then: add accurate business/search metadata, stock-aware product content and a simpler footer.

## Verification completed and remaining

Completed: source tracing, inspection of the hero and four service photos, local home/API HTTP reads, source color-pair calculations, and npm run build. TypeScript/Vite build passed with the large-chunk warning. No application source was edited.

Before calling the revised page finished: render at 360/390 px, tablet, 1024 px and wide desktop; check both themes and 200% zoom; test keyboard navigation, menu focus restoration and all four product/category links; check support controls with the mobile keyboard; test review/announcement loading failures; run an automated accessibility scan plus manual screen-reader checks; measure production-like loading on a throttled mobile connection. No submissions, messages or bookings were sent during this audit.

## Standards consulted

- [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [W3C contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [W3C target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Google LocalBusiness structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [web.dev responsive images](https://web.dev/learn/images/responsive-images)
