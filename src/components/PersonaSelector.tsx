import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Persona } from '../types';
import { generatePersonas } from '../services/geminiService';
import { Search, Sparkles, Plus, Loader2 } from 'lucide-react';

interface PersonaSelectorProps {
  onPersonaSelect: (persona: Persona) => void;
}

const PERSONAS: Persona[] = [
  // Celebrities
  {
    id: 'elon-musk',
    name: 'Elon Musk',
    description: 'Entrepreneur and business magnate, CEO of Tesla and SpaceX',
    avatar: '',
    category: 'celebrity',
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    description: 'Theoretical physicist known for the theory of relativity',
    avatar: '',
    category: 'celebrity',
  },
  {
    id: 'oprah',
    name: 'Oprah Winfrey',
    description: 'Media mogul, talk show host, and philanthropist',
    avatar: '',
    category: 'celebrity',
  },
  
  // Anime Characters
  {
    id: 'naruto',
    name: 'Naruto Uzumaki',
    description: 'Energetic ninja from the Hidden Leaf Village',
    avatar: '',
    category: 'anime',
  },
  {
    id: 'goku',
    name: 'Son Goku',
    description: 'Powerful Saiyan warrior who protects Earth',
    avatar: '',
    category: 'anime',
  },
  {
    id: 'luffy',
    name: 'Monkey D. Luffy',
    description: 'Pirate captain searching for the One Piece treasure',
    avatar: '',
    category: 'anime',
  },
  
  // Cartoon Characters
  {
    id: 'mickey-mouse',
    name: 'Mickey Mouse',
    description: 'Cheerful and optimistic cartoon mouse',
    avatar: '',
    category: 'cartoon',
  },
  {
    id: 'scooby-doo',
    name: 'Scooby-Doo',
    description: 'Mystery-solving Great Dane with a love for Scooby Snacks',
    avatar: '',
    category: 'cartoon',
  },
  {
    id: 'bugs-bunny',
    name: 'Bugs Bunny',
    description: 'Witty and mischievous cartoon rabbit',
    avatar: '',
    category: 'cartoon',
  },
  
  // Historical Figures
  {
    id: 'shakespeare',
    name: 'William Shakespeare',
    description: 'English playwright and poet from the Renaissance era',
    avatar: '',
    category: 'historical',
  },
  {
    id: 'cleopatra',
    name: 'Cleopatra VII',
    description: 'Last active pharaoh of Ptolemaic Egypt',
    avatar: '',
    category: 'historical',
  },
  {
    id: 'leonardo',
    name: 'Leonardo da Vinci',
    description: 'Renaissance polymath, artist, and inventor',
    avatar: '',
    category: 'historical',
  },
  
  // Fictional Characters
  {
    id: 'sherlock',
    name: 'Sherlock Holmes',
    description: 'Brilliant detective with exceptional deductive abilities',
    avatar: '',
    category: 'fictional',
  },
  {
    id: 'gandalf',
    name: 'Gandalf',
    description: 'Wise wizard from Middle-earth',
    avatar: '',
    category: 'fictional',
  },
  {
    id: 'batman',
    name: 'Batman',
    description: 'Dark Knight and protector of Gotham City',
    avatar: '',
    category: 'fictional',
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Personas' },
  { id: 'celebrity', name: 'Celebrities' },
  { id: 'anime', name: 'Anime' },
  { id: 'cartoon', name: 'Cartoons' },
  { id: 'historical', name: 'Historical' },
  { id: 'fictional', name: 'Fictional' },
];

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
  const [allPersonas, setAllPersonas] = useState<Persona[]>(PERSONAS);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Save custom personas to localStorage
  useEffect(() => {
    const customPersonas = allPersonas.filter(persona => persona.isGenerated);
    if (customPersonas.length > 0) {
      try {
        localStorage.setItem('persona-chat-custom-personas', JSON.stringify(customPersonas));
      } catch (error) {
        console.error('Failed to save custom personas to localStorage:', error);
      }
    }
  }, [allPersonas]);

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

  // Handle AI persona generation with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsGenerating(true);
        setGenerationError(null);
        setShowAiDropdown(true);

        try {
          const personas = await generatePersonas(searchTerm);
          setAiPersonas(personas);
        } catch (error) {
          setGenerationError(error instanceof Error ? error.message : 'Failed to generate personas');
          setAiPersonas([]);
        } finally {
          setIsGenerating(false);
        }
      }, 500);
    } else {
      setShowAiDropdown(false);
      setAiPersonas([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleAiPersonaSelect = (aiPersona: { name: string; description: string; category: string }) => {
    // Check if persona already exists
    const existingPersona = allPersonas.find(p => 
      p.name.toLowerCase() === aiPersona.name.toLowerCase()
    );

    if (existingPersona) {
      // If persona already exists, just select it
      setSearchTerm('');
      setShowAiDropdown(false);
      setAiPersonas([]);
      onPersonaSelect(existingPersona);
      return;
    }

    const newPersona: Persona = {
      id: `ai-${Date.now()}-${aiPersona.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: aiPersona.name,
      description: aiPersona.description,
      avatar: '',
      category: aiPersona.category as Persona['category'],
      isGenerated: true,
    };

    // Add to all personas list
    setAllPersonas(prev => [...prev, newPersona]);
    
    // Clear search and hide dropdown
    setSearchTerm('');
    setShowAiDropdown(false);
    setAiPersonas([]);
    
    // Select the persona
    onPersonaSelect(newPersona);
  };

  const clearCustomPersonas = () => {
    setAllPersonas([...PERSONAS]);
    localStorage.removeItem('persona-chat-custom-personas');
  };

  const filteredPersonas = allPersonas.filter((persona) => {
    const matchesCategory = selectedCategory === 'all' || persona.category === selectedCategory;
    const matchesSearch = persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         persona.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            {CATEGORIES.map((category) => (
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

          <div className="w-full lg:w-auto lg:min-w-64 relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search or describe a persona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              />
              {isGenerating && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
              )}
            </div>

            {/* AI Personas Dropdown */}
            {showAiDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {isGenerating && (
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span className="text-sm">Generating personas...</span>
                    </div>
                  </div>
                )}

                {generationError && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-destructive">{generationError}</p>
                  </div>
                )}

                {!isGenerating && !generationError && aiPersonas.length > 0 && (
                  <>
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Generated Personas
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click any persona to add it and start chatting
                      </p>
                    </div>
                                         <div className="py-2">
                       {aiPersonas.map((persona, index) => {
                         const existingPersona = allPersonas.find(p => 
                           p.name.toLowerCase() === persona.name.toLowerCase()
                         );
                         
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
                                   {existingPersona ? (
                                     <span className="text-xs text-muted-foreground">Added</span>
                                   ) : (
                                     <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                   )}
                                 </div>
                               </div>
                               <p className="text-xs text-muted-foreground group-hover:text-foreground line-clamp-2">
                                 {persona.description}
                               </p>
                             </div>
                           </button>
                         );
                       })}
                     </div>
                  </>
                )}

                {!isGenerating && !generationError && aiPersonas.length === 0 && searchTerm.length >= 3 && (
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
                  <div className="flex items-center gap-1">
                                         {persona.isGenerated && (
                       <Sparkles className="h-3 w-3 text-primary" />
                     )}
                    <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground capitalize self-start">
                      {persona.category}
                    </span>
                  </div>
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

        {filteredPersonas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No personas found matching your criteria.</p>
            <div className="flex gap-2 justify-center mt-2">
              <Button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                variant="outline"
              >
                Clear filters
              </Button>
              {allPersonas.some(p => p.isGenerated) && (
                <Button
                  onClick={clearCustomPersonas}
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                >
                  Reset AI Personas
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaSelector; 