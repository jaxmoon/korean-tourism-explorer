import Link from 'next/link';

export default function AttractionNotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-foreground">Location not found</h1>
      <p className="mt-3 text-base text-muted-foreground">
        We couldn&apos;t find the attraction you were looking for. It may have been removed or is temporarily unavailable.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="text-primary underline underline-offset-4">
          Back to home
        </Link>
        <Link href="/search" className="text-primary underline underline-offset-4">
          Search other locations
        </Link>
      </div>
    </section>
  );
}
