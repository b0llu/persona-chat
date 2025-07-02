import { useState } from 'react';
import { Button } from './ui/button';
import { Persona } from '../types';

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
  { id: 'all', name: 'All Personas', emoji: '🌟' },
  { id: 'celebrity', name: 'Celebrities', emoji: '⭐' },
  { id: 'anime', name: 'Anime', emoji: '🎌' },
  { id: 'cartoon', name: 'Cartoons', emoji: '🎭' },
  { id: 'historical', name: 'Historical', emoji: '📚' },
  { id: 'fictional', name: 'Fictional', emoji: '🦸' },
];

const PersonaSelector = ({ onPersonaSelect }: PersonaSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPersonas = PERSONAS.filter((persona) => {
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
            Select from our diverse collection of personas to start an engaging conversation.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {CATEGORIES.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              variant="outline"
              className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 py-2 h-9 ${
                selectedCategory === category.id
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              <span className="text-sm">{category.emoji}</span>
              <span className="hidden sm:inline">{category.name}</span>
            </Button>
          ))}
        </div>

        <div className="w-full">
          <input
            type="text"
            placeholder="Search personas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-muted border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-base"
          />
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

        {filteredPersonas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No personas found matching your criteria.</p>
            <Button
              onClick={() => {
                setSelectedCategory('all');
                setSearchTerm('');
              }}
              variant="outline"
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaSelector; 