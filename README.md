# Advanced AI Chat Companion

A sophisticated AI chat implementation built with Next.js and TypeScript, featuring context awareness, knowledge base integration, and natural conversation flow.

## Features

- 🧠 Context-aware conversations
- 📚 Integrated knowledge base
- 💭 Memory management
- 🗣️ Natural language processing
- ⚡ Real-time streaming responses
- 🎯 Topic tracking
- 🔄 Conversation state management

## Tech Stack

- Next.js 14
- TypeScript
- Mistral AI
- Prisma (for memory storage)
- Stream API

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/melihcanndemir/ai_companion_chat.git
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Update the following variables in `.env.local`:
```bash
API_ENDPOINT=your_api_endpoint
MEMORY_ENDPOINT=your_memory_endpoint
```

5. Run the development server
```bash
npm run dev
```

## Configuration

The chat companion can be customized by modifying:
- Knowledge base (`knowledge_base.json`)
- Personality traits (`personality.json`)
- System prompts (`prompts.json`)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Next.js team
- Mistral AI for the language model
- All contributors

## Note

This is an advanced implementation meant for educational purposes. Please ensure you have the necessary rights and permissions before deploying in a production environment.
