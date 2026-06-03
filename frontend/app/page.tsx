export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        hu-knows
      </h1>
      <p className="max-w-md text-center text-lg text-gray-500 dark:text-gray-400">
        Next.js + Tailwind CSS boilerplate. Edit{" "}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm dark:bg-gray-800">
          app/page.tsx
        </code>{" "}
        to get started.
      </p>
      <a
        href="https://nextjs.org/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Read the docs
      </a>
    </main>
  );
}
