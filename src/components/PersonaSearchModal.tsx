import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Persona } from '../types';
import { generatePersonas } from '../services/geminiService';
import { personaService } from '../services/personaService';
import { mixpanelService } from '../services/mixpanelService';
import { useAuth } from '../hooks/useAuth';
import { Search, Sparkles, Plus, Loader2 } from 'lucide-react';
import { imageService } from '../services/imageService';

interface PersonaSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonaSelect: (persona: Persona) => void;
  existingPersonas: Persona[];
  onPersonaAdded: (persona: Persona) => void;
}

const PersonaSearchModal = ({ 
  isOpen, 
  onClose, 
  onPersonaSelect, 
  existingPersonas,
  onPersonaAdded 
}: PersonaSearchModalProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [aiPersonas, setAiPersonas] = useState<Array<{
    name: string;
    description: string;
    category: string;
  }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCreatingPersona, setIsCreatingPersona] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  // Generate AI personas function
  const generateAiPersonas = useCallback(async (term: string) => {
    if (term.trim().length >= 3) {
      setIsGenerating(true);
      setGenerationError(null);
      setHasSearched(true);

      try {
        const personas = await generatePersonas(term);
        setAiPersonas(personas);
      } catch (error) {
        setGenerationError(error instanceof Error ? error.message : 'Failed to generate personas');
        setAiPersonas([]);
      } finally {
        setIsGenerating(false);
      }
    }
  }, []);

  // Handle Enter key press for search
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (searchTerm.trim()) {
        generateAiPersonas(searchTerm);
      }
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchTerm.trim()) {
      generateAiPersonas(searchTerm);
    }
  };

  const handleAiPersonaSelect = async (aiPersona: { name: string; description: string; category: string }) => {
    setIsCreatingPersona(true);
    setCreationError(null);
    try {
      // Step 1: Generate image prompt
      const prompt = `A portrait of ${aiPersona.name}, ${aiPersona.description}, in a modern digital art style, must be a portrait, no text, no watermark, centered, high quality`;
      let avatarUrl = '';
      try {
        // Step 2: Generate image
        const imageDataUrl = await imageService.generateImage({ prompt });
        // Step 3: Upload to Cloudinary
        avatarUrl = await imageService.uploadToCloudinary(imageDataUrl);
      } catch (imgErr) {
        console.error('Persona image generation/upload failed:', imgErr);
        // Fallback: leave avatarUrl as empty string
      }

      const newPersona: Persona = {
        id: `ai-${Date.now()}-${aiPersona.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: aiPersona.name,
        description: aiPersona.description,
        avatar: avatarUrl,
        category: aiPersona.category as Persona['category']
      };

      // Save to Firebase with user ID for analytics
      const saved = await personaService.savePersona(newPersona, user?.uid);
      
      if (saved) {
        // Track persona creation in Mixpanel
        mixpanelService.trackPersonaAdded(newPersona, user?.uid);
        
        // Notify parent component about the new persona
        onPersonaAdded(newPersona);
        
        // Clear search and close modal
        setSearchTerm('');
        setAiPersonas([]);
        setHasSearched(false);
        onClose();
        
        // Select the persona
        onPersonaSelect(newPersona);
      } else {
        setCreationError('Failed to save persona to Firebase');
        console.error('Failed to save persona to Firebase');
      }
    } catch (error) {
      setCreationError('Error handling AI persona selection');
      console.error('Error handling AI persona selection:', error);
    } finally {
      setIsCreatingPersona(false);
    }
  };

  // Filter existing personas that match search
  const filteredExistingPersonas = existingPersonas.filter(persona =>
    searchTerm && (
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Handle modal close
  const handleClose = () => {
    setSearchTerm('');
    setAiPersonas([]);
    setHasSearched(false);
    setGenerationError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Add New Persona
          </DialogTitle>
          <DialogDescription>
            Enter the name or description of a persona you'd like to chat with. Our AI will create new personas for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Enter name or description (e.g., 'Einstein', 'A wise mentor', 'Friendly chef')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="min-h-[80px] resize-none text-foreground"
              rows={3}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleSearchClick}
                disabled={!searchTerm.trim() || isGenerating}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isGenerating ? 'Searching...' : 'Search'}
              </Button>
              <div className="text-xs text-muted-foreground flex items-center">
                Press Enter to search
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {isCreatingPersona && (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Creating persona...</span>
                </div>
              </div>
            )}
            {creationError && (
              <div className="text-center py-4">
                <p className="text-sm text-destructive">{creationError}</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Sparkles className="h-5 w-5 animate-pulse text-primary" />
                  <span>AI is creating new personas for you...</span>
                </div>
              </div>
            )}

            {generationError && (
              <div className="text-center py-4">
                <p className="text-sm text-destructive">{generationError}</p>
              </div>
            )}

            {!isGenerating && !generationError && hasSearched && (
              <div className="space-y-4">
                {/* Existing personas that match search */}
                {filteredExistingPersonas.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
                      <Search className="h-4 w-4 text-primary" />
                      Found Existing Personas
                    </div>
                    <div className="grid gap-2">
                      {filteredExistingPersonas.map((persona) => (
                        <button
                          key={persona.id}
                          onClick={() => {
                            onPersonaSelect(persona);
                            handleClose();
                          }}
                          className="w-full p-3 hover:bg-accent text-left transition-colors duration-200 group rounded-lg border border-border"
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
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground group-hover:text-foreground line-clamp-2">
                              {persona.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI generated personas */}
                {aiPersonas.length > 0 && (
                  <div className="space-y-3">
                    {filteredExistingPersonas.length > 0 && <div className="border-b border-border" />}
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      New AI Generated Personas
                    </div>
                    <div className="grid gap-2">
                      {aiPersonas.map((persona, index) => {
                        const existingPersona = existingPersonas.find(p => 
                          p.name.toLowerCase() === persona.name.toLowerCase()
                        );
                        
                        // Don't show AI personas that already exist
                        if (existingPersona) return null;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleAiPersonaSelect(persona)}
                            className="w-full p-3 hover:bg-accent text-left transition-colors duration-200 group rounded-lg border border-border"
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
                    </div>
                  </div>
                )}

                {/* No results found */}
                {filteredExistingPersonas.length === 0 && aiPersonas.length === 0 && searchTerm.length >= 3 && (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-sm text-muted-foreground">No personas found for "{searchTerm}"</p>
                    <p className="text-xs text-muted-foreground">Try a different search term or description</p>
                  </div>
                )}

                {/* Search term too short */}
                {searchTerm.length > 0 && searchTerm.length < 3 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Type at least 3 characters to search</p>
                  </div>
                )}
              </div>
            )}

            {/* Initial state */}
            {!hasSearched && !isGenerating && (
              <div className="text-center py-8 space-y-3">
                <div className="text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm">Enter a persona name or description above</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => setSearchTerm('Einstein')}
                      className="bg-muted px-3 py-1 rounded-full text-xs hover:bg-accent transition-colors"
                    >
                      Einstein
                    </button>
                    <button
                      onClick={() => setSearchTerm('Shakespeare')}
                      className="bg-muted px-3 py-1 rounded-full text-xs hover:bg-accent transition-colors"
                    >
                      Shakespeare
                    </button>
                    <button
                      onClick={() => setSearchTerm('Friendly chef')}
                      className="bg-muted px-3 py-1 rounded-full text-xs hover:bg-accent transition-colors"
                    >
                      Friendly chef
                    </button>
                    <button
                      onClick={() => setSearchTerm('Wise mentor')}
                      className="bg-muted px-3 py-1 rounded-full text-xs hover:bg-accent transition-colors"
                    >
                      Wise mentor
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      {/* Disclaimer about persona images */}
      <div className="px-6 pb-4 pt-2 text-xs text-muted-foreground text-center">
        <span className="inline-block bg-muted/60 rounded px-2 py-1">
          Persona images are AI-generated and for reference only. They do not represent real people or characters.
        </span>
      </div>
    </Dialog>
  );
};

export default PersonaSearchModal; 