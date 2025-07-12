import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="max-w-md w-full bg-card rounded-lg border border-border p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Not Found</h2>
        <p className="text-muted-foreground mb-6">
          Could not find the requested resource
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
