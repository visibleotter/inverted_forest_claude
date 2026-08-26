# Legal documents — review checklist

The Terms and Conditions and Privacy Policy published on the site were
transcribed from two counsel-supplied templates:

- `Website-Terms-and-Conditions-Services-ENG.docx`
- `Privacy-Policy-ENG.docx`

Both templates opened with the line **"THIS DOCUMENT IS NOT LEGAL ADVICE.
YOU MUST CONSULT COUNSEL TO ADAPT IT TO YOUR BUSINESS."** That line is an
instruction to you, not website content, so it is not published — but it
is the reason this file exists. **Nothing here has been reviewed by a
lawyer for Inverted Forest.**

Source of truth: `src/lib/content/legal.ts`. English is authoritative;
the Russian is a convenience translation with a governing-language notice
at the foot of each page.

---

## A. Changes I made to the source text — all need sign-off

### A1. Age restriction (Terms → "Eligibility and Age Restriction")

**The template said** use of the website and services "is intended for
individuals over the age of 18 only", and that anyone under 18 "is
required not to make any use of the website and Services".

**Why it could not be published as written:** Inverted Forest sells
children's and teens' study groups. `group_101` is a children's group and
`group_106` is a teens' group; course pages carry "Children" and "Teens"
badges. Publishing an 18-only clause while selling courses to minors is
self-contradictory and could undermine the enrolment contract.

**What it now says:** purchasing requires an adult of 18+; a minor may
participate only where a parent or legal guardian completed the
registration, accepted the Terms on the minor's behalf, and is
responsible for payment.

**This is the most legally significant edit in the document. It needs a
lawyer, not a developer.** Israeli law on contracting for minors and on
parental consent for processing children's data may require more than
this clause provides.

### A2. Description of services (Terms → "Paid Services")

**The template said** "We provide individual and group consultations,
along with tailored seminars for school teachers … services to parents
seeking guidance on parenting strategies … norms and developmental
characteristics of children's growth."

**Why it could not be published:** that describes a parenting and
teacher-training consultancy. It is not this business. The template was
evidently drafted for a different client and never adapted.

**What it now says:** online courses in history, philosophy, literature
and anthropology for adults, teenagers and children, taught live in small
groups by video, with recordings and materials for group members.

Confirm this description matches how you want the services defined
contractually.

### A3. Payment mechanics (Terms → "Paid Services")

**The template said** users must enter "I.D number, E-mail address and
payment details", and that you are authorised "to charge your card for
total amount of the purchase".

**Why it could not be published:** the platform never collects card data.
Registration collects a name and email, then redirects to the payment
provider's hosted checkout. Claiming otherwise would contradict both the
architecture and the Privacy Policy.

**What it now says:** registration collects name and email; payment is
completed on the provider's secure page; we do not collect or store card
details. Approval by the provider remains a precondition of the order.

Note the template also required an I.D. number at checkout — removed,
since the site does not collect one. The cancellation clause (A4) still
asks for an identification number in a *cancellation notice*, which is
left as drafted.

---

## B. Placeholders you must fill

| Where | Template placeholder | Status |
|---|---|---|
| Terms, opening clause | `[Business Name]` | `NEXT_PUBLIC_LEGAL_NAME` — defaults to "Inverted Forest" |
| Terms, opening clause | `[business registration number]` | `NEXT_PUBLIC_LEGAL_REG_NUMBER` — **empty** |
| Terms, opening clause | `[business address]` | `NEXT_PUBLIC_LEGAL_ADDRESS` — **empty** |
| Terms, cancellation | `[INSERT CONTACT EMAIL]` | filled from `NEXT_PUBLIC_CONTACT_EMAIL` |
| Privacy, data requests | `INSERT YOUR E-MAIL` | filled from `NEXT_PUBLIC_CONTACT_EMAIL` |

Unset values are simply omitted from the sentence rather than rendered as
empty brackets, so **the Terms currently identify the contracting party by
name only** — no registration number, no address. Set those two variables
before launch.

---

## C. Conflicts between the documents and the live site

### C1. Cookie consent — RESOLVED

The policy commits to four cookie categories, to consent being taken before
anything non-essential is set, to withdrawal at any time via a "Manage
cookies" link, and to retaining a record of what was chosen and when. All of
that is now implemented:

- `src/lib/consent.ts` holds the record — version, per-category choices and
  an ISO timestamp — in the `if_cookie_consent` cookie for 180 days.
- `src/components/consent/cookie-consent.tsx` is the banner and the
  preferences panel. Every optional category defaults to off, and
  "Essential only" carries the same visual weight as "Accept all"; a banner
  where refusing is harder than accepting does not collect valid consent.
- A "Manage cookies" control sits in the footer, as the policy names.
- `hasConsent(category)` is the gate to call before loading any third-party
  script, so adding analytics later cannot bypass the choice.

What the site actually sets today is only `NEXT_LOCALE`, the theme value in
localStorage, and the consent record itself — all Essential under the
policy's own definition ("cookies required to provide a feature you
explicitly requested"). The preferences, analytics and marketing categories
are declared but load nothing yet.

**The banner is currently switched off, deliberately.** Measured on a fresh
visit, the site sets one cookie (`NEXT_LOCALE`) and makes zero third-party
requests — `next/font` self-hosts the fonts and Unsplash images are proxied
server-side through Next's optimiser, so a visitor's browser contacts nobody
but us. With nothing optional to consent to, interrupting every visitor
would be friction with no protection behind it, and it would overstate what
the site does.

This does not breach the policy, which promises we will set non-essential
cookies only *after* consent; setting none at all satisfies that. The
"Manage cookies" control stays in the footer, so the withdrawal route the
policy names still exists, and the panel says plainly that no optional
cookies are in use.

`ACTIVE_OPTIONAL_CATEGORIES` in `src/lib/consent.ts` is the switch. Add
`'analytics'` to it the day an analytics script goes in and the banner turns
itself back on — no other change needed.

**Still needs a decision:** the policy also mentions privacy-enhanced
embedding for third-party video. No embeds exist yet; wire them through
`hasConsent('marketing')` when they do.

### C2. Refund copy elsewhere on the site contradicted the Terms — now fixed

The FAQ previously promised "we will refund the first month in full" and
"cancel at the end of any month". I wrote that copy as placeholder text
before these documents existed; it conflicts with the statutory
cancellation regime in the Terms (14 days, at least 7 business days
before the service starts, cancellation fee of up to 5% or ₪100).

I have replaced those answers with pointers to the Terms, and removed the
"cancel at the end of any month" claim from the course-page format list
and the seeded course FAQ. **Check that the monthly-billing model you
actually operate is compatible with the cancellation clause as drafted** —
a rolling monthly subscription and a one-off 14-day statutory cancellation
window are not the same thing, and the Terms currently only describe the
latter.

### C3. "Individuals over 18" vs. children's groups

See A1. Beyond the Terms, consider whether the registration form needs an
explicit parent/guardian confirmation checkbox when the selected group's
audience is `children` or `teens`. The data model already knows the
group's audience, so this is straightforward to add once you decide.

---

## D. Translation

The Russian text is a faithful convenience translation, not a certified
one. Each page carries a notice that the English version prevails in case
of discrepancy. If Russian-speaking customers are your primary market, it
is worth having the Russian reviewed by someone qualified in Israeli
consumer law — the governing-language notice reduces risk but does not
eliminate it.
