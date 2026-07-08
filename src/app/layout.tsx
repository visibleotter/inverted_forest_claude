// Root passthrough — the real document lives in [locale]/layout.tsx
// so that <html lang> matches the active locale.
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
