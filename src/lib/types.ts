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
  | 'cancelled';
export type PaymentProvider = 'paypal' | 'allpay' | 'manual';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

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
  telegramInvitedAt: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  enrollmentId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  externalId: string | null;
  createdAt: string;
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
