import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Persona } from '../types';
import { generatePersonas } from '../services/geminiService';
import { personaService } from '../services/personaService';
import { Search, Sparkles, Plus, Loader2 } from 'lucide-react';
import debounce from 'lodash/debounce';

interface PersonaSelectorProps {
  onPersonaSelect: (persona: Persona) => void;
}

const PersonaSelector = ({ onPersonaSelect }: PersonaSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiPersonas, setAiPersonas] = useState<Array<{
    name: string;
    description: string;
    category: string;
  }>>([]);
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([
    { id: 'all', name: 'All Personas' }
  ]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load personas from Firebase on component mount
  useEffect(() => {
    const loadPersonasFromFirebase = async () => {
      setIsLoading(true);
      try {
        const personas = await personaService.loadPersonas();
        setAllPersonas(personas);
        
        // Build categories dynamically based on existing personas
        const existingCategories = new Set(personas.map(p => p.category));
        const categories = [{ id: 'all', name: 'All Personas' }];
        
        existingCategories.forEach(category => {
          categories.push({
            id: category,
            name: category.charAt(0).toUpperCase() + category.slice(1)
          });
        });
        
        setAllCategories(categories);
      } catch (error) {
        console.error('Failed to load personas from Firebase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonasFromFirebase();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAiDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced AI persona generation function
  const debouncedGeneratePersonas = useCallback(
    debounce(async (term: string) => {
      if (term.trim().length >= 3) {
        setIsGenerating(true);
        setGenerationError(null);
        setShowAiDropdown(true);

        try {
          const personas = await generatePersonas(term);
          setAiPersonas(personas);
        } catch (error) {
          setGenerationError(error instanceof Error ? error.message : 'Failed to generate personas');
          setAiPersonas([]);
        } finally {
          setIsGenerating(false);
        }
      } else {
        setShowAiDropdown(false);
        setAiPersonas([]);
      }
    }, 500),
    []
  );

  // Handle search term changes
  useEffect(() => {
    debouncedGeneratePersonas(searchTerm);
  }, [searchTerm, debouncedGeneratePersonas]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedGeneratePersonas.cancel();
    };
  }, [debouncedGeneratePersonas]);

  const handleAiPersonaSelect = async (aiPersona: { name: string; description: string; category: string }) => {
    try {


      const newPersona: Persona = {
        id: `ai-${Date.now()}-${aiPersona.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: aiPersona.name,
        description: aiPersona.description,
        avatar: '',
        category: aiPersona.category as Persona['category'],
        isGenerated: true,
      };

      // Save to Firebase
      const saved = await personaService.savePersona(newPersona);
      
      if (saved) {
        // Add to local state
        setAllPersonas(prev => {
          const updatedPersonas = [...prev, newPersona];
          
          // Update categories when new persona is added
          const existingCategories = new Set(updatedPersonas.map(p => p.category));
          const categories = [{ id: 'all', name: 'All Personas' }];
          
          existingCategories.forEach(category => {
            categories.push({
              id: category,
              name: category.charAt(0).toUpperCase() + category.slice(1)
            });
          });
          
          setAllCategories(categories);
          
          return updatedPersonas;
        });
        
        // Clear search and hide dropdown
        setSearchTerm('');
        setShowAiDropdown(false);
        setAiPersonas([]);
        
        // Select the persona
        onPersonaSelect(newPersona);
      } else {
        console.error('Failed to save persona to Firebase');
      }
    } catch (error) {
      console.error('Error handling AI persona selection:', error);
    }
  };

  const filteredPersonas = allPersonas.filter((persona) => {
    const matchesCategory = selectedCategory === 'all' || persona.category === selectedCategory;
    const matchesSearch = searchTerm === '' || persona.name.toLowerCase().includes(searchTerm.toLowerCase()) || persona.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-card/80 backdrop-blur-md border-b border-border p-4 sm:p-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Choose Your Chat Persona</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Loading personas...
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading personas from database...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border p-4 sm:p-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Choose Your Chat Persona</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Select from our collection or use AI to discover new personas.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {allCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 py-2 h-9 transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <span className="">{category.name}</span>
              </Button>
            ))}
          </div>

          <div className="w-full lg:w-auto lg:min-w-72 relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search or Find a Persona"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              />
              {isGenerating && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showAiDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {isGenerating && (
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span className="text-sm">Finding personas...</span>
                    </div>
                  </div>
                )}

                {generationError && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-destructive">{generationError}</p>
                  </div>
                )}

                {!isGenerating && !generationError && (filteredPersonas.length > 0 || aiPersonas.length > 0) && (
                  <div className="py-2">
                    {/* Existing personas that match search */}
                    {filteredPersonas.length > 0 && (
                      <>
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Search className="h-4 w-4 text-primary" />
                            Existing Personas
                          </div>
                        </div>
                        {filteredPersonas.map((persona) => (
                          <button
                            key={persona.id}
                            onClick={() => onPersonaSelect(persona)}
                            className="w-full px-4 py-3 hover:bg-accent text-left transition-colors duration-200 group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-foreground group-hover:text-primary">
                                  {persona.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground capitalize">
                                    {persona.category}
                                  </span>
                                  {persona.isGenerated && (
                                    <Sparkles className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground group-hover:text-foreground line-clamp-2">
                                {persona.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* AI generated personas */}
                    {aiPersonas.length > 0 && (
                      <>
                        {filteredPersonas.length > 0 && <div className="border-b border-border" />}
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Sparkles className="h-4 w-4 text-primary" />
                            New Personas
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click to add and start chatting
                          </p>
                        </div>
                        {aiPersonas.map((persona, index) => {
                          const existingPersona = allPersonas.find(p => 
                            p.name.toLowerCase() === persona.name.toLowerCase()
                          );
                          
                          // Don't show AI personas that already exist
                          if (existingPersona) return null;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => handleAiPersonaSelect(persona)}
                              className="w-full px-4 py-3 hover:bg-accent text-left transition-colors duration-200 group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm text-foreground group-hover:text-primary">
                                    {persona.name}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground capitalize">
                                      {persona.category}
                                    </span>
                                    <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground group-hover:text-foreground line-clamp-2">
                                  {persona.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}

                {!isGenerating && !generationError && filteredPersonas.length === 0 && aiPersonas.length === 0 && searchTerm.length >= 3 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No personas found. Try a different search term.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredPersonas.map((persona) => (
            <Button
              key={persona.id}
              onClick={() => onPersonaSelect(persona)}
              variant="outline"
              className="bg-card hover:bg-accent rounded-xl p-4 sm:p-5 text-left transition-all duration-200 group h-auto justify-start border-2 hover:border-primary/20 min-h-[120px] sm:min-h-[140px] touch-manipulation"
            >
              <div className="space-y-2 w-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary break-words hyphens-auto leading-tight">
                    {persona.name}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground capitalize self-start">
                    {persona.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground leading-relaxed break-words hyphens-auto overflow-hidden">
                  <span className="line-clamp-3 sm:line-clamp-4">
                    {persona.description}
                  </span>
                </p>
              </div>
            </Button>
          ))}
        </div>

        {filteredPersonas.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No personas found</p>
            <p className="text-muted-foreground mt-4">Use the search bar above to discover and add new personas with AI</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaSelector; 