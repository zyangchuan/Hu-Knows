import AppHeader from "@/components/AppHeader";

// Mount the persistent user badge only on the /app (full-backend) flow, never on
// /demo. Server layout reads the route param so the auth/session client code
// doesn't even load on the demo pages.
export default async function VariantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  return (
    <>
      {variant === "app" && <AppHeader />}
      {children}
    </>
  );
}
