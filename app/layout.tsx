export const metadata = {
  title: "Ghibli Animator",
  description: "Create Studio Ghibli-style animations from prompts or images",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
