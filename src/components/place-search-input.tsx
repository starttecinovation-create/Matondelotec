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
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  
  const places = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!places || !debouncedValue) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = places;

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const request: google.maps.places.AutocompleteRequest = {
      input: debouncedValue,
      sessionToken: sessionTokenRef.current,
      locationBias: LUANDA_BOUNDS,
    };

    AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
      .then((res) => {
        setSuggestions(res.suggestions || []);
      })
      .catch((err) => {
        console.error("Erro ao carregar previsões de locais:", err);
        setSuggestions([]);
      });
  }, [debouncedValue, places]);

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!places || !suggestion.placePrediction) return;

    const place = suggestion.placePrediction.toPlace();
    sessionTokenRef.current = null; // Invalidate current session

    // Buscar todos os detalhes do local selecionado
    place.fetchFields({
      fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'types']
    }).then(() => {
      onPlaceSelect({
        place_id: place.id,
        name: place.displayName || suggestion.placePrediction?.text.text || '',
        formatted_address: place.formattedAddress || undefined,
        geometry: place.location ? {
          location: place.location,
          viewport: place.viewport || null,
        } : undefined,
        types: place.types || undefined,
      });
    }).catch((err) => {
      console.error("Erro ao obter detalhes do local selecionado:", err);
      // Fallback básico caso ocorra um erro
      onPlaceSelect({
        place_id: place.id,
        name: suggestion.placePrediction?.text.text || '',
      });
    });

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
          {suggestions.map((suggestion) => {
            const id = suggestion.placePrediction?.placeId;
            const description = suggestion.placePrediction?.text.text;
            if (!id || !description) return null;
            return (
              <div
                key={id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-3 cursor-pointer hover:bg-primary/90 text-sm text-primary-foreground"
              >
                {description}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
