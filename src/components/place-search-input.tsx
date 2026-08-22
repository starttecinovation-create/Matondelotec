'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import type { PlaceResult } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

const LUANDA_BOUNDS = {
  north: -8.75,
  south: -8.95,
  west: 13.15,
  east: 13.35,
};

export function PlaceSearchInput({ onPlaceSelect }: { onPlaceSelect: (place: PlaceResult | null) => void }) {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 300);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  
  const places = useMapsLibrary('places');
  const service = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (!places) return;
    service.current = new places.AutocompleteService();
  }, [places]);

  useEffect(() => {
    if (service.current && debouncedValue) {
      service.current.getPlacePredictions({
        input: debouncedValue,
        bounds: LUANDA_BOUNDS,
        componentRestrictions: { country: 'ao' },
      }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      });
    } else {
      setSuggestions([]);
    }
  }, [debouncedValue]);

  const handleSuggestionClick = (placeId: string) => {
    // No need to get details here, we can do it on the target page
    // to avoid needing a map instance everywhere.
    onPlaceSelect({ place_id: placeId, name: '' });
    setValue('');
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
      <Input
        type="search"
        placeholder="Pesquise primeiro um local, serviço ou produto..."
        className="pl-10 placeholder:text-black/60 text-black"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full rounded-md border bg-primary shadow-lg z-10">
          {suggestions.map(({ place_id, description }) => (
            <div
              key={place_id}
              onClick={() => handleSuggestionClick(place_id)}
              className="p-3 cursor-pointer hover:bg-primary/90 text-sm text-primary-foreground"
            >
              {description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
