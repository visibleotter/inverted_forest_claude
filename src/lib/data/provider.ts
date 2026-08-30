import type {
  Course,
  DashboardStats,
  EnrollmentAdminRow,
  OrphanPaymentRow,
  PaymentRow,
  RegistrationInput,
  RegistrationResult,
  StudentRow,
  StudyGroup,
  Teacher,
  TelegramGroupStatus
} from '../types';

/**
 * Data access contract. Two implementations exist:
 *
 *  - SeedProvider     — in-memory seed content; zero-config demo mode
 *  - SupabaseProvider — production database; used automatically when
 *                       Supabase env vars are configured
 *
 * All UI (public site + admin) talks only to this interface, so swapping
 * the backing store — or later replacing Make.com/Google Sheets with
 * native features — never touches the presentation layer.
 */
export interface DataProvider {
  /* Public site */
  getCourses(): Promise<Course[]>;
  getFeaturedCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  getCourseById(id: string): Promise<Course | null>;
  getTeachers(): Promise<Teacher[]>;
  getTeacherById(id: string): Promise<Teacher | null>;
  getGroupsForCourse(courseId: string): Promise<StudyGroup[]>;
  getGroupById(id: string): Promise<StudyGroup | null>;
  createRegistration(input: RegistrationInput): Promise<RegistrationResult>;
  subscribeToNewsletter(email: string, locale: string): Promise<void>;

  /* Admin */
  getDashboardStats(): Promise<DashboardStats>;
  getStudents(): Promise<StudentRow[]>;
  getEnrollments(): Promise<EnrollmentAdminRow[]>;
  getOrphanPayments(): Promise<OrphanPaymentRow[]>;
  getPayments(): Promise<PaymentRow[]>;
  getAllGroups(): Promise<StudyGroup[]>;
  getTelegramStatuses(): Promise<TelegramGroupStatus[]>;
}
