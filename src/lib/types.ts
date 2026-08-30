/**
 * Domain model for the Inverted Forest platform.
 *
 * Localized fields are modelled as per-locale records. The database stores
 * them as translation rows (see supabase/migrations), so adding a language
 * later is a data change, not a schema change.
 */

export type Locale = 'ru' | 'en';

export type LocalizedString = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

export type AgeGroup = 'children' | 'teens' | 'adults';
export type Difficulty = 'intro' | 'intermediate' | 'deep_dive';
export type CourseCategory =
  | 'history'
  | 'philosophy'
  | 'literature'
  | 'anthropology';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type GroupStatus =
  | 'enrolling'
  | 'full'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type EnrollmentStatus =
  | 'pending_payment'
  | 'active'
  | 'past_due'
  | 'completed'
  | 'cancelled'
  | 'refunded';
export type PaymentProvider = 'paypal' | 'allpay' | 'manual';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

/** How the course is paid for: monthly subscription or one sum up front. */
export type EnrollmentPlan = 'monthly' | 'full';

export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'completed'
  | 'error'
  | 'cancelled';

/**
 * Where an enrollment stands with its private Telegram channel. Separate
 * from payment status on purpose: someone can be paid up and not yet in
 * the room, and that gap is the thing an admin most often has to chase.
 */
export type TelegramAccessStatus =
  | 'not_granted'
  | 'invite_created'
  | 'joined'
  | 'removed'
  | 'expired';

export type InviteStatus = 'active' | 'used' | 'expired' | 'revoked';

/** A channel broadcasts; a supergroup lets students talk to each other. */
export type TelegramChatType = 'channel' | 'supergroup';

export interface Teacher {
  id: string;
  slug: string;
  photoUrl: string | null;
  name: LocalizedString;
  /** e.g. “Historian & Philosopher” */
  title: LocalizedString;
  bio: LocalizedString;
  highlights: LocalizedList;
}

export interface CurriculumModule {
  title: LocalizedString;
  topics: LocalizedList;
}

export interface FaqItem {
  question: LocalizedString;
  answer: LocalizedString;
}

export interface Course {
  id: string;
  slug: string;
  teacherId: string;
  category: CourseCategory;
  difficulty: Difficulty;
  ageGroups: AgeGroup[];
  durationMonths: number;
  monthlyPrice: number;
  currency: 'ILS' | 'USD' | 'EUR';
  imageUrl: string | null;
  publicTelegramUrl: string | null;
  status: CourseStatus;
  featured: boolean;
  title: LocalizedString;
  shortDescription: LocalizedString;
  description: LocalizedString;
  outcomes: LocalizedList;
  audience: LocalizedList;
  curriculum: CurriculumModule[];
  faq: FaqItem[];
}

export interface StudyGroup {
  /** Immutable internal id (e.g. "group_101"). Never used for display. */
  id: string;
  courseId: string;
  /** Readable slug for admin/display only — never for internal logic. */
  slug: string;
  audience: AgeGroup;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** Local start time, e.g. "16:00" */
  time: string;
  timezone: string;
  startDate: string; // ISO date
  endDate: string | null;
  capacity: number;
  seatsTaken: number;
  /** External checkout link (PayPal now, Allpay later). */
  paymentUrl: string | null;
  telegramChannelId: string | null;
  telegramChatType: TelegramChatType;
  /** Seats on one invite link. 1 for adults; 2 lets a parent come along. */
  inviteMemberLimit: number;
  /** Zoom / Google Meet room, pinned in the channel and shown in admin. */
  meetingUrl: string | null;
  status: GroupStatus;
}

export function seatsRemaining(group: StudyGroup): number {
  return Math.max(0, group.capacity - group.seatsTaken);
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  locale: Locale;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  groupId: string;
  courseId: string;
  status: EnrollmentStatus;

  /**
   * Who attends, when that is not the person who paid. Null for adult
   * groups, where the student row is the participant; set for children's
   * groups, where the student row is the paying parent.
   */
  participantName: string | null;
  participantBirthYear: number | null;

  plan: EnrollmentPlan;
  /** What we hand the provider and get back in the webhook. */
  orderId: string | null;
  externalSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
  /** Access is owed up to this date; everything downstream derives from it. */
  paidThrough: string | null;
  graceUntil: string | null;
  pendingExpiresAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;

  telegramAccessStatus: TelegramAccessStatus;
  telegramUserId: string | null;
  telegramInvitedAt: string | null;
  telegramJoinedAt: string | null;
  telegramRemovedAt: string | null;

  createdAt: string;
}

export interface Payment {
  id: string;
  enrollmentId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  /**
   * Dedupe key with the provider. For a subscription this carries a period
   * suffix (`<order_id>#2`) because two monthly charges can otherwise
   * arrive as byte-identical payloads.
   */
  externalId: string | null;
  /** 1 = first month, 2 = second … null for one-off payments. */
  periodIndex: number | null;
  receiptUrl: string | null;
  createdAt: string;
}

export interface TelegramInvite {
  id: string;
  enrollmentId: string;
  groupId: string;
  chatId: string;
  inviteLink: string;
  memberLimit: number;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

/**
 * Append-only record of anything worth reacting to. Written before the
 * side effects, so the fan-out to Make.com (and whatever replaces it) is a
 * subscriber rather than the orchestrator.
 */
export interface DomainEvent {
  id: string;
  type: string;
  enrollmentId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  deliveredAt: string | null;
  deliveryError: string | null;
}

export interface AutomationLog {
  id: string;
  source: string; // 'make' | 'telegram-bot' | 'site'
  event: string;
  status: 'ok' | 'error';
  detail: string | null;
  createdAt: string;
}

/* ── Composite/read models ─────────────────────────────────────────── */

export interface RegistrationInput {
  groupId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  locale: Locale;
  /** Set only when the participant is not the payer (children's groups). */
  participantName?: string;
  participantBirthYear?: number;
  plan: EnrollmentPlan;
}

export interface RegistrationResult {
  enrollmentId: string;
  paymentUrl: string | null;
}

export interface StudentRow extends Student {
  courseTitle: LocalizedString;
  groupId: string;
  enrollmentStatus: EnrollmentStatus;
}

/**
 * One row of the admin enrollments table.
 *
 * Flattened deliberately: the admin screen needs the payer, the
 * participant, the money and the Telegram state side by side, and joining
 * four tables in the component is how that screen becomes slow and
 * inconsistent between providers.
 */
export interface EnrollmentAdminRow {
  id: string;
  studentName: string;
  email: string;
  phone: string | null;
  /** Set when the payer is not the person attending. */
  participantName: string | null;
  courseTitle: LocalizedString;
  courseId: string;
  groupId: string;
  status: EnrollmentStatus;
  plan: EnrollmentPlan;
  paidThrough: string | null;
  graceUntil: string | null;
  telegramAccessStatus: TelegramAccessStatus;
  orderId: string | null;
  createdAt: string;
}

/** A verified payment that matched no enrollment, awaiting a human. */
export interface OrphanPaymentRow {
  id: string;
  orderId: string | null;
  amount: number | null;
  currency: string | null;
  clientEmail: string | null;
  createdAt: string;
}

export interface PaymentRow extends Payment {
  studentName: string;
  courseTitle: LocalizedString;
}

export interface DashboardStats {
  activeStudents: number;
  monthlyRevenue: number;
  revenueCurrency: string;
  upcomingCohorts: number;
  failedPayments: number;
  recentRegistrations: StudentRow[];
  logs: AutomationLog[];
}

export interface TelegramGroupStatus {
  group: StudyGroup;
  courseTitle: LocalizedString;
  botIsAdmin: boolean;
  membersCount: number | null;
  lastInviteAt: string | null;
}
