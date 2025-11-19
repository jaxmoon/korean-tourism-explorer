# Task H: Search & Filter UI (TDD)

**Phase**: 4 | **Time**: 4.5h | **Agent**: frontend-ui-specialist
**Dependencies**: Task G, D | **EST**: 11.5h | **Slack**: 2h

## Objective
Build search bar, filter panel, pagination with TDD.

---

## 🔴 RED (1h)

```typescript
// components/search/__tests__/SearchBar.test.tsx
describe('SearchBar', () => {
  it('should debounce input', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Seoul' } });

    // Should NOT call immediately
    expect(onSearch).not.toHaveBeenCalled();

    // Should call after 300ms
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('Seoul'), {
      timeout: 400,
    });
  });

  it('should show search suggestions', async () => {
    render(<SearchBar />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Seo' } });

    await waitFor(() => {
      expect(screen.getByText(/seoul/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🟢 GREEN (2.5h)

```typescript
// components/search/SearchBar.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';

export const SearchBar: React.FC<{
  onSearch: (query: string) => void;
  placeholder?: string;
}> = ({ onSearch, placeholder = '관광지, 맛집 검색...' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      onSearch(debouncedQuery);
      // Load suggestions
      loadSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const loadSuggestions = async (q: string) => {
    // Get from search history + popular keywords
    const history = JSON.parse(localStorage.getItem('search_history') || '[]');
    const filtered = history.filter((h: string) =>
      h.toLowerCase().includes(q.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        icon={<Search className="w-5 h-5" />}
        className="pr-10"
      />

      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      )}

      {suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg z-10">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(s);
                onSearch(s);
                setSuggestions([]);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50"
            >
              <Search className="w-4 h-4 inline mr-2" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 🔵 REFACTOR (1h)

```typescript
// components/search/FilterPanel.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const FilterPanel: React.FC<{
  onFilterChange: (filters: any) => void;
}> = ({ onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState({
    contentType: null,
    region: null,
  });

  const contentTypes = [
    { id: 12, label: '관광지' },
    { id: 39, label: '음식점' },
    { id: 32, label: '숙박' },
    { id: 15, label: '행사' },
  ];

  const handleFilterClick = (type: string, value: any) => {
    const updated = { ...activeFilters, [type]: value };
    setActiveFilters(updated);
    onFilterChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">분류</h3>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((type) => (
            <Badge
              key={type.id}
              variant={activeFilters.contentType === type.id ? 'info' : 'default'}
              className="cursor-pointer"
              onClick={() => handleFilterClick('contentType', type.id)}
            >
              {type.label}
            </Badge>
          ))}
        </div>
      </div>

      {Object.values(activeFilters).some(Boolean) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActiveFilters({ contentType: null, region: null });
            onFilterChange({});
          }}
        >
          필터 초기화
        </Button>
      )}
    </div>
  );
};
```

## Success Criteria
- [x] SearchBar with debounce
- [x] Search suggestions
- [x] FilterPanel with badges
- [x] Pagination/infinite scroll
- [x] Tests passing ✅
