import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { Location } from '@/lib/models/location';
import { MobileBottomSheet } from '../MobileBottomSheet';

type SheetState = 'collapsed' | 'half' | 'full';

const HEIGHTS: Record<SheetState, string> = {
  collapsed: '20vh',
  half: '50vh',
  full: '80vh',
};

const buildLocation = (overrides: Partial<Location> = {}): Location => ({
  contentId: overrides.contentId ?? `location-${Math.random().toString(36).slice(2, 8)}`,
  contentTypeId: overrides.contentTypeId ?? 12,
  title: overrides.title ?? 'Sample Location',
  addr1: overrides.addr1 ?? '123 Seoul Street',
  addr2: overrides.addr2,
  address: overrides.address,
  zipcode: overrides.zipcode,
  mapX: overrides.mapX ?? 126.978,
  mapY: overrides.mapY ?? 37.5665,
  thumbnailUrl: overrides.thumbnailUrl,
  firstImage: overrides.firstImage,
  firstImage2: overrides.firstImage2,
  areaCode: overrides.areaCode,
  sigunguCode: overrides.sigunguCode,
  cat1: overrides.cat1,
  cat2: overrides.cat2,
  cat3: overrides.cat3,
  tel: overrides.tel,
  homepage: overrides.homepage,
  overview: overrides.overview,
  createdtime: overrides.createdtime,
  modifiedtime: overrides.modifiedtime,
  booktour: overrides.booktour,
  mlevel: overrides.mlevel,
});

const createLocations = (count = 4) =>
  Array.from({ length: count }, (_, index) =>
    buildLocation({
      title: `Location ${index + 1}`,
      contentId: `location-${index + 1}`,
    }),
  );

const renderSheet = (props: Partial<React.ComponentProps<typeof MobileBottomSheet>> = {}) => {
  const locations = props.locations ?? createLocations();
  return render(<MobileBottomSheet {...props} locations={locations} />);
};

const getSheetPanel = () => screen.getByTestId('mobile-bottom-sheet');
const getHandleButton = () => screen.getByTestId('mobile-bottom-sheet-handle');

const swipe = (options: { startY?: number; deltaY: number; pointerType?: string }) => {
  const { startY = 600, deltaY, pointerType = 'touch' } = options;
  const handle = getHandleButton();
  const pointerId = Date.now();

  fireEvent.pointerDown(handle, { pointerId, clientY: startY, pointerType });
  fireEvent.pointerMove(handle, { pointerId, clientY: startY + deltaY, pointerType });
  fireEvent.pointerUp(handle, { pointerId, clientY: startY + deltaY, pointerType });
};

describe('MobileBottomSheet - 3 state system', () => {
  it('renders collapsed height (20vh) by default', () => {
    renderSheet();
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.collapsed });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'collapsed');
  });

  it('respects defaultState prop', () => {
    renderSheet({ defaultState: 'half' });
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.half });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'half');
  });

  it('supports controlled state via state prop', () => {
    const locations = createLocations();
    const onStateChange = vi.fn();
    const { rerender } = render(
      <MobileBottomSheet locations={locations} state="half" onStateChange={onStateChange} />,
    );

    const expandButton = screen.getByRole('button', { name: /expand results/i });
    fireEvent.click(expandButton);
    expect(onStateChange).toHaveBeenCalledWith('full');
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.half });

    rerender(
      <MobileBottomSheet locations={locations} state="full" onStateChange={onStateChange} />,
    );
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.full });
  });

  it('cycles heights when expand button is pressed repeatedly', () => {
    renderSheet();
    const expandButton = screen.getByRole('button', { name: /expand results/i });

    fireEvent.click(expandButton);
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.half });

    fireEvent.click(expandButton);
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.full });
  });
});

describe('MobileBottomSheet - swipe gesture handling', () => {
  beforeEach(() => {
    renderSheet();
  });

  it('swipe up transitions collapsed -> half -> full', () => {
    swipe({ deltaY: -120 });
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.half });

    swipe({ deltaY: -200 });
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.full });
  });

  it('swipe down transitions full -> half -> collapsed', () => {
    swipe({ deltaY: -200 });
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.full });

    swipe({ deltaY: 200 });
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.half });

    swipe({ deltaY: 200 });
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.collapsed });
  });

  it('requires at least 30px movement to change state', () => {
    swipe({ deltaY: -15 });
    expect(getSheetPanel()).toHaveStyle({ height: HEIGHTS.collapsed });
  });

  it('captures pointer during drag interactions', () => {
    const handle = getHandleButton();
    const pointerId = 42;
    const setPointerCapture = vi.fn();
    const releasePointerCapture = vi.fn();
    Object.defineProperty(handle, 'setPointerCapture', {
      value: setPointerCapture,
      configurable: true,
    });
    Object.defineProperty(handle, 'releasePointerCapture', {
      value: releasePointerCapture,
      configurable: true,
    });

    fireEvent.pointerDown(handle, { pointerId, clientY: 600 });
    fireEvent.pointerUp(handle, { pointerId, clientY: 500 });

    expect(setPointerCapture).toHaveBeenCalledWith(pointerId);
    expect(releasePointerCapture).toHaveBeenCalledWith(pointerId);
  });

  it('handles touch and mouse pointer types equally', () => {
    swipe({ deltaY: -120, pointerType: 'touch' });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'half');

    swipe({ deltaY: -200, pointerType: 'mouse' });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'full');
  });

  it('ignores attempts to expand beyond full or collapse below collapsed', () => {
    swipe({ deltaY: -200 });
    swipe({ deltaY: -400 });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'full');

    swipe({ deltaY: 400 });
    swipe({ deltaY: 400 });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'collapsed');
  });

  it('handles rapid consecutive swipes without skipping intermediate states', () => {
    swipe({ deltaY: -120 });
    swipe({ deltaY: -120 });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'full');

    swipe({ deltaY: 120 });
    swipe({ deltaY: 120 });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'collapsed');
  });
});

describe('MobileBottomSheet - location integration', () => {
  it('renders locations inside semantic list', () => {
    renderSheet();
    const list = screen.getByRole('list', { name: /map results list/i });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(4);
  });

  it('highlights active location via aria-current', () => {
    const locations = createLocations();
    renderSheet({ locations, activeLocationId: locations[1].contentId });
    const buttons = screen.getAllByRole('button', { name: /Location/ });

    expect(buttons[1]).toHaveAttribute('aria-current', 'true');
    expect(buttons[0]).not.toHaveAttribute('aria-current');
  });

  it('invokes onLocationSelect when a card is pressed', () => {
    const onLocationSelect = vi.fn();
    const locations = createLocations();
    renderSheet({ locations, onLocationSelect });

    fireEvent.click(screen.getByRole('button', { name: /Location 2/ }));
    expect(onLocationSelect).toHaveBeenCalledWith(locations[1]);
  });

  it('renders empty state when there are no locations', () => {
    renderSheet({ locations: [] });
    expect(screen.getByText(/no places available/i)).toBeInTheDocument();
  });
});

describe('MobileBottomSheet - accessibility', () => {
  it('announces sheet as region with aria-label', () => {
    renderSheet();
    expect(screen.getByRole('region', { name: /map results/i })).toBeInTheDocument();
  });

  it('exposes handle button with aria attributes and keyboard support', () => {
    renderSheet();
    const handle = getHandleButton();
    expect(handle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(handle).toHaveAttribute('aria-expanded', 'true');
    expect(handle).toHaveAttribute('aria-label', 'Drag handle - sheet is half');

    fireEvent.keyDown(handle, { key: ' ' });
    expect(handle).toHaveAttribute('aria-label', 'Drag handle - sheet is full');
  });

  it('moves focus to first location when sheet becomes full', () => {
    const locations = createLocations();
    renderSheet({ locations });
    const expandButton = screen.getByRole('button', { name: /expand results/i });
    fireEvent.click(expandButton);
    fireEvent.click(expandButton);

    expect(document.activeElement).toHaveAttribute('data-location-id', locations[0].contentId);
  });

  it('traps focus within sheet when in full state', () => {
    renderSheet({ defaultState: 'full' });

    const handle = getHandleButton();
    const locationButtons = screen.getAllByRole('button', { name: /Location/ });
    const allowedTargets = [handle, ...locationButtons];

    locationButtons[locationButtons.length - 1].focus();
    fireEvent.keyDown(locationButtons[locationButtons.length - 1], { key: 'Tab' });
    expect(allowedTargets).toContain(document.activeElement);
  });

  it('collapses on Escape key', () => {
    renderSheet({ defaultState: 'full' });
    fireEvent.keyDown(getSheetPanel(), { key: 'Escape' });
    expect(getSheetPanel()).toHaveAttribute('data-state', 'collapsed');
  });

  it('exposes aria-live region with semantic list structure', () => {
    renderSheet();
    expect(screen.getByText(/4 places/i)).toHaveAttribute('aria-live', 'polite');
  });
});
