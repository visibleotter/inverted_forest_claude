import type {
  Course,
  DashboardStats,
  EnrollmentAdminRow,
  OrphanPaymentRow,
  PaymentRow,
  RegistrationInput,
  RegistrationResult,
  Student,
  StudentRow,
  StudyGroup,
  Teacher,
  TelegramGroupStatus
} from '../types';
import type { DataProvider } from './provider';
import {
  courses,
  demoEnrollments,
  demoLogs,
  demoPayments,
  demoStudents,
  studyGroups,
  teachers
} from './seed';

/**
 * Zero-config provider backed by seed content. Lets the whole site —
 * including the admin panel — run and be reviewed without a database.
 */
export class SeedProvider implements DataProvider {
  async getCourses(): Promise<Course[]> {
    return courses.filter((c) => c.status === 'published');
  }

  async getFeaturedCourses(): Promise<Course[]> {
    return courses.filter((c) => c.status === 'published' && c.featured);
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    // Public lookup: an unpublished course is not reachable by URL either.
    return (
      courses.find((c) => c.slug === slug && c.status === 'published') ?? null
    );
  }

  async getCourseById(id: string): Promise<Course | null> {
    return courses.find((c) => c.id === id) ?? null;
  }

  async getTeachers(): Promise<Teacher[]> {
    return teachers;
  }

  async getTeacherById(id: string): Promise<Teacher | null> {
    return teachers.find((t) => t.id === id) ?? null;
  }

  async getGroupsForCourse(courseId: string): Promise<StudyGroup[]> {
    return studyGroups.filter((g) => g.courseId === courseId);
  }

  async getGroupById(id: string): Promise<StudyGroup | null> {
    return studyGroups.find((g) => g.id === id) ?? null;
  }

  async createRegistration(
    input: RegistrationInput
  ): Promise<RegistrationResult> {
    const group = await this.getGroupById(input.groupId);
    if (!group) throw new Error(`Unknown study group: ${input.groupId}`);
    // Demo mode: nothing is persisted; the flow still completes so the
    // whole journey can be exercised end-to-end.
    return {
      enrollmentId: `demo_${Date.now()}`,
      paymentUrl: group.paymentUrl
    };
  }

  async subscribeToNewsletter(): Promise<void> {
    // Demo mode: no-op.
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const students = await this.getStudents();
    return {
      activeStudents: demoEnrollments.filter((e) => e.status === 'active')
        .length,
      monthlyRevenue: demoPayments
        .filter((p) => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0),
      revenueCurrency: 'ILS',
      upcomingCohorts: studyGroups.filter((g) => g.status === 'enrolling')
        .length,
      failedPayments: demoPayments.filter((p) => p.status === 'failed').length,
      recentRegistrations: students.slice(0, 5),
      logs: [...demoLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    };
  }

  async getStudents(): Promise<StudentRow[]> {
    return demoEnrollments
      .map((enr) => {
        const student = demoStudents.find((s) => s.id === enr.studentId);
        const course = courses.find((c) => c.id === enr.courseId);
        if (!student || !course) return null;
        return {
          ...student,
          courseTitle: course.title,
          groupId: enr.groupId,
          enrollmentStatus: enr.status
        } satisfies StudentRow;
      })
      .filter((row): row is StudentRow => row !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getEnrollments(): Promise<EnrollmentAdminRow[]> {
    return demoEnrollments
      .map((enr) => {
        const student = demoStudents.find((s) => s.id === enr.studentId);
        const course = courses.find((c) => c.id === enr.courseId);
        if (!student || !course) return null;
        return {
          id: enr.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phone: student.phone,
          participantName: enr.participantName,
          courseTitle: course.title,
          courseId: course.id,
          groupId: enr.groupId,
          status: enr.status,
          plan: enr.plan,
          paidThrough: enr.paidThrough,
          graceUntil: enr.graceUntil,
          telegramAccessStatus: enr.telegramAccessStatus,
          orderId: enr.orderId,
          createdAt: enr.createdAt
        } satisfies EnrollmentAdminRow;
      })
      .filter((row): row is EnrollmentAdminRow => row !== null);
  }

  async getStudentById(id: string): Promise<Student | null> {
    return demoStudents.find((student) => student.id === id) ?? null;
  }

  async getOrphanPayments(): Promise<OrphanPaymentRow[]> {
    // Demo mode has no webhook, so nothing can arrive unmatched.
    return [];
  }

  async getPayments(): Promise<PaymentRow[]> {
    return demoPayments
      .map((payment) => {
        const enr = demoEnrollments.find((e) => e.id === payment.enrollmentId);
        const student = enr
          ? demoStudents.find((s) => s.id === enr.studentId)
          : undefined;
        const course = enr
          ? courses.find((c) => c.id === enr.courseId)
          : undefined;
        return {
          ...payment,
          studentName: student
            ? `${student.firstName} ${student.lastName}`
            : '—',
          courseTitle: course?.title ?? { ru: '—', en: '—' }
        } satisfies PaymentRow;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAllGroups(): Promise<StudyGroup[]> {
    return studyGroups;
  }

  async getTelegramStatuses(): Promise<TelegramGroupStatus[]> {
    return studyGroups.map((group) => {
      const course = courses.find((c) => c.id === group.courseId);
      return {
        group,
        courseTitle: course?.title ?? { ru: '—', en: '—' },
        botIsAdmin: Boolean(group.telegramChannelId),
        membersCount: group.telegramChannelId ? group.seatsTaken : null,
        lastInviteAt: group.seatsTaken > 0 ? '2026-07-05T20:30:00Z' : null
      };
    });
  }
}
