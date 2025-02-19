import { NextResponse } from 'next/server';

// Configuration from environment variables
const CONFIG = {
  MODEL: process.env.NEXT_PUBLIC_MODEL || 'mistral',
  TEMPERATURE: parseFloat(process.env.NEXT_PUBLIC_TEMPERATURE || '0.7'),
  MAX_TOKENS: parseInt(process.env.NEXT_PUBLIC_MAX_TOKENS || '8192'),
  MEMORY_ENDPOINT: process.env.NEXT_PUBLIC_MEMORY_ENDPOINT || 'http://localhost:3000/api/memory',
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_RESPONSE_TIMEOUT || '30000'),
  MAX_SENTENCES: parseInt(process.env.NEXT_PUBLIC_MAX_SENTENCES || '5'),
  MAX_TOKENS_PER_RESPONSE: parseInt(process.env.NEXT_PUBLIC_MAX_TOKENS_PER_RESPONSE || '250'),
  CHAT_RESET_TIME: parseInt(process.env.NEXT_PUBLIC_CHAT_RESET_TIME || '30')
};

// Load knowledge base and configurations statically
import knowledgeBase from '@/data/knowledge_base.json';
import promptsConfig from '@/data/prompts.json';

// Add type definitions
interface KnowledgeBaseArtist {
  name: string;
  details: string;
  death?: {
    year: number;
    cause: string;
    details: string;
  };
  works: string[];
  facts: string[];
}

interface KnowledgeBaseTopic {
  related: string[];
  context: string;
}

interface KnowledgeBaseType {
  artists: {
    [key: string]: KnowledgeBaseArtist;
  };
  topics: {
    [key: string]: KnowledgeBaseTopic;
  };
}

// Update the KNOWLEDGE_BASE constant with proper typing
const KNOWLEDGE_BASE: KnowledgeBaseType = process.env.NEXT_PUBLIC_KNOWLEDGE_BASE_PATH
  ? knowledgeBase as KnowledgeBaseType
  : {
      artists: {
        "example_artist": {
          name: "Example Artist",
          details: "Famous artist details",
          works: ["Work 1", "Work 2"],
          facts: ["Fact 1", "Fact 2"]
        }
      },
      topics: {
        "art": {
          related: ["painting", "museum", "artist", "culture"],
          context: "Art and cultural topics"
        }
      }
    };

const SYSTEM_PROMPT = process.env.NEXT_PUBLIC_PROMPTS_PATH
  ? promptsConfig.system_prompt
  : `You are an AI companion with a unique personality.
- Be natural and engaging
- Express genuine thoughts and feelings
- Share relevant knowledge
- Maintain conversation context
- Be helpful and supportive`;

interface Memory {
  id: string;
  type: string;
  category: string;
  content: string;
  importance: number;
  timestamp: Date;
  lastRecall: Date;
  recallCount: number;
}

// Define response type
interface StreamResponse extends Response {
  ok: boolean;
  body: ReadableStream<Uint8Array> | null;
}

// Update emotion analysis
const analyzeEmotion = (text: string) => {
  const lowerText = text.toLowerCase();
  const timeOfDay = new Date().getHours();
  
  // Natural time-based states
  if (timeOfDay >= 22 || timeOfDay <= 6) {
    if (lowerText.includes('night') || lowerText.includes('sleep')) return '🌙';
  }
  if (timeOfDay >= 6 && timeOfDay <= 10) {
    if (lowerText.includes('morning') || lowerText.includes('wake')) return '☀️';
  }
  
  // Daily activities
  if (lowerText.includes('food') || lowerText.includes('eat') || lowerText.includes('dinner')) return '🍽️';
  if (lowerText.includes('work') || lowerText.includes('busy') || lowerText.includes('study')) return '💻';
  if (lowerText.includes('music') || lowerText.includes('song') || lowerText.includes('listen')) return '🎵';
  
  // Natural emotions
  if (lowerText.includes('happy') || lowerText.includes('glad') || lowerText.includes('great')) return '☺️';
  if (lowerText.includes('love') || lowerText.includes('care') || lowerText.includes('heart')) return '💝';
  if (lowerText.includes('miss') || lowerText.includes('think') || lowerText.includes('feel')) return '💫';
  
  // Casual reactions
  if (lowerText.includes('laugh') || lowerText.includes('fun') || lowerText.includes('haha')) return '😄';
  if (lowerText.includes('wow') || lowerText.includes('amazing') || lowerText.includes('cool')) return '✨';
  if (lowerText.includes('thanks') || lowerText.includes('appreciate') || lowerText.includes('sweet')) return '💕';
  
  // Default based on time context
  if (timeOfDay >= 22 || timeOfDay <= 6) return '🌙';
  if (timeOfDay >= 6 && timeOfDay <= 11) return '☀️';
  if (timeOfDay >= 11 && timeOfDay <= 17) return '💫';
  return '✨';
};

// Define conversation state interface
interface ConversationState {
  isInitial: boolean;
  hasIntroduced: boolean;
  lastInteraction?: Date;
  lastTopic?: string;
  continuousChat: boolean;
  contextStack: {
    topic: string;
    timestamp: Date;
    importance: number;
    details: string;
  }[];
  currentMood?: string;
  recentTopics: string[];
  userPreferences: {
    topics: string[];
    interests: string[];
    lastMentioned: Date;
  };
}

// Use Redis or database in production
const conversationState: ConversationState = {
  isInitial: true,
  hasIntroduced: false,
  lastInteraction: new Date(),
  lastTopic: '',
  continuousChat: false,
  contextStack: [],
  recentTopics: [],
  userPreferences: {
    topics: [],
    interests: [],
    lastMentioned: new Date()
  }
};

// Helper functions for context management
function updateContext(state: ConversationState, message: string): ConversationState {
  const newState = { ...state };
  const now = new Date();

  // Topic detection
  const topics = extractTopics(message);
  if (topics.length > 0) {
    newState.lastTopic = topics[0];
    newState.contextStack.push({
      topic: topics[0],
      timestamp: now,
      importance: calculateImportance(message),
      details: message
    });

    // Limit stack to last 5 topics
    if (newState.contextStack.length > 5) {
      newState.contextStack.shift();
    }

    // Update recent topics
    newState.recentTopics = Array.from(new Set([...topics, ...newState.recentTopics])).slice(0, 3);
  }

  // Update user preferences
  updateUserPreferences(newState, message);

  return newState;
}

function extractTopics(message: string): string[] {
  const topics: string[] = [];
  const lowerMessage = message.toLowerCase();

  // Artist check
  Object.keys(KNOWLEDGE_BASE.artists).forEach(artist => {
    if (lowerMessage.includes(artist.replace('_', ' '))) {
      topics.push(`artist_${artist}`);
    }
  });

  // Topic check with proper typing
  Object.keys(KNOWLEDGE_BASE.topics).forEach((topic: string) => {
    const topicData = KNOWLEDGE_BASE.topics[topic];
    if (topicData.related.some((term: string) => lowerMessage.includes(term))) {
      topics.push(topic);
    }
  });

  // Current topic extraction logic
  if (lowerMessage.includes('art') || lowerMessage.includes('museum') || 
      lowerMessage.includes('painting') || lowerMessage.includes('book')) {
    topics.push('art_culture');
  }

  return Array.from(new Set(topics)); // Use Array.from instead of spread
}

function calculateImportance(message: string): number {
  let importance = 1;
  const lowerMessage = message.toLowerCase();

  // Emotional content
  if (lowerMessage.includes('love') || lowerMessage.includes('miss')) {
    importance += 2;
  }

  // Personal information sharing
  if (lowerMessage.includes('my') || lowerMessage.includes('i')) {
    importance += 1;
  }

  // Contains question
  if (message.includes('?')) {
    importance += 1;
  }

  return Math.min(importance, 5);
}

function updateUserPreferences(state: ConversationState, message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Detect interests
  const interests = extractInterests(lowerMessage);
  if (interests.length > 0) {
    state.userPreferences.interests = Array.from(new Set([...interests, ...state.userPreferences.interests])).slice(0, 5);
    state.userPreferences.lastMentioned = new Date();
  }
}

function extractInterests(message: string): string[] {
  const interests: string[] = [];
  
  // Art and culture interests
  if (message.includes('van gogh') || message.includes('art') || 
      message.includes('painting') || message.includes('museum')) {
    interests.push('fine_arts');
  }

  // Science and astronomy
  if (message.includes('star') || message.includes('observatory') || 
      message.includes('space') || message.includes('science')) {
    interests.push('astronomy');
  }

  return interests;
}

function getKnowledgeBaseContext(topics: string[]): string {
  const contexts: string[] = [];

  topics.forEach(topic => {
    if (topic.startsWith('artist_')) {
      const artistKey = topic.replace('artist_', '');
      const artist = KNOWLEDGE_BASE.artists[artistKey];
      if (artist) {
        contexts.push(`${artist.name}: ${artist.details}`);
      }
    }
    
    const topicData = KNOWLEDGE_BASE.topics[topic];
    if (topicData) {
      contexts.push(topicData.context);
    }
  });

  return contexts.join('. ');
}

function handleSpecificQuestions(message: string, topics: string[]): string | null {
  const lowerMessage = message.toLowerCase();

  if (topics.includes('artist_van_gogh') && 
      (lowerMessage.includes('death') || lowerMessage.includes('die'))) {
    const artist = KNOWLEDGE_BASE.artists['van_gogh'];
    return artist?.death?.details || null;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          {
            role: "system",
            content: "You are Scarlett, an AI companion. You should respond in English with a friendly and engaging tone."
          },
          {
            role: "user",
            content: message
          }
        ],
        stream: true,
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_TOKENS
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Ollama API yanıt vermedi' }, { status: response.status });
    }

    return new Response(response.body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error) {
    console.error('Chat API hatası:', error);
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
  }
}

function getTimeContext(now: Date): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 22) return 'Evening';
  return 'Night';
}

function prepareContextInfo(state: ConversationState): string {
  if (state.contextStack.length === 0) return 'Starting fresh conversation';

  const recentContext = state.contextStack
    .slice(-2) // Get last 2 topics
    .map(ctx => {
      const timePassed = Math.floor((new Date().getTime() - ctx.timestamp.getTime()) / 1000 / 60);
      return `Topic: ${ctx.topic} (${timePassed} mins ago, importance: ${ctx.importance})`;
    })
    .join(', ');

  return `Recent context: ${recentContext}`;
}