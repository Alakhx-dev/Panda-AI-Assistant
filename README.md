# Panda AI - Intelligent Study Assistant

Your AI-powered study companion that helps you learn smarter, not harder.

## Features

- **Natural Conversations** – Chat naturally and get intelligent, tailored responses
- **Step-by-Step Learning** – Complex topics broken down into clear, digestible explanations
- **Private & Secure** – Your conversations are encrypted and never shared
- **Chat History** – Your conversations are saved and organized per user
- **Real-time Streaming** – AI responses stream in real-time for a fluid experience

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Gemini via streaming API
- **Animations**: Framer Motion

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## License

MIT
