import Link from 'next/link';
import { Crown } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-2xl font-headline font-bold text-primary">
            <Crown className="w-7 h-7 text-primary" />
            ChessCraft
          </Link>
        </div>
      </div>
    </header>
  );
}
