import { siteConfig } from '../config';
import { emit } from '../events';
import {
  getCheckoutProvider,
  successUrl,
  vatRate,
  webhookUrl
} from '../payments';
import { getNumericSettings } from '../settings';
import type {
  Course,
  DashboardStats,
  EnrollmentAdminRow,
  OrphanPaymentRow,
  Locale,
  LocalizedList,
  LocalizedString,
  PaymentRow,
  RegistrationInput,
  RegistrationResult,
  StudentRow,
  StudyGroup,
  Teacher,
  TelegramGroupStatus
} from '../types';
import type { DataProvider } from './provider';
import { createSupabaseAdminClient } from '../supabase/server';

/* Row shapes as returned by PostgREST (snake_case). */
type TranslationRow = { locale: Locale } & Record<string, unknown>;

function collectString(
  rows: TranslationRow[],
  field: string
): LocalizedString {
  const out = { ru: '', en: '' } as LocalizedString;
  for (const row of rows) out[row.locale] = (row[field] as string) ?? '';
  return out;
}

function collectList(rows: TranslationRow[], field: string): LocalizedList {
  const out = { ru: [], en: [] } as LocalizedList;
  for (const row of rows) out[row.locale] = (row[field] as string[]) ?? [];
  return out;
}

type LocalizedBlock = { title: string; items: string[] };

function collectBlocks(rows: TranslationRow[], field: string) {
  // Per-locale arrays of {title, items} → merged bilingual structures.
  const byLocale: Partial<Record<Locale, LocalizedBlock[]>> = {};
  for (const row of rows) {
    byLocale[row.locale] = ((row[field] as LocalizedBlock[]) ?? []).map(
      (b) => ({ title: b.title ?? '', items: b.items ?? [] })
    );
  }
  const length = Math.max(byLocale.ru?.length ?? 0, byLocale.en?.length ?? 0);
  return Array.from({ length }, (_, i) => ({
    title: {
      ru: byLocale.ru?.[i]?.title ?? '',
      en: byLocale.en?.[i]?.title ?? ''
    },
    topics: {
      ru: byLocale.ru?.[i]?.items ?? [],
      en: byLocale.en?.[i]?.items ?? []
    }
  }));
}

function collectFaq(rows: TranslationRow[]) {
  const byLocale: Partial<
    Record<Locale, { question: string; answer: string }[]>
  > = {};
  for (const row of rows) {
    byLocale[row.locale] =
      (row.faq as { question: string; answer: string }[]) ?? [];
  }
  const length = Math.max(byLocale.ru?.length ?? 0, byLocale.en?.length ?? 0);
  return Array.from({ length }, (_, i) => ({
    question: {
      ru: byLocale.ru?.[i]?.question ?? '',
      en: byLocale.en?.[i]?.question ?? ''
    },
    answer: {
      ru: byLocale.ru?.[i]?.answer ?? '',
      en: byLocale.en?.[i]?.answer ?? ''
    }
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCourse(row: any): Course {
  const tr: TranslationRow[] = row.course_translations ?? [];
  return {
    id: row.id,
    slug: row.slug,
    teacherId: row.teacher_id,
    category: row.category,
    difficulty: row.difficulty,
    ageGroups: row.age_groups ?? [],
    durationMonths: row.duration_months,
    monthlyPrice: Number(row.monthly_price),
    currency: row.currency,
    imageUrl: row.image_url,
    publicTelegramUrl: row.public_telegram_url,
    status: row.status,
    featured: row.featured,
    title: collectString(tr, 'title'),
    shortDescription: collectString(tr, 'short_description'),
    description: collectString(tr, 'description'),
    outcomes: collectList(tr, 'outcomes'),
    audience: collectList(tr, 'audience'),
    curriculum: collectBlocks(tr, 'curriculum'),
    faq: collectFaq(tr)
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeacher(row: any): Teacher {
  const tr: TranslationRow[] = row.teacher_translations ?? [];
  return {
    id: row.id,
    slug: row.slug,
    photoUrl: row.photo_url,
    name: collectString(tr, 'name'),
    title: collectString(tr, 'title'),
    bio: collectString(tr, 'bio'),
    highlights: collectList(tr, 'highlights')
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGroup(row: any): StudyGroup {
  return {
    id: row.id,
    courseId: row.course_id,
    slug: row.slug,
    audience: row.audience,
    weekday: row.weekday,
    time: row.start_time,
    timezone: row.timezone,
    startDate: row.start_date,
    startDateConfirmed: row.start_date_confirmed ?? true,
    endDate: row.end_date,
    capacity: row.capacity,
    seatsTaken: row.seats_taken,
    // Filled in by `withHolds`; a group read without it simply shows no
    // holds, which is the old behaviour rather than a wrong number.
    seatsHeld: 0,
    paymentUrl: row.payment_url,
    telegramChannelId: row.telegram_channel_id,
    telegramChatType: row.telegram_chat_type ?? 'channel',
    inviteMemberLimit: row.invite_member_limit ?? 1,
    meetingUrl: row.meeting_url ?? null,
    status: row.status
  };
}

const COURSE_SELECT = '*, course_translations(*)';

export class SupabaseProvider implements DataProvider {
  private get db() {
    return createSupabaseAdminClient();
  }

  async getCourses(): Promise<Course[]> {
    const { data, error } = await this.db
      .from('courses')
      .select(COURSE_SELECT)
      .eq('status', 'published')
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map(mapCourse);
  }

  async getFeaturedCourses(): Promise<Course[]> {
    const { data, error } = await this.db
      .from('courses')
      .select(COURSE_SELECT)
      .eq('status', 'published')
      .eq('featured', true);
    if (error) throw error;
    return (data ?? []).map(mapCourse);
  }

  /**
   * Public lookup, so unpublished courses are invisible here.
   *
   * Filtering the catalogue alone was not enough: a draft vanished from
   * the list and stayed reachable at its own address, which is not hidden,
   * only harder to find. `getCourseById` below stays unfiltered — the
   * admin has to be able to open what it is editing.
   */
  async getCourseBySlug(slug: string): Promise<Course | null> {
    const { data, error } = await this.db
      .from('courses')
      .select(COURSE_SELECT)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    return data ? mapCourse(data) : null;
  }

  async getCourseById(id: string): Promise<Course | null> {
    const { data, error } = await this.db
      .from('courses')
      .select(COURSE_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapCourse(data) : null;
  }

  async getTeachers(): Promise<Teacher[]> {
    const { data, error } = await this.db
      .from('teachers')
      .select('*, teacher_translations(*)');
    if (error) throw error;
    return (data ?? []).map(mapTeacher);
  }

  async getTeacherById(id: string): Promise<Teacher | null> {
    const { data, error } = await this.db
      .from('teachers')
      .select('*, teacher_translations(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapTeacher(data) : null;
  }

  /**
   * Count the places held by unpaid, unexpired registrations.
   *
   * A seat used to be consumed only by a completed payment, which left a
   * window wide enough to drive through: with seven places, seven people
   * could each be sitting on the Allpay page at once and all succeed.
   * Holding the place for the length of `pending_ttl_minutes` closes it,
   * and the hourly sweep releases anything abandoned.
   */
  private async withHolds(groups: StudyGroup[]): Promise<StudyGroup[]> {
    if (groups.length === 0) return groups;

    const { data, error } = await this.db
      .from('enrollments')
      .select('group_id')
      .eq('status', 'pending_payment')
      .in('group_id', groups.map((g) => g.id))
      .gt('pending_expires_at', new Date().toISOString());

    // A failed count must not make the schedule unavailable; showing no
    // holds is the previous behaviour, not a wrong answer.
    if (error) return groups;

    const held = new Map<string, number>();
    for (const row of data ?? []) {
      const id = row.group_id as string;
      held.set(id, (held.get(id) ?? 0) + 1);
    }

    return groups.map((group) => ({
      ...group,
      seatsHeld: held.get(group.id) ?? 0
    }));
  }

  async getGroupsForCourse(courseId: string): Promise<StudyGroup[]> {
    const { data, error } = await this.db
      .from('study_groups')
      .select('*')
      .eq('course_id', courseId)
      .order('start_date');
    if (error) throw error;
    return this.withHolds((data ?? []).map(mapGroup));
  }

  async getGroupById(id: string): Promise<StudyGroup | null> {
    const { data, error } = await this.db
      .from('study_groups')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [group] = await this.withHolds([mapGroup(data)]);
    return group ?? null;
  }

  async createRegistration(
    input: RegistrationInput
  ): Promise<RegistrationResult> {
    const db = this.db;
    const group = await this.getGroupById(input.groupId);
    if (!group) throw new Error(`Unknown study group: ${input.groupId}`);

    // Upsert the student by email.
    const { data: student, error: studentError } = await db
      .from('students')
      .upsert(
        {
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email.toLowerCase(),
          phone: input.phone ?? null,
          locale: input.locale
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single();
    if (studentError) throw studentError;

    const participantName = input.participantName?.trim() || null;
    const settings = await getNumericSettings();
    const pendingExpiresAt = new Date(
      Date.now() + settings.pending_ttl_minutes * 60_000
    ).toISOString();

    // Someone who registered, thought better of the card and came back an
    // hour later is the common case, not an edge one. Reuse their unpaid
    // enrollment rather than colliding with the uniqueness rule — the old
    // code hit a 23505 here and showed a bare "something went wrong".
    const { data: open } = await db
      .from('enrollments')
      .select('id')
      .eq('student_id', student.id)
      .eq('group_id', group.id)
      .eq('status', 'pending_payment')
      .is('participant_name', participantName)
      .maybeSingle();

    let enrollmentId: string;

    if (open) {
      enrollmentId = open.id as string;
      const { error } = await db
        .from('enrollments')
        .update({
          plan: input.plan,
          participant_birth_year: input.participantBirthYear ?? null,
          pending_expires_at: pendingExpiresAt
        })
        .eq('id', enrollmentId);
      if (error) throw error;
    } else {
      const { data: created, error: enrollmentError } = await db
        .from('enrollments')
        .insert({
          student_id: student.id,
          group_id: group.id,
          course_id: group.courseId,
          status: 'pending_payment',
          plan: input.plan,
          participant_name: participantName,
          participant_birth_year: input.participantBirthYear ?? null,
          pending_expires_at: pendingExpiresAt
        })
        .select('id')
        .single();
      if (enrollmentError) throw enrollmentError;
      enrollmentId = created.id as string;
    }

    // The order id is the enrollment id. It travels to the provider and
    // comes back in the webhook, which is what removes any need to match a
    // payment by the payer's email address.
    await db
      .from('enrollments')
      .update({ order_id: enrollmentId })
      .eq('id', enrollmentId)
      .is('order_id', null);

    const paymentUrl = await this.buildCheckoutUrl(
      enrollmentId,
      group,
      input
    );

    // Log identifiers, not contact details.
    await db.from('automation_logs').insert({
      source: 'site',
      event: 'registration.created',
      status: 'ok',
      detail: `${group.id} · enrollment ${enrollmentId} · ${input.plan}`
    });

    await emit('enrollment.created', enrollmentId, {
      group_id: group.id,
      course_id: group.courseId,
      plan: input.plan
    });

    return { enrollmentId, paymentUrl };
  }

  /**
   * A checkout URL for this enrollment.
   *
   * With Allpay configured, a payment is created per enrollment so the
   * order id — and therefore the identity of the payer — is ours. Without
   * it, we fall back to the group's hand-made link from the Allpay
   * dashboard, which still works but cannot carry an order id, so those
   * payments arrive as orphans for an admin to match.
   */
  private async buildCheckoutUrl(
    enrollmentId: string,
    group: StudyGroup,
    input: RegistrationInput
  ): Promise<string | null> {
    const provider = getCheckoutProvider();
    if (!provider) return group.paymentUrl;

    const course = await this.getCourseById(group.courseId);
    if (!course) return group.paymentUrl;

    const months = course.durationMonths;
    const isFull = input.plan === 'full';
    const title = course.title[input.locale] ?? course.title.ru;

    try {
      const session = await provider.createCheckout({
        orderId: enrollmentId,
        groupId: group.id,
        currency: course.currency,
        items: [
          {
            name: isFull ? `${title} · ${months} mo` : title,
            price: isFull ? course.monthlyPrice * months : course.monthlyPrice,
            qty: 1,
            vat: vatRate()
          }
        ],
        client: {
          name: `${input.firstName} ${input.lastName}`,
          email: input.email,
          phone: input.phone
        },
        locale: input.locale,
        plan: input.plan,
        installments: months,
        webhookUrl: webhookUrl(),
        successUrl: successUrl(input.locale, enrollmentId),
        backlinkUrl: `${siteConfig.url}/${input.locale}/courses/${course.slug}`
      });
      return session.paymentUrl;
    } catch (error) {
      // A provider outage must not swallow the registration we just took.
      console.error(`[checkout] allpay failed for ${enrollmentId}`, error);
      return group.paymentUrl;
    }
  }

  async subscribeToNewsletter(email: string, locale: string): Promise<void> {
    const { error } = await this.db
      .from('newsletter_subscribers')
      .upsert({ email: email.toLowerCase(), locale }, { onConflict: 'email' });
    if (error) throw error;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const db = this.db;
    const [active, failed, upcoming, revenue, students, logs] =
      await Promise.all([
        db
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        db
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'failed'),
        db
          .from('study_groups')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'enrolling'),
        db
          .from('payments')
          .select('amount')
          .eq('status', 'succeeded')
          .gte(
            'created_at',
            new Date(new Date().setDate(1)).toISOString().slice(0, 10)
          ),
        this.getStudents(),
        db
          .from('automation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

    return {
      activeStudents: active.count ?? 0,
      monthlyRevenue: (revenue.data ?? []).reduce(
        (sum, p) => sum + Number(p.amount),
        0
      ),
      revenueCurrency: 'ILS',
      upcomingCohorts: upcoming.count ?? 0,
      failedPayments: failed.count ?? 0,
      recentRegistrations: students.slice(0, 5),
      logs: (logs.data ?? []).map((row) => ({
        id: row.id,
        source: row.source,
        event: row.event,
        status: row.status,
        detail: row.detail,
        createdAt: row.created_at
      }))
    };
  }

  async getStudents(): Promise<StudentRow[]> {
    const { data, error } = await this.db
      .from('enrollments')
      .select(
        '*, students(*), courses(id, course_translations(locale, title))'
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((row: any) => row.students)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => ({
        id: row.students.id,
        firstName: row.students.first_name,
        lastName: row.students.last_name,
        email: row.students.email,
        phone: row.students.phone,
        locale: row.students.locale,
        createdAt: row.created_at,
        courseTitle: collectString(
          row.courses?.course_translations ?? [],
          'title'
        ),
        groupId: row.group_id,
        enrollmentStatus: row.status
      }));
  }

  async getEnrollments(): Promise<EnrollmentAdminRow[]> {
    const { data, error } = await this.db
      .from('enrollments')
      .select(
        'id, status, plan, group_id, course_id, participant_name, paid_through, grace_until, telegram_access_status, order_id, created_at, students(first_name, last_name, email, phone), courses(course_translations(locale, title))'
      )
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id: row.id,
      studentName: row.students
        ? `${row.students.first_name} ${row.students.last_name}`
        : '—',
      email: row.students?.email ?? '—',
      phone: row.students?.phone ?? null,
      participantName: row.participant_name,
      courseTitle: collectString(
        row.courses?.course_translations ?? [],
        'title'
      ),
      courseId: row.course_id,
      groupId: row.group_id,
      status: row.status,
      plan: row.plan,
      paidThrough: row.paid_through,
      graceUntil: row.grace_until,
      telegramAccessStatus: row.telegram_access_status,
      orderId: row.order_id,
      createdAt: row.created_at
    }));
  }

  async getOrphanPayments(): Promise<OrphanPaymentRow[]> {
    const { data, error } = await this.db
      .from('orphan_payments')
      .select('id, order_id, amount, currency, payload, created_at')
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id: row.id,
      orderId: row.order_id,
      amount: row.amount === null ? null : Number(row.amount),
      currency: row.currency,
      // The payer's address is the only usable clue for matching this by
      // hand, and it is already in the stored payload.
      clientEmail:
        typeof row.payload?.client_email === 'string'
          ? row.payload.client_email
          : null,
      createdAt: row.created_at
    }));
  }

  async getPayments(): Promise<PaymentRow[]> {
    const { data, error } = await this.db
      .from('payments')
      .select(
        '*, enrollments(group_id, students(first_name, last_name), courses(course_translations(locale, title)))'
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id: row.id,
      enrollmentId: row.enrollment_id,
      provider: row.provider,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      externalId: row.external_id,
      periodIndex: row.period_index ?? null,
      receiptUrl: row.receipt_url ?? null,
      createdAt: row.created_at,
      studentName: row.enrollments?.students
        ? `${row.enrollments.students.first_name} ${row.enrollments.students.last_name}`
        : '—',
      courseTitle: collectString(
        row.enrollments?.courses?.course_translations ?? [],
        'title'
      )
    }));
  }

  async getAllGroups(): Promise<StudyGroup[]> {
    const { data, error } = await this.db
      .from('study_groups')
      .select('*')
      .order('start_date');
    if (error) throw error;
    return this.withHolds((data ?? []).map(mapGroup));
  }

  async getTelegramStatuses(): Promise<TelegramGroupStatus[]> {
    const { data, error } = await this.db
      .from('study_groups')
      .select(
        '*, courses(course_translations(locale, title)), telegram_channels(*)'
      )
      .order('start_date');
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      group: mapGroup(row),
      courseTitle: collectString(
        row.courses?.course_translations ?? [],
        'title'
      ),
      botIsAdmin: row.telegram_channels?.[0]?.bot_is_admin ?? false,
      membersCount: row.telegram_channels?.[0]?.members_count ?? null,
      lastInviteAt: row.telegram_channels?.[0]?.last_invite_at ?? null
    }));
  }
}
