'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Announcement } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

export function AnnouncementBar() {
  const firestore = useFirestore();
  const [isVisible, setIsVisible] = useState(false);

  const announcementQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'announcements'),
      where('isActive', '==', true),
      limit(1)
    );
  }, [firestore]);

  const { data: announcements, isLoading } = useCollection<Announcement>(announcementQuery);

  const activeAnnouncement = announcements?.[0];

  useEffect(() => {
    // Check if there is an announcement and if it has been dismissed in this session
    if (activeAnnouncement) {
      const dismissedId = sessionStorage.getItem('dismissedAnnouncementId');
      if (dismissedId !== activeAnnouncement.id) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [activeAnnouncement]);

  const handleDismiss = () => {
    if (activeAnnouncement) {
      sessionStorage.setItem('dismissedAnnouncementId', activeAnnouncement.id);
    }
    setIsVisible(false);
  };

  if (isLoading || !isVisible || !activeAnnouncement) {
    return null;
  }

  const BarContent = () => (
    <>
      <Megaphone className="h-5 w-5 text-primary-foreground" />
      <p className="flex-1 text-sm font-medium">{activeAnnouncement.message}</p>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleDismiss}>
        <X className="h-4 w-4" />
        <span className="sr-only">Dispensar</span>
      </Button>
    </>
  );

  return (
    <div className="relative bg-primary px-4 py-2 text-primary-foreground">
      <div className="container mx-auto flex items-center justify-center gap-3">
        {activeAnnouncement.link ? (
          <Link href={activeAnnouncement.link} className="flex flex-1 items-center gap-3" target="_blank" rel="noopener noreferrer">
            <BarContent />
          </Link>
        ) : (
          <BarContent />
        )}
      </div>
    </div>
  );
}
