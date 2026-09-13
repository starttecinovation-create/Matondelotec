'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import type { PlaceResult } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Mic, Camera, MapPin, Clock, ArrowUpRight, Sparkles, Compass } from 'lucide-react';
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
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'places' | 'taxi' | 'services'>('all');
  
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

  // Reseta o índice de sugestão selecionada quando o utilizador escreve ou muda de filtro
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [value, activeFilter, activeLetter]);

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

  // Filtra as sugestões baseado no filtro de categoria ativo (Tudo, Locais, Táxi, Serviços)
  const filteredSuggestions = useMemo(() => {
    if (activeFilter === 'all') return combinedSuggestions;

    return combinedSuggestions.filter((suggestion) => {
      const desc = suggestion.description.toLowerCase();
      
      if (activeFilter === 'places') {
        // Lugares, aeroportos, bairros, vilas, avenidas ou marcas/locais puros
        return suggestion.isCustom || 
               desc.includes('aeroporto') || 
               desc.includes('assembleia') || 
               desc.includes('bairro') || 
               desc.includes('avenida') || 
               desc.includes('distrito') || 
               desc.includes('ilha') || 
               desc.includes('estádio') || 
               desc.includes('parque') || 
               desc.includes('palácio') || 
               desc.includes('porto') || 
               desc.includes('rio');
      }

      if (activeFilter === 'taxi') {
        // Locais com táxi, trânsito, vias ou transporte
        return desc.includes('táxi') || 
               desc.includes('express') || 
               desc.includes('viagem') || 
               desc.includes('aeroporto') || 
               desc.includes('terminal') || 
               desc.includes('via') || 
               desc.includes('trânsito') || 
               desc.includes('bombeiros') || 
               desc.includes('estrada');
      }

      if (activeFilter === 'services') {
        // Bancos, clínicas, hospitais, hotéis, supermercados, universidades ou escolas
        return desc.includes('banco') || 
               desc.includes('clínica') || 
               desc.includes('hospital') || 
               desc.includes('hotel') || 
               desc.includes('supermercado') || 
               desc.includes('kero') || 
               desc.includes('shopping') || 
               desc.includes('biblioteca') || 
               desc.includes('universidade') || 
               desc.includes('escola') || 
               desc.includes('instituto') || 
               desc.includes('igreja') || 
               desc.includes('ministério') || 
               desc.includes('telecom') || 
               desc.includes('alimenta') || 
               desc.includes('lounge') || 
               desc.includes('resort');
      }

      return true;
    });
  }, [combinedSuggestions, activeFilter]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isFocused || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < filteredSuggestions.length) {
        handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
      } else if (value.trim()) {
        onPlaceSelect({
          place_id: 'direct_search_' + encodeURIComponent(value.trim()),
          name: value.trim(),
          formatted_address: 'Pesquisa Global',
        });
        setValue('');
        setIsFocused(false);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg" id="place-search-container">
      {/* Container Principal da Barra de Pesquisa no estilo Google */}
      <div className="relative flex items-center bg-white rounded-full border border-neutral-200 shadow-sm hover:shadow-md focus-within:shadow-md transition-all duration-200 pl-4 pr-3 h-12 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        <Search className="h-5 w-5 text-neutral-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder="Pesquise por qualquer local, serviço ou táxi..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-800 placeholder-neutral-400 font-sans w-full py-2.5"
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
          onKeyDown={handleKeyDown}
          id="place-search-input"
        />
        
        {/* Ícones de Acessibilidade Estilo Google (Voz, Imagem, Limpar) */}
        <div className="flex items-center gap-1 shrink-0 pl-2">
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
              className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
              title="Limpar pesquisa"
              id="btn-clear-search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="h-5 w-px bg-neutral-200 mx-1.5" />
          <button 
            type="button" 
            className="p-1.5 text-blue-500 hover:bg-neutral-50 rounded-full transition hover:scale-105 active:scale-95" 
            title="Pesquisa por Voz (Google Voice)"
            onClick={() => console.log("Pesquisa por voz em desenvolvimento")}
          >
            <Mic className="h-4.5 w-4.5" />
          </button>
          <button 
            type="button" 
            className="p-1.5 text-red-500 hover:bg-neutral-50 rounded-full transition hover:scale-105 active:scale-95" 
            title="Pesquisa por Imagem (Google Lens)"
            onClick={() => console.log("Pesquisa por imagem em desenvolvimento")}
          >
            <Camera className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Caixa de Sugestões Flutuante (Estilo Menu Google) */}
      {isFocused && (value.trim().length > 0 || combinedSuggestions.length > 0) && (
        <div className="absolute top-full mt-2 w-full rounded-2xl border border-neutral-200 bg-white shadow-2xl z-25 overflow-hidden flex flex-col max-h-[480px]" id="suggestions-dropdown-box">
          
          {/* Abas Rápidas de Categoria / Filtros Flexíveis */}
          <div className="flex gap-1.5 p-3 border-b border-neutral-100 overflow-x-auto no-scrollbar bg-neutral-50/50">
            {[
              { id: 'all', label: 'Tudo', icon: Compass },
              { id: 'places', label: 'Locais', icon: MapPin },
              { id: 'taxi', label: 'Rotas de Táxi', icon: Sparkles },
              { id: 'services', label: 'Serviços', icon: Compass }
            ].map(filter => {
              const Icon = filter.icon;
              const isSelected = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveFilter(filter.id as any);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Faixa Alfabética Superior no estilo Clássico Google */}
          <div className="flex items-center justify-between border-b border-neutral-100 p-2 bg-neutral-50 sticky top-0 z-30 shadow-xs">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrevLetter();
              }}
              className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-500 transition-all hover:scale-105 active:scale-95"
              title="Letra Anterior"
              id="btn-letter-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex-1 overflow-x-auto no-scrollbar flex gap-1 px-1.5 py-0.5 items-center scroll-smooth">
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
                    className={`min-w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent 
                        ? 'bg-blue-500 text-white scale-105 shadow-sm' 
                        : 'text-neutral-600 hover:bg-neutral-100'
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
              className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-500 transition-all hover:scale-105 active:scale-95"
              title="Próxima Letra"
              id="btn-letter-next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Seta de Scroll Superior */}
          <button
            onClick={handleScrollUp}
            className="w-full py-1.5 flex justify-center items-center bg-neutral-50/50 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all border-b border-neutral-100 focus:outline-none"
            title="Deslocar para cima (Cíclico)"
            id="btn-arrow-up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          {/* Lista de Sugestões com Scroll */}
          <div 
            ref={scrollContainerRef}
            className="overflow-y-auto max-h-64 scroll-smooth flex-1 scrollbar-thin scrollbar-thumb-neutral-200 bg-white"
            id="suggestions-list-scrollable"
          >
            {filteredSuggestions.map((suggestion, index) => {
              const isSelected = index === activeSuggestionIndex;
              return (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                  className={`p-3 cursor-pointer text-sm text-neutral-800 transition-all duration-150 border-b border-neutral-50 last:border-none flex items-center justify-between ${
                    isSelected ? 'bg-neutral-50 border-l-4 border-blue-500 pl-2' : 'hover:bg-neutral-50/70'
                  }`}
                  id={`suggestion-item-${suggestion.id}`}
                >
                  <div className="flex items-center gap-2.5">
                    {suggestion.isCustom ? (
                      <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <Compass className="h-4 w-4 text-neutral-400 shrink-0" />
                    )}
                    <span className={`${isSelected ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'}`}>{suggestion.description}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {suggestion.isCustom && (
                      <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider scale-90 border border-blue-100">
                        Local
                      </span>
                    )}
                    <ArrowUpRight className={`h-4 w-4 text-neutral-400 transition-all ${isSelected ? 'opacity-100 translate-x-0.5 -translate-y-0.5 text-blue-500' : 'opacity-0'}`} />
                  </div>
                </div>
              );
            })}

            {/* Estado Vazio de Pesquisa */}
            {filteredSuggestions.length === 0 && (
              <div className="p-8 text-center text-sm text-neutral-500 flex flex-col items-center justify-center gap-2 bg-white">
                <Compass className="h-8 w-8 text-neutral-300 animate-pulse" />
                <p className="font-semibold text-neutral-700">Nenhum resultado encontrado</p>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Tente outra letra no menu superior ou escreva para procurar qualquer destino ou serviço diretamente.
                </p>
              </div>
            )}
          </div>

          {isQuotaExceeded && (
            <div className="p-2 bg-amber-500 text-[10px] text-white text-center font-bold tracking-wide border-t border-neutral-100 select-none uppercase" id="quota-warning-message">
              ⚠️ Modo offline: Limite diário de pesquisa do Google atingido
            </div>
          )}

          {/* Seta de Scroll Inferior */}
          <button
            onClick={handleScrollDown}
            className="w-full py-1.5 flex justify-center items-center bg-neutral-50/50 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all border-t border-neutral-100 focus:outline-none"
            title="Deslocar para baixo (Cíclico)"
            id="btn-arrow-down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
