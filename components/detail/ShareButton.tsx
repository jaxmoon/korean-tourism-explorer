'use client';

import { useCallback, useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import type { Location } from '@/lib/models/location';
import { cn } from '@/lib/utils';

type ShareButtonProps = {
  location: Location & { overview?: string };
  className?: string;
};

export function ShareButton({ location, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (url: string) => {
    if (!navigator.clipboard) {
      toast.error('Clipboard not available');
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData: ShareData = {
      title: location.title,
      text: location.overview || 'Check out this location on Tourism Explorer.',
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully');
        return;
      }

      await copyToClipboard(url);
    } catch (error) {
      console.error('Share failed', error);
      toast.error('Unable to share link');
    }
  }, [location.overview, location.title, copyToClipboard]);

  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn('gap-2 rounded-full px-4 py-2 text-sm font-semibold', className)}
      onClick={handleShare}
      aria-label="Share location"
    >
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      {copied ? 'Copied' : 'Share'}
    </Button>
  );
}
