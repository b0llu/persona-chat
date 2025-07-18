import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Persona } from '../../types';
import { personaService } from '../../services/personaService';
import { Plus, Loader2, Search } from 'lucide-react';
import PersonaSearchModal from './PersonaSearchModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

interface PersonaSelectorProps {
  onPersonaSelect: (persona: Persona) => void;
}

const PersonaSelector = ({ onPersonaSelect }: PersonaSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([
    { id: 'all', name: 'All Personas' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load personas from Firebase on component mount
  useEffect(() => {
    const loadPersonasFromFirebase = async () => {
      setIsLoading(true);
      try {
        const personas = await personaService.loadPersonas();
        setAllPersonas(personas);
        
        // Build categories dynamically based on existing personas
        const existingCategories = new Set(personas.map(p => p.category.toLowerCase()));
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

  // Handle new persona added from modal
  const handlePersonaAdded = (newPersona: Persona) => {
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
  };

  const filteredPersonas = allPersonas.filter((persona) => {
    const matchesCategory = selectedCategory === 'all' || persona.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      persona.description.toLowerCase().includes(searchTerm.toLowerCase());
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
              Browse and search existing personas or create new ones with AI
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">📋 Browse existing personas</span>
              <span className="bg-muted px-2 py-1 rounded">🔍 Search & filter personas</span>
              <span className="bg-muted px-2 py-1 rounded">✨ Add new personas with AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex-shrink-0">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 text-foreground">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="text-foreground">
                {allCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-foreground">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <Button 
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Persona
            </Button>
            <div className="relative flex-1 lg:min-w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              <Input
                type="text"
                placeholder="Search personas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredPersonas.map((persona) => (
            <div
              key={persona.id}
              onClick={() => onPersonaSelect(persona)}
              className="relative bg-card rounded-xl border-2 border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer touch-manipulation aspect-square overflow-hidden"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${persona.avatar})`
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

        {filteredPersonas.length === 0 && !isLoading && (
          <div className="text-center py-12 space-y-4">
            <div className="space-y-2">
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-semibold text-foreground">No Matching Personas</h3>
                  <p className="text-muted-foreground">
                    No personas match "{searchTerm}" in the {selectedCategory === 'all' ? 'all categories' : selectedCategory + ' category'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try a different search term or create a new persona with AI
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-foreground">No Personas Yet</h3>
                  <p className="text-muted-foreground">
                    {selectedCategory === 'all' 
                      ? "Start by adding a persona you'd like to chat with"
                      : `No personas in the ${selectedCategory} category yet`
                    }
                  </p>
                </>
              )}
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2 ml-auto mr-auto"
            >
              <Plus className="h-4 w-4" />
              {searchTerm ? 'Create New Persona' : 'Add Your First Persona'}
            </Button>
          </div>
        )}
      </div>

      {/* Persona Search Modal */}
      <PersonaSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPersonaSelect={onPersonaSelect}
        existingPersonas={allPersonas}
        onPersonaAdded={handlePersonaAdded}
      />
    </div>
  );
};

export default PersonaSelector; 