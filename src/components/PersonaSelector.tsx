import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Persona } from '../types';
import { generatePersonas } from '../services/geminiService';
import { personaService } from '../services/personaService';
import { Search, Sparkles, Plus, Loader2 } from 'lucide-react';

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

  // Generate AI personas function
  const generateAiPersonas = useCallback(async (term: string) => {
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
  }, []);

  // Handle Enter key press for search
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim()) {
        generateAiPersonas(searchTerm);
      }
    }
  };

  // Show existing personas that match search term
  useEffect(() => {
    if (searchTerm.trim()) {
      setShowAiDropdown(true);
    } else {
      setShowAiDropdown(false);
      setAiPersonas([]);
    }
  }, [searchTerm]);

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
        <div className="text-center space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Choose Your Chat Persona</h2>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm sm:text-base">
              Browse available personas below or search for new ones
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">📋 Browse existing personas</span>
              <span className="bg-muted px-2 py-1 rounded">🔍 Filter by category</span>
              <span className="bg-muted px-2 py-1 rounded">✨ Search & press Enter for new personas</span>
            </div>
          </div>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              <Input
                type="text"
                placeholder="Search for a persona and press Enter to find new ones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 pr-10 text-sm"
              />
              {isGenerating && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin z-10" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showAiDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {isGenerating && (
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span className="text-sm">AI is creating new personas for you...</span>
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
                            Found Personas
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click any persona to start chatting
                          </p>
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
                             AI Generated Personas
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">
                             Click to add to collection and start chatting
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
                  <div className="p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">No personas found for "{searchTerm}"</p>
                    <p className="text-xs text-muted-foreground">Press Enter to let AI create new personas for this search</p>
                  </div>
                )}

                {!isGenerating && !generationError && filteredPersonas.length === 0 && aiPersonas.length === 0 && searchTerm.length > 0 && searchTerm.length < 3 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Type at least 3 characters and press Enter to search</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredPersonas.map((persona, index) => (
            <div
              key={persona.id}
              onClick={() => onPersonaSelect(persona)}
              className="relative bg-card rounded-xl border-2 border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer touch-manipulation aspect-square overflow-hidden"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(https://picsum.photos/1000?random=${index + 1})`
                }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Category Badge */}
              <div className="absolute top-2 right-2 z-10">
                <span className="text-xs px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white capitalize">
                  {persona.category}
                </span>
              </div>
              
              {/* Name at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                  {persona.name}
                </h3>
              </div>
              
              {/* Hover Overlay with Description */}
              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center p-4 z-20">
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-lg text-white">
                    {persona.name}
                  </h3>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {persona.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPersonas.length === 0 && !isLoading && !searchTerm && (
          <div className="text-center py-12 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">No Personas Yet</h3>
              <p className="text-muted-foreground">Start by searching for a persona you'd like to chat with</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="bg-muted px-3 py-1 rounded-full text-xs">Einstein</span>
                <span className="bg-muted px-3 py-1 rounded-full text-xs">Shakespeare</span>
                <span className="bg-muted px-3 py-1 rounded-full text-xs">Iron Man</span>
                <span className="bg-muted px-3 py-1 rounded-full text-xs">Chef</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Type any persona name and press Enter</p>
            </div>
          </div>
        )}

        {filteredPersonas.length === 0 && !isLoading && searchTerm && !showAiDropdown && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No personas match "{searchTerm}"</p>
            <p className="text-muted-foreground mt-2">Press Enter to let AI create new personas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaSelector; 