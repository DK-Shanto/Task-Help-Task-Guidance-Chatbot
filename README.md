# Task chatbot

A standalone demo. Existing microservices are not modified or called.

## Run

Install Node.js if it is not already available. In this folder, run:

    node server.js

Open http://localhost:3000 in your browser. No npm install, API key, or database is needed. The server listens only on this computer. Stop it with Ctrl+C.

## Feed it task instructions

Edit knowledge.json. Each entry has a unique id, category, question, alternative phrases, and answer. Put approved step-by-step instructions in answer. Use \n for line breaks inside JSON strings. Save the file; the next question uses the updated content without restarting.

The supplied project and file entries are placeholders, not verified task instructions. Replace them before using this with real users. No live FAQ database was inspected or imported.

## How it works

The server matches words against saved questions and alternative phrases, then returns the saved answer. Similar matches show choices. Unknown questions receive a fallback. It does not generate new instructions or execute tasks. Add alternative phrases when users ask the same question differently. This basic matcher does not understand unrestricted natural language or follow-up context.

## Later integration

Once the guides are ready, the existing faq-service can become the source of questions and answers. This demo intentionally uses a local file to keep setup simple. Shared deployment would need the application's existing authentication and permission checks.
