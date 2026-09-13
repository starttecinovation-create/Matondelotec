'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import type { PlaceResult } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const INSTITUTIONS_DB: Record<string, string[]> = {
  A: [
    "Aeroporto Internacional Luanda Quatro de Fevereiro",
    "Assembleia Nacional de Angola",
    "Administração Geral Tributária (AGT)",
    "Angola Telecom",
    "Alvalade, Luanda",
    "Avenida Brasil, Luanda",
    "Avó Kumbi, Luanda",
    "Associação Industrial de Angola (AIA)",
    "Academia de Ciências Sociais",
    "Administração Municipal de Luanda",
    "Arquivo Nacional de Angola",
    "Aero-Vias Angolanas"
  ],
  B: [
    "Banco de Poupança e Crédito (BPC)",
    "Banco de Fomento Angola (BFA)",
    "Banco BIC",
    "Banco Sol",
    "Banco Nacional de Angola (BNA)",
    "Biblioteca Nacional de Angola",
    "Baía de Luanda",
    "Bairro Operário, Luanda",
    "Bairro Popular, Luanda",
    "Bombeiros Municipais de Luanda",
    "Benguela, Angola",
    "Benfica, Luanda"
  ],
  C: [
    "Clinica Sagrada Esperança",
    "Clinica Girassol",
    "Cidadela Desportiva",
    "Centro Cultural Português",
    "Cazenga, Luanda",
    "Centro de Imprensa Aníbal de Melo (CIAM)",
    "Câmara de Comércio e Indústria de Angola",
    "Catedral de Luanda",
    "Camama, Luanda",
    "Cuca, Luanda",
    "Cabinda, Angola",
    "Caxito, Angola"
  ],
  D: [
    "Direcção Nacional de Viação e Trânsito (DNVT)",
    "Distrito Urbano da Maianga",
    "Distrito Urbano do Rangel",
    "Distrito Urbano do Sambizanga",
    "Diário da República de Angola",
    "Domésticos, Luanda",
    "Dondo, Angola",
    "Dundo, Angola"
  ],
  E: [
    "ENDE - Empresa Nacional de Distribuição de Electricidade",
    "EPAL - Empresa Pública de Águas de Luanda",
    "Embaixada de Portugal em Luanda",
    "Embaixada do Brasil em Luanda",
    "Embaixada dos Estados Unidos em Luanda",
    "Escola Portuguesa de Luanda",
    "Elite Lounge Luanda",
    "Estádio 11 de Novembro",
    "Estádio dos Coqueiros"
  ],
  F: [
    "Fortaleza de São Miguel",
    "Faculdade de Medicina da Universidade Agostinho Neto",
    "Faculdade de Direito da Universidade Agostinho Neto",
    "Feira Internacional de Luanda (FILDA)",
    "Futungo de Belas",
    "Forças Armadas Angolanas (FAA)",
    "Futila, Angola",
    "Funda, Luanda"
  ],
  G: [
    "Governo Provincial de Luanda (GPL)",
    "Gabela, Angola",
    "Gamek, Luanda",
    "Grafanil, Luanda",
    "Gika, Luanda",
    "Galeria de Arte Nacional, Luanda",
    "Grupo Desportivo Interclube"
  ],
  H: [
    "Hospital Josina Machel",
    "Hospital Américo Boavida",
    "Hospital Militar Principal",
    "Hospital Geral de Luanda",
    "Hotel Epic Sana Luanda",
    "Hotel President Luanda",
    "Huambo, Angola",
    "Humpata, Angola"
  ],
  I: [
    "Instituto Superior Politécnico Metropolitano de Angola (IMETRO)",
    "Igreja de Nossa Senhora dos Remédios",
    "Instituto Nacional de Estatística (INE)",
    "Instituto Superior Técnico de Angola (ISTA)",
    "Ilha do Cabo, Luanda",
    "Instituto Camões Luanda",
    "Igreja Sagrada Família, Luanda"
  ],
  J: [
    "Jardim de Alvalade",
    "Jardim da Sagrada Família",
    "Jornal de Angola",
    "Juizado de Menores de Luanda",
    "Joanesburgo, África do Sul",
    "Jamba, Angola"
  ],
  K: [
    "Kero Nova Vida",
    "Kero Giga Mall",
    "Kero Kilamba",
    "Kero Talatona",
    "Kwanza Sul, Angola",
    "Kwanza Norte, Angola",
    "Kipupa, Angola",
    "Kikolo, Luanda",
    "Kinaxixi, Luanda"
  ],
  L: [
    "Lar do Patriota",
    "Luanda Shopping",
    "Lubango, Angola",
    "Lobito, Angola",
    "Lunda Sul, Angola",
    "Lunda Norte, Angola",
    "Lixeira do Benfica",
    "Liceu Mutu-ya-Kevela"
  ],
  M: [
    "Ministério das Finanças (MINFIN)",
    "Ministério da Saúde (MINSA)",
    "Ministério da Educação (MED)",
    "Matondelo Express",
    "Matondelo Kids",
    "Matondelo Táxi",
    "Matondelo Deliver",
    "Maianga, Luanda",
    "Miramar, Luanda",
    "Muxima, Angola",
    "Museu Nacional de Antropologia"
  ],
  N: [
    "Nosso Super Luanda",
    "Namibe, Angola",
    "Nova Vida, Luanda",
    "Nzeto, Angola",
    "Nelito Soares, Luanda",
    "Núcleo de Arte de Luanda"
  ],
  O: [
    "Ondjiva, Angola",
    "Organização da Mulher Angolana (OMA)",
    "Ordem dos Advogados de Angola",
    "Ordem dos Engenheiros de Angola",
    "Oasis Resort, Luanda"
  ],
  P: [
    "Palácio de Ferro",
    "Palácio Presidencial de Angola",
    "Porto de Luanda",
    "Parque Nacional da Kissama",
    "Palanca, Luanda",
    "Prenda, Luanda",
    "Petrangol, Luanda"
  ],
  Q: [
    "Quatro de Fevereiro, Luanda",
    "Quicolouro, Angola",
    "Quintalão, Luanda",
    "Quissama, Angola",
    "Quela, Angola",
    "Quedas de Kalandula, Angola"
  ],
  R: [
    "Rádio Nacional de Angola (RNA)",
    "Rangel, Luanda",
    "Rocha Pinto, Luanda",
    "Rua Rainha Ginga, Luanda",
    "Residencial Luanda",
    "Rio Kwanza, Angola"
  ],
  S: [
    "Sonangol EP",
    "Standard Bank Angola",
    "Samba, Luanda",
    "Sambizanga, Luanda",
    "Sapú, Luanda",
    "Saneamento de Luanda",
    "Shopping Fortaleza, Luanda",
    "Supermercado Alimenta Angola"
  ],
  T: [
    "Talatona, Luanda",
    "Terminal de Passageiros do Porto de Luanda",
    "Televisão Pública de Angola (TPA)",
    "Terra Nova, Luanda",
    "Terminal de Transportes da Estalagem",
    "Teixeira de Sousa, Angola"
  ],
  U: [
    "Universidade Agostinho Neto (UAN)",
    "Universidade Católica de Angola (UCAN)",
    "Universidade Lusíada de Angola",
    "Uíge, Angola",
    "Unitel Angola",
    "Urbanização Nova Vida"
  ],
  V: [
    "Viana, Luanda",
    "Vila Alice, Luanda",
    "Vila Estoril, Luanda",
    "Via Expressa Fidel Castro",
    "Valódia, Luanda",
    "Vista Alegre, Angola"
  ],
  W: [
    "Waku Kungo, Angola",
    "World Trade Center Luanda",
    "Westside Clinic Luanda"
  ],
  X: [
    "Xangongo, Angola",
    "Xá-Muteba, Angola",
    "Xiamo Shopping, Luanda"
  ],
  Y: [
    "Yale Centro Infantil",
    "Yacht Club de Luanda"
  ],
  Z: [
    "Zango 1, Luanda",
    "Zango 2, Luanda",
    "Zango 3, Luanda",
    "Zango 4, Luanda",
    "Zango 5, Luanda",
    "Zona Económica Especial (ZEE)",
    "Zaire, Angola"
  ]
};

const LOCAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Letra A
  "Aeroporto Internacional Luanda Quatro de Fevereiro": { lat: -8.8583, lng: 13.2311 },
  "Assembleia Nacional de Angola": { lat: -8.8164, lng: 13.2381 },
  "Administração Geral Tributária (AGT)": { lat: -8.8153, lng: 13.2241 },
  "Angola Telecom": { lat: -8.8142, lng: 13.2285 },
  "Alvalade, Luanda": { lat: -8.8344, lng: 13.2392 },
  "Avenida Brasil, Luanda": { lat: -8.8267, lng: 13.2435 },
  "Avó Kumbi, Luanda": { lat: -8.8789, lng: 13.2212 },
  "Administração Municipal de Luanda": { lat: -8.8122, lng: 13.2225 },
  
  // Letra B
  "Banco de Poupança e Crédito (BPC)": { lat: -8.8139, lng: 13.2208 },
  "Banco de Fomento Angola (BFA)": { lat: -8.8258, lng: 13.2217 },
  "Banco BIC": { lat: -8.8181, lng: 13.2267 },
  "Banco Sol": { lat: -8.8228, lng: 13.2294 },
  "Banco Nacional de Angola (BNA)": { lat: -8.8106, lng: 13.2231 },
  "Biblioteca Nacional de Angola": { lat: -8.8192, lng: 13.2250 },
  "Baía de Luanda": { lat: -8.8078, lng: 13.2244 },
  "Bairro Operário, Luanda": { lat: -8.8122, lng: 13.2422 },
  "Bairro Popular, Luanda": { lat: -8.8314, lng: 13.2461 },
  "Benfica, Luanda": { lat: -8.9281, lng: 13.1611 },

  // Letra C
  "Clinica Sagrada Esperança": { lat: -8.8275, lng: 13.2497 },
  "Clinica Girassol": { lat: -8.8217, lng: 13.2308 },
  "Cidadela Desportiva": { lat: -8.8194, lng: 13.2503 },
  "Centro Cultural Português": { lat: -8.8161, lng: 13.2319 },
  "Cazenga, Luanda": { lat: -8.8189, lng: 13.2844 },
  "Catedral de Luanda": { lat: -8.8117, lng: 13.2233 },
  "Camama, Luanda": { lat: -8.8953, lng: 13.2411 },

  // Letra D
  "Direcção Nacional de Viação e Trânsito (DNVT)": { lat: -8.8239, lng: 13.2683 },
  "Distrito Urbano da Maianga": { lat: -8.8306, lng: 13.2294 },
  "Distrito Urbano do Rangel": { lat: -8.8186, lng: 13.2514 },
  "Distrito Urbano do Sambizanga": { lat: -8.7958, lng: 13.2411 },

  // Letra E
  "ENDE - Empresa Nacional de Distribuição de Electricidade": { lat: -8.8131, lng: 13.2306 },
  "EPAL - Empresa Pública de Águas de Luanda": { lat: -8.8164, lng: 13.2258 },
  "Estádio 11 de Novembro": { lat: -8.9911, lng: 13.2814 },
  "Estádio dos Coqueiros": { lat: -8.8156, lng: 13.2219 },

  // Letra F
  "Fortaleza de São Miguel": { lat: -8.8067, lng: 13.2239 },
  "Futungo de Belas": { lat: -8.9167, lng: 13.1783 },

  // Letra H
  "Hospital Josina Machel": { lat: -8.8242, lng: 13.2244 },
  "Hospital Américo Boavida": { lat: -8.8189, lng: 13.2536 },
  "Hospital Geral de Luanda": { lat: -8.8911, lng: 13.2511 },
  "Hotel Epic Sana Luanda": { lat: -8.8175, lng: 13.2325 },

  // Letra I
  "Ilha do Cabo, Luanda": { lat: -8.7844, lng: 13.2458 },

  // Letra K
  "Kero Nova Vida": { lat: -8.8953, lng: 13.2564 },
  "Kero Kilamba": { lat: -8.9958, lng: 13.2561 },
  "Kero Talatona": { lat: -8.9222, lng: 13.1814 },

  // Letra L
  "Lar do Patriota": { lat: -8.9103, lng: 13.2081 },
  "Luanda Shopping": { lat: -8.8214, lng: 13.2356 },
  "Lubango, Angola": { lat: -14.9172, lng: 13.4925 },
  "Lobito, Angola": { lat: -12.3508, lng: 13.5350 },

  // Letra M
  "Matondelo Express": { lat: -8.8368, lng: 13.2343 },
  "Matondelo Kids": { lat: -8.8368, lng: 13.2343 },
  "Matondelo Táxi": { lat: -8.8368, lng: 13.2343 },
  "Matondelo Deliver": { lat: -8.8368, lng: 13.2343 },
  "Maianga, Luanda": { lat: -8.8306, lng: 13.2294 },
  "Miramar, Luanda": { lat: -8.8064, lng: 13.2425 },

  // Letra N
  "Nova Vida, Luanda": { lat: -8.8894, lng: 13.2514 },

  // Letra T
  "Talatona, Luanda": { lat: -8.9201, lng: 13.1788 },

  // Letra Z
  "Zango 1, Luanda": { lat: -8.9953, lng: 13.4097 },
  "Zango 2, Luanda": { lat: -8.9953, lng: 13.4097 },
  "Zango 3, Luanda": { lat: -8.9953, lng: 13.4097 },
  "Zango 4, Luanda": { lat: -8.9953, lng: 13.4097 },
  "Zango 5, Luanda": { lat: -8.9953, lng: 13.4097 },
  "Zango, Luanda": { lat: -8.9953, lng: 13.4097 }
};

export function PlaceSearchInput({ onPlaceSelect }: { onPlaceSelect: (place: PlaceResult | null) => void }) {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 300);
  const [activeLetter, setActiveLetter] = useState('A');
  const [googleSuggestions, setGoogleSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  
  const places = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const container = document.getElementById('place-search-container');
      if (container && !container.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sincroniza a letra ativa com o primeiro caractere digitado pelo utilizador
  useEffect(() => {
    const firstChar = value.trim().substring(0, 1).toUpperCase();
    if (firstChar && ALPHABET.includes(firstChar)) {
      setActiveLetter(firstChar);
    }
  }, [value]);

  useEffect(() => {
    if (!places) {
      setGoogleSuggestions([]);
      return;
    }

    if (isQuotaExceeded) {
      setGoogleSuggestions([]);
      return;
    }

    const searchTerm = debouncedValue.trim();
    if (searchTerm.length < 3) {
      setGoogleSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = places;

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const request: google.maps.places.AutocompleteRequest = {
      input: searchTerm,
      sessionToken: sessionTokenRef.current,
    };

    AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
      .then((res) => {
        setGoogleSuggestions(res.suggestions || []);
      })
      .catch((err) => {
        console.error("Erro ao carregar previsões de locais:", err);
        const errStr = String(err?.message || err);
        if (errStr.includes("Quota exceeded") || errStr.includes("limit") || errStr.includes("OVER_QUERY_LIMIT")) {
          setIsQuotaExceeded(true);
        }
        setGoogleSuggestions([]);
      });
  }, [debouncedValue, isFocused, places, isQuotaExceeded]);

  // Combina as sugestões locais com as do Google por ordem alfabética
  const combinedSuggestions = useMemo(() => {
    const queryStr = value.trim().toLowerCase();
    
    // Se a caixa de pesquisa estiver vazia, filtra pela letra ativa
    const currentLetter = queryStr ? queryStr.charAt(0).toUpperCase() : activeLetter;
    const customMatches = INSTITUTIONS_DB[currentLetter] || [];

    // Filtra as instituições customizadas
    const filteredCustom = customMatches
      .filter((name) => !queryStr || name.toLowerCase().includes(queryStr))
      .map((name) => ({
        id: `custom-${name}`,
        description: name,
        isCustom: true,
      }));

    // Formata previsões do Google
    const googleMatches = googleSuggestions.map((suggestion) => ({
      id: suggestion.placePrediction?.placeId || `google-${suggestion.placePrediction?.text.text}`,
      description: suggestion.placePrediction?.text.text || '',
      isCustom: false,
      googleSuggestion: suggestion,
    }));

    const seen = new Set<string>();
    const combined: typeof filteredCustom = [];

    // Adiciona itens customizados sem duplicados
    for (const item of filteredCustom) {
      if (!seen.has(item.description.toLowerCase())) {
        seen.add(item.description.toLowerCase());
        combined.push(item);
      }
    }

    // Adiciona previsões Google sem duplicados
    for (const item of googleMatches) {
      if (item.description && !seen.has(item.description.toLowerCase())) {
        seen.add(item.description.toLowerCase());
        combined.push({
          id: item.id,
          description: item.description,
          isCustom: false,
          googleSuggestion: item.googleSuggestion,
        });
      }
    }

    // Ordenação estritamente alfabética
    return combined.sort((a, b) => a.description.localeCompare(b.description));
  }, [value, activeLetter, googleSuggestions]);

  const handleSuggestionClick = (suggestion: {
    id: string;
    description: string;
    isCustom: boolean;
    googleSuggestion?: google.maps.places.AutocompleteSuggestion;
  }) => {
    if (!places) return;

    if (suggestion.isCustom) {
      // 1. Verifica se temos as coordenadas locais guardadas de forma estática
      const localCoords = LOCAL_COORDINATES[suggestion.description];
      if (localCoords) {
        onPlaceSelect({
          place_id: 'local_' + suggestion.description.replace(/\s+/g, '_'),
          name: suggestion.description,
          formatted_address: 'Luanda, Angola',
          geometry: {
            location: {
              lat: () => localCoords.lat,
              lng: () => localCoords.lng,
              toJSON: () => localCoords,
            } as unknown as google.maps.LatLng,
            viewport: null,
          }
        });
        setValue('');
        setGoogleSuggestions([]);
        return;
      }

      // 2. Se a quota estiver excedida, usa o centro de Luanda por defeito diretamente sem chamar a API
      if (isQuotaExceeded) {
        onPlaceSelect({
          place_id: 'custom_' + suggestion.description,
          name: suggestion.description,
          formatted_address: 'Luanda, Angola',
          geometry: {
            location: {
              lat: () => -8.8368,
              lng: () => 13.2343,
              toJSON: () => ({ lat: -8.8368, lng: 13.2343 }),
            } as unknown as google.maps.LatLng,
            viewport: null,
          }
        });
        setValue('');
        setGoogleSuggestions([]);
        return;
      }

      // Resolve as coordenadas e detalhes buscando no Google
      const { AutocompleteSuggestion } = places;
      AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: suggestion.description,
      })
        .then((res) => {
          if (res.suggestions && res.suggestions.length > 0) {
            const googleSug = res.suggestions[0];
            if (googleSug.placePrediction) {
              const place = googleSug.placePrediction.toPlace();
              place.fetchFields({
                fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'types']
              }).then(() => {
                onPlaceSelect({
                  place_id: place.id,
                  name: place.displayName || googleSug.placePrediction?.text.text || suggestion.description,
                  formatted_address: place.formattedAddress || undefined,
                  geometry: place.location ? {
                    location: place.location,
                    viewport: place.viewport || null,
                  } : undefined,
                  types: place.types || undefined,
                });
              }).catch((err) => {
                console.error("Erro ao obter detalhes do local customizado:", err);
                onPlaceSelect({
                  place_id: place.id,
                  name: suggestion.description,
                });
              });
            }
          } else {
            // Fallback caso não encontre no Google
            onPlaceSelect({
              place_id: 'custom_' + suggestion.description,
              name: suggestion.description,
              formatted_address: 'Angola',
            });
          }
        })
        .catch((err) => {
          console.error("Erro ao buscar local customizado no Google:", err);
          const errStr = String(err?.message || err);
          if (errStr.includes("Quota exceeded") || errStr.includes("limit") || errStr.includes("OVER_QUERY_LIMIT")) {
            setIsQuotaExceeded(true);
          }
          // Usa coordenadas do centro de Luanda por defeito no fallback de erro
          onPlaceSelect({
            place_id: 'custom_' + suggestion.description,
            name: suggestion.description,
            formatted_address: 'Luanda, Angola',
            geometry: {
              location: {
                lat: () => -8.8368,
                lng: () => 13.2343,
                toJSON: () => ({ lat: -8.8368, lng: 13.2343 }),
              } as unknown as google.maps.LatLng,
              viewport: null,
            }
          });
        });
    } else if (suggestion.googleSuggestion?.placePrediction) {
      const googleSug = suggestion.googleSuggestion;
      const place = googleSug.placePrediction.toPlace();
      sessionTokenRef.current = null;

      place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'types']
      }).then(() => {
        onPlaceSelect({
          place_id: place.id,
          name: place.displayName || googleSug.placePrediction?.text.text || '',
          formatted_address: place.formattedAddress || undefined,
          geometry: place.location ? {
            location: place.location,
            viewport: place.viewport || null,
          } : undefined,
          types: place.types || undefined,
        });
      }).catch((err) => {
        console.error("Erro ao obter detalhes do local selecionado:", err);
        const errStr = String(err?.message || err);
        if (errStr.includes("Quota exceeded") || errStr.includes("limit") || errStr.includes("OVER_QUERY_LIMIT")) {
          setIsQuotaExceeded(true);
        }
        onPlaceSelect({
          place_id: place.id,
          name: googleSug.placePrediction?.text.text || '',
        });
      });
    }

    setValue('');
    setGoogleSuggestions([]);
  };

  const selectLetter = (letter: string) => {
    setActiveLetter(letter);
    setValue('');
  };

  const handleNextLetter = () => {
    const index = ALPHABET.indexOf(activeLetter);
    const nextIndex = index === -1 ? 0 : (index + 1) % ALPHABET.length;
    setActiveLetter(ALPHABET[nextIndex]);
    setValue('');
  };

  const handlePrevLetter = () => {
    const index = ALPHABET.indexOf(activeLetter);
    const prevIndex = index === -1 ? 25 : (index - 1 + ALPHABET.length) % ALPHABET.length;
    setActiveLetter(ALPHABET[prevIndex]);
    setValue('');
  };

  const handleScrollUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0) {
      // Vai para a letra anterior de forma cíclica infinita!
      handlePrevLetter();
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 80);
    } else {
      container.scrollBy({ top: -140, behavior: 'smooth' });
    }
  };

  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = scrollContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
    if (isAtBottom) {
      // Vai para a próxima letra de forma cíclica infinita!
      handleNextLetter();
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 80);
    } else {
      container.scrollBy({ top: 140, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full max-w-md" id="place-search-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
        <Input
          type="text"
          placeholder="Pesquise primeiro um local, serviço ou produto..."
          className="pl-10 pr-10 placeholder:text-black/60 text-black w-full"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setIsFocused(true);
          }}
          onFocus={() => {
            setIsFocused(true);
          }}
          onClick={() => {
            setIsFocused(true);
          }}
          id="place-search-input"
        />
        {value && (
          <button
            onClick={() => {
              setValue('');
              setActiveLetter('A');
              setGoogleSuggestions([]);
              setIsFocused(true);
              const inputEl = document.getElementById('place-search-input');
              if (inputEl) {
                inputEl.focus();
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black p-1 rounded-full hover:bg-black/5"
            title="Limpar pesquisa"
            id="btn-clear-search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isFocused && combinedSuggestions.length > 0 && (
        <div className="absolute top-full mt-1.5 w-full rounded-lg border border-white/20 bg-primary shadow-xl z-25 overflow-hidden flex flex-col max-h-[440px]" id="suggestions-dropdown-box">
          
          {/* Alphabet Strip - Alterna com as letras alfabéticas procuradas */}
          <div className="flex items-center justify-between border-b border-white/25 p-2 bg-primary/95 sticky top-0 z-30 shadow-xs">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrevLetter();
              }}
              className="p-1.5 hover:bg-white/15 rounded-full text-white transition-all hover:scale-105 active:scale-95"
              title="Letra Anterior"
              id="btn-letter-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex-1 overflow-x-auto no-scrollbar flex gap-1.5 px-2 py-1 items-center scroll-smooth">
              {ALPHABET.map((letter) => {
                const isCurrent = activeLetter === letter;
                return (
                  <button
                    key={letter}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectLetter(letter);
                    }}
                    className={`min-w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isCurrent 
                        ? 'bg-white text-[#D45500] scale-110 shadow-lg border border-white/10' 
                        : 'text-white hover:bg-white/20'
                    }`}
                    id={`btn-letter-select-${letter}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNextLetter();
              }}
              className="p-1.5 hover:bg-white/15 rounded-full text-white transition-all hover:scale-105 active:scale-95"
              title="Próxima Letra"
              id="btn-letter-next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Seta de Scroll Superior */}
          <button
            onClick={handleScrollUp}
            className="w-full py-2 flex justify-center items-center bg-white/5 hover:bg-white/15 text-white transition-all border-b border-white/15 focus:outline-none"
            title="Deslocar para cima (Cíclico)"
            id="btn-arrow-up"
          >
            <ChevronUp className="h-5 w-5" />
          </button>

          {/* Lista de Sugestões com Scroll */}
          <div 
            ref={scrollContainerRef}
            className="overflow-y-auto max-h-64 scroll-smooth flex-1 scrollbar-thin scrollbar-thumb-white/20"
            id="suggestions-list-scrollable"
          >
            {combinedSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-3 cursor-pointer hover:bg-white/10 text-sm text-primary-foreground transition-all duration-150 border-b border-white/5 last:border-none flex items-center justify-between"
                id={`suggestion-item-${suggestion.id}`}
              >
                <span className="font-semibold">{suggestion.description}</span>
                {suggestion.isCustom && (
                  <span className="text-[9px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest scale-90">
                    Local
                  </span>
                )}
              </div>
            ))}
          </div>

          {isQuotaExceeded && (
            <div className="p-2 bg-amber-600 text-[10px] text-white text-center font-bold tracking-wide border-t border-white/10 select-none uppercase" id="quota-warning-message">
              ⚠️ Modo offline: Limite diário de pesquisa do Google atingido
            </div>
          )}

          {/* Seta de Scroll Inferior */}
          <button
            onClick={handleScrollDown}
            className="w-full py-2 flex justify-center items-center bg-white/5 hover:bg-white/15 text-white transition-all border-t border-white/15 focus:outline-none"
            title="Deslocar para baixo (Cíclico)"
            id="btn-arrow-down"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
