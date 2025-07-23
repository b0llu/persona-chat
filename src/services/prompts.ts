// AI Prompts for Persona Generation and Search

export const CONTENT_GUIDELINES = `
CRITICAL CONTENT GUIDELINES - STRICTLY ENFORCE:
1. NEVER suggest generic roles/occupations as personas (e.g., "Doctor", "Teacher", "Artist", "Engineer").
2. ONLY suggest specific, named individuals - real people, fictional characters, historical figures, etc.
3. ABSOLUTELY NO adult content creators, pornographic actors, or sexually explicit personas.
4. ALLOW world-renowned, prominent figures even if they are controversial, but STRICTLY EXCLUDE those known primarily for severe criminal activity or hate speech.
5. NO objectifying or sexualized personas regardless of search term.
6. If the search term relates to inappropriate content, pivot to wholesome alternatives in the same general category.

APPROPRIATE PERSONA TYPES:
- Well-known fictional characters from books, movies, TV shows, games, anime/manga
- Historical figures known for positive contributions (scientists, inventors, explorers, artists)
- Contemporary figures with positive public personas (actors, musicians, athletes, educators)
- Mythological or legendary figures from various cultures
- Beloved animated or comic book characters`;

export const PERSONA_CATEGORIES = `[
    "Historical Figure",
    "Contemporary Figure", 
    "Celebrity",
    "Fictional Character",
    "Mythological Figure",
    "Literary Figure",
    "Politician/World Leader",
    "Scientist/Inventor",
    "Artist/Creator",
    "Business/Entrepreneur",
    "AI/Virtual Persona",
    "Pop Culture/Meme",
    "Finance Expert",
    "Investor/Trader",
    "Anime Character",
    "Manga Character",
    "Video Game Character",
    "Comic Book Character",
    "Cartoon Character",
    "Media Personality",
    "Sports Personality",
    "Influencer",
    "Philosopher",
    "Educator/Teacher",
    "Medical Professional",
    "Legal Professional",
    "Tech Innovator",
    "Fictional Creature",
    "Superhero/Villain"
  ]`;

export const generatePersonasPrompt = (searchTerm: string): string => {
  return `You are generating personas for a family-friendly chat application. Generate up to 5 appropriate personas related to or exactly named "${searchTerm}".

${CONTENT_GUIDELINES}

For each persona, provide:
- name: The full name of the specific person/character (NEVER just a role/occupation)
- description: A brief, family-friendly description (1-2 sentences) focusing on positive traits
- category: Choose from these categories: ${PERSONA_CATEGORIES}

If the search term "${searchTerm}" refers to inappropriate content or figures, suggest wholesome alternatives instead. For example:
- If searching for adult content, suggest popular fictional characters or celebrities
- If searching for harmful historical figures, suggest positive historical figures instead
- If searching for generic roles, suggest specific famous people in those fields

Format your response as a JSON array of objects with these exact properties. Ensure all personas are appropriate for all ages and positive role models.

Example format:
[
  {
    "name": "Albert Einstein",
    "description": "Brilliant physicist known for the theory of relativity and his contributions to science.",
    "category": "Historical Figure"
  }
]

Only return the JSON array, no additional text.`;
};

export const intelligentPersonaSearchPrompt = (searchQuery: string, existingPersonasList: string): string => {
  return `You are helping to find exactly 3 appropriate personas for a family-friendly chat application related to the search query: "${searchQuery}"

Here are the existing personas we already have:
${existingPersonasList}

${CONTENT_GUIDELINES}

Task: 
Analyze the search query "${searchQuery}" and decide:
1. Which existing personas (if any) are closely related and appropriate to include
2. Generate new family-friendly personas to fill any remaining slots to reach exactly 3 total personas

For any new personas you generate, they should be:
- Specific named individuals (NEVER generic roles)
- Related to "${searchQuery}" but appropriate for all ages
- Real world people, fictional characters, or historical figures with positive contributions
- Diverse and interesting to chat with
- Have engaging, wholesome personalities

If the search query "${searchQuery}" relates to inappropriate content, suggest wholesome alternatives in the same general category instead.

Return your response as a JSON object with this format:
{
  "useExisting": [list of existing persona names that match well],
  "generateNew": [
    {
      "name": "Full name of specific person/character",
      "description": "Brief family-friendly description (1-2 sentences) focusing on positive traits",
      "category": "appropriate category from the list"
    }
  ]
}

CRITICAL: The total count of useExisting + generateNew MUST equal exactly 3. If you can't find 3 relevant existing personas, generate more new ones to reach exactly 3 total. All personas must be appropriate for all ages.

Categories: ${PERSONA_CATEGORIES}

Only return the JSON object, no additional text.`;
};

export const generatePersonaImagePrompt = (personaName: string, personaDescription: string): string => {
  return `Simple, photorealistic portrait of ${personaName}, accurately depicting ${personaDescription}. Prioritize clear recognition. Plain background, subtle lighting. Optimized for web, strictly 1:1 aspect ratio (square image). No text, no watermark, no logos.`;
};