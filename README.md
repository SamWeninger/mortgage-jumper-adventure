# Mortgage Jumper Adventure

A fun platformer game where you navigate through financial obstacles while trying to maintain your savings! Jump over market crashes, avoid luxury purchases, and collect financial bonuses to reach the finish line with your wealth intact.

🎮 [Play the game now!](https://mortgagejumper.netlify.app/game)

## Game Instructions

- **Controls**:
  - Left Arrow: Move left
  - Right Arrow: Move right
  - Up Arrow: Jump
  - P: Pause/Unpause game

- **Objectives**:
  - Start with $1000
  - Collect coins ($100 each)
  - Grab mystery boxes for financial bonuses ($750-$1000)
  - Avoid red market crash arrows (cost $1000)
  - Dodge orange luxury purchase boxes (cost $500)
  - Reach the checkered flag to win!
  - Don't fall into gaps or run out of money!

## Project Setup

### Prerequisites
- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Git

### Local Development

1. Clone the repository:
```sh
git clone <https://github.com/SamWeninger/mortgage-jumper-adventure.git>
```

2. Navigate to project directory:
```sh
cd mortgage-jumper-adventure
```

3. Install dependencies:
```sh
npm install
```

4. Start development server:
```sh
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:5173
```

### Testing

To test the game locally:

1. Ensure the development server is running
2. Use arrow keys to control the character
3. Test collision detection with:
   - Platforms (landing and falling)
   - Collectibles (coins and powerups)
   - Obstacles (market crashes and luxury items)
4. Verify game states:
   - Pause/unpause functionality
   - Game over conditions (falling/no money)
   - Victory condition (reaching finish line)
   - Score calculation
   - Money tracking

## Technologies Used

This project is built with:
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

You can deploy this project in two ways:

1. **Via Lovable**:
   - Visit [Lovable Project](https://lovable.dev/projects/0f787099-4028-42ea-bdfd-f9c642802304)
   - Click on Share -> Publish

2. **Custom Domain**:
   - While not directly supported through Lovable, you can deploy via Netlify
   - See [Custom domains documentation](https://docs.lovable.dev/tips-tricks/custom-domain/) for details

## Development Options

1. **Use Lovable**:
   - Visit the [Lovable Project](https://lovable.dev/projects/0f787099-4028-42ea-bdfd-f9c642802304)
   - Changes are automatically committed

2. **Use your IDE**:
   - Clone and work locally
   - Push changes to reflect in Lovable

3. **Edit in GitHub**:
   - Edit files directly through GitHub interface
   - Use the pencil icon to make changes

4. **Use GitHub Codespaces**:
   - Launch a new codespace from repository
   - Edit and commit directly in the browser
