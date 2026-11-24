import { Footer } from '@/components/layout/footer';
import { FloatingContact } from '@/components/layout/floating-contact';
import { Header } from '@/components/layout/header';

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingContact />
    </div>
  );
}
