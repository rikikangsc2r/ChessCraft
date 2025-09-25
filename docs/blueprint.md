# **App Name**: ChessCraft

## Core Features:

- Realtime Multiplayer Chess: Play chess online with other users using Firebase Realtime Database for synchronized game state.
- Room System with Expiry: Create and join chess rooms, with automatic deletion after one hour of inactivity.
- Local Storage Persistence: Remember username and room details using localStorage for convenient access.
- Offline Play: Play chess against yourself using chessboard.js and chess.js, even without an internet connection. Moves do not sync.
- Move Validation: Validate legal moves using chess.js library to enforce the rules of chess.
- Move Highlighting: Highlight legal moves and last move played for better game visibility. Uses chessboard.js's square styling and chess.js for possible moves.
- Username Generation: Suggest a username based on the user's device, powered by a generative AI tool.

## Style Guidelines:

- Primary color: Forest green (#388E3C) to evoke a sense of strategy, nature, and focused gameplay.
- Background color: Light grey (#F5F5F5) for a clean and neutral backdrop, reducing distractions.
- Accent color: Deep orange (#E65100) to draw attention to important actions such as move confirmations.
- Body text: 'PT Sans' (sans-serif), for readability. Headlines: 'Playfair' (serif), for a sophisticated touch.
- Note: currently only Google Fonts are supported.
- Use simple, recognizable icons from a library like FontAwesome for game actions and settings.
- Mobile-first responsive design using TailwindCSS grid and flexbox for optimal viewing on different screen sizes.
- Subtle transitions and animations for move confirmations and UI feedback to improve user experience.