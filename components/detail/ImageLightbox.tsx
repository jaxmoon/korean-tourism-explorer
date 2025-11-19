'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

import { cn } from '@/lib/utils';

type ImageLightboxProps = {
  images: string[];
  isOpen: boolean;
  initialIndex?: number;
  onClose: () => void;
};

export function ImageLightbox({ images, isOpen, onClose, initialIndex = 0 }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(initialIndex);
    setZoom(1);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (event.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, isOpen, onClose]);

  useEffect(() => {
    if (isOpen && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [isOpen]);

  const slides = useMemo(
    () =>
      images.map((src, index) => ({
        src,
        alt: `Lightbox image ${index + 1}`,
      })),
    [images]
  );

  if (!mounted || !isOpen || slides.length === 0) return null;

  const goToIndex = (index: number) => {
    const nextIndex = (index + slides.length) % slides.length;
    setCurrentIndex(nextIndex);
    setZoom(1);
  };

  const zoomIn = () => setZoom((value) => Math.min(value + 0.25, 3));
  const zoomOut = () => setZoom((value) => Math.max(value - 0.25, 1));

  return createPortal(
    <div
      ref={overlayRef}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white"
      data-testid="image-lightbox"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-sm font-semibold">
          Image {currentIndex + 1} of {slides.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Zoom out"
            className="rounded-full bg-white/10 p-2 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            disabled={zoom <= 1}
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Zoom in"
            className="rounded-full bg-white/10 p-2 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              onClose();
            }}
            aria-label="Close gallery"
            className="rounded-full bg-white/10 p-2 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <button
          type="button"
          aria-label="Previous image"
          className="absolute left-6 z-10 hidden rounded-full bg-white/15 p-3 transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:block"
          onClick={() => goToIndex(currentIndex - 1)}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="relative h-full w-full max-w-5xl">
          <Image
            fill
            sizes="100vw"
            src={slides[currentIndex]?.src ?? ''}
            alt={slides[currentIndex]?.alt ?? 'Gallery image'}
            className={cn(
              'object-contain transition-transform duration-200 ease-out',
              zoom !== 1 && 'cursor-grab'
            )}
            style={{ transform: `scale(${zoom})` }}
            priority
          />
        </div>

        <button
          type="button"
          aria-label="Next image"
          className="absolute right-6 z-10 hidden rounded-full bg-white/15 p-3 transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:block"
          onClick={() => goToIndex(currentIndex + 1)}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 py-4">
        {slides.map((slide, index) => (
          <button
            type="button"
            key={slide.src}
            onClick={() => goToIndex(index)}
            className={cn(
              'relative h-16 w-20 overflow-hidden rounded-lg border-2 border-transparent transition',
              index === currentIndex && 'border-white'
            )}
            aria-label={`View image ${index + 1}`}
          >
            <Image
              fill
              sizes="160px"
              src={slide.src}
              alt={slide.alt}
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
