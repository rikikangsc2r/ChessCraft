"use client";

import { useEffect, useState } from 'react';
import { RoomSetup } from "@/components/RoomSetup";
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-background">
         <div className="w-full max-w-md space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return <RoomSetup />;
}
