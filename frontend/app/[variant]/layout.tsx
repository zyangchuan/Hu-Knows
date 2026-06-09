import AppGate from "@/components/AppGate";

// The /app (full-backend) flow is auth-gated and carries the user badge; /demo is
// fully open. Server layout reads the route param so the auth/session client code
// doesn't even load on the demo pages.
export default async function VariantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  if (variant === "app") return <AppGate>{children}</AppGate>;
  return <>{children}</>;
}
