# MCP Inspector Frontend

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This project is the frontend for the MCP Inspector, a tool for inspecting and interacting with Model Context Protocol (MCP) servers.

## Configuration

Before running the application, you need to configure the following environment variables:

- `NEXT_PUBLIC_MCP_SERVER_URL`: The URL of the MCP server to connect to.
- `NEXT_PUBLIC_OPEN_AI_COMPATIBLE`: The URL of an OpenAI-compatible API endpoint.
- `NEXT_PUBLIC_GEMINI_API_KEY`: Your Gemini API key.

Create a `.env.local` file in the root of the project and add the following:

```
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001/sse
NEXT_PUBLIC_OPEN_AI_COMPATIBLE=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Dependencies

This project uses the following dependencies:

- [Next.js](https://nextjs.org) - The React Framework for Production
- [Shadcn UI](https://ui.shadcn.com/) - Re-usable components
- [Supabase](https://supabase.com/) - Open Source Firebase Alternative
- [Typescript](https://www.typescriptlang.org/) - JavaScript with syntax for types.
- [Yarn](https://yarnpkg.com/) - Package manager
