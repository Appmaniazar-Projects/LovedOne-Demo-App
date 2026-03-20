import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

// Google Places API types
interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  apiKey: string;
}

const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter address...',
  className = '',
  apiKey
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);

  // Load Google Places API script
  useEffect(() => {
    if (!apiKey) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      // Initialize autocomplete service
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
    };
    script.onerror = () => {
      console.error('Failed to load Google Places API');
      setScriptLoaded(false);
    };
    
    // Handle Google Maps API errors
    (window as any).gm_authFailure = () => {
      console.error('Google Maps API authentication failed');
      setScriptLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete (window as any).gm_authFailure;
    };
  }, [apiKey]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (!inputValue || inputValue.length < 3 || !scriptLoaded || !autocompleteService.current) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const request = {
        input: inputValue,
        componentRestrictions: { country: 'za' }, // Restrict to South Africa
        types: ['address']
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions as AddressSuggestion[]);
            setIsOpen(true);
          } else {
            setSuggestions([]);
            setIsOpen(false);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    onChange(suggestion.description);
    setIsOpen(false);

    // Get detailed place information
    if (window.google && window.google.maps && window.google.maps.places) {
      const placesService = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request = {
        placeId: suggestion.place_id,
        fields: ['address_components', 'formatted_address', 'geometry', 'name']
      };

      placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          onSelect?.(place);
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!apiKey || !scriptLoaded) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        {apiKey && !scriptLoaded && (
          <div className="text-xs text-amber-500 mt-1">
            Address autocomplete unavailable - using manual entry
          </div>
        )}
        {!apiKey && (
          <div className="text-xs text-red-500 mt-1">
            Google Places API key required for autocomplete
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Loading suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {suggestion.structured_formatting.main_text}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}

export default GoogleAddressAutocomplete;
