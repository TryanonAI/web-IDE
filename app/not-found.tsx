import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen w-screen p-4 text-center">
      <div className="max-w-md w-full bg-card rounded-lg border border-border p-8 shadow-sm flex flex-col items-center justify-center gap-4">
        <Image
          src="/not-found.gif"
          alt="project Not Found"
          width={200}
          height={200}
          priority
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <h2 className="text-3xl font-bold text-foreground">congrats!</h2>
          <p className="text-muted-foreground">bruhhh you hit a 404</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Return Home
          </Link>
          <span className="text-muted-foreground text-sm">or</span>
          <Link
            href="https://x.com/aykansal"
            target="_blank"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            DM
          </Link>
        </div>
      </div>
    </div>
  );
}
