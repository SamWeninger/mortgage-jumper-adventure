
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import PauseMenu from './PauseMenu';
import GameOverScreen from './GameOverScreen';
import GameLegend from './GameLegend';
import { Clock } from 'lucide-react';

// Game sprites and assets would be imported here in a real implementation
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const LEVEL_LENGTH_MULTIPLIER = 5; // Increased from 3 to 5 for longer level

interface GameEngineProps {
  onExit: () => void;
}

// Define the finishLine type
interface FinishLine {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GameEngine: React.FC<GameEngineProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const { toast } = useToast();
  
  // Game state
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [money, setMoney] = useState(1000); // Starting money
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100); // 100 second timer
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // Create a ref for gameState to prevent stale closures in animation loop
  const gameStateRef = useRef({
    player: {
      x: 50,
      y: GAME_HEIGHT - 80,
      width: 40,
      height: 60,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isDucking: false
    },
    platforms: [
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH * LEVEL_LENGTH_MULTIPLIER, height: 20 }
    ],
    coins: [] as any[],
    powerups: [] as any[],
    enemies: [] as any[],
    finishLine: {
      x: GAME_WIDTH * LEVEL_LENGTH_MULTIPLIER - 100, 
      y: GAME_HEIGHT - 80, 
      width: 50, 
      height: 60 
    } as FinishLine,
    camera: {
      x: 0,
      y: 0
    },
    levelLength: GAME_WIDTH * LEVEL_LENGTH_MULTIPLIER,
    gravity: 0.6,
    background: {
      far: { x: 0 },
      mid: { x: 0 },
      near: { x: 0 }
    },
    collectedCoins: 0,
    collectedPowerups: 0,
    gameCompleted: false, // Flag to track if the game is completed
    gameStarted: false // Flag to track if the game has started
  });
  
  // Use a separate state to trigger re-renders
  const [gameState, setGameState] = useState(gameStateRef.current);
  
  // Keyboard state as a ref to prevent stale closures
  const keys = useRef({
    left: false,
    right: false,
    up: false,
    down: false
  });
  
  // Helper function to calculate current money and score
  const calculateCurrentMoney = () => {
    return 1000 + 
      (gameStateRef.current.collectedCoins * 100) + 
      (gameStateRef.current.collectedPowerups * 500) - 
      gameStateRef.current.enemies.filter(e => e.hit).reduce((sum, e) => sum + e.value, 0);
  };
  
  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (gameStateRef.current.gameStarted && !isPaused && !isGameOver && !gameStateRef.current.gameCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Time's up - game over
            clearInterval(timer as NodeJS.Timeout);
            gameStateRef.current.gameCompleted = true;
            setIsGameOver(true);
            setIsVictory(false);
            setIsTimeUp(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPaused, isGameOver, gameStateRef.current.gameStarted, gameStateRef.current.gameCompleted]);
  
  // Initialize game
  useEffect(() => {
    console.log("Game initializing...");
    if (!canvasRef.current) {
      console.error("Canvas ref is null!");
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      console.error("Canvas context is null!");
      return;
    }
    
    console.log("Generating level...");
    // Generate level
    generateLevel();
    
    console.log("Starting game loop...");
    // Start game loop
    startGameLoop();
    
    console.log("Setting up event listeners...");
    // Handle keyboard events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      console.log("Cleaning up game resources...");
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle game restart
  const restartGame = () => {
    console.log("Restarting game...");
    setMoney(1000);
    setScore(0);
    setTimeLeft(100);
    setIsTimeUp(false);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    
    // Reset game state
    generateLevel();
    
    // Restart game loop
    startGameLoop();
  };
  
  // Generate game level with platforms, coins, powerups, and enemies
  const generateLevel = () => {
    console.log("Generating game level...");

    // Define platform configurations
    const platforms = [
      // Ground platform (we'll remove parts of it later for gaps)
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH * LEVEL_LENGTH_MULTIPLIER, height: 20 }
    ];
    
    // Add evenly spaced elevated platforms
    for (let i = 0; i < 18; i++) { // More platforms for longer level
      const x = 350 + i * 220; // More predictable spacing with larger gaps
      const y = GAME_HEIGHT - 100 - (i % 3) * 35; // Varying heights with more variation
      const width = 100; // Consistent width
      platforms.push({ x, y, width, height: 20 });
    }
    
    // Add controlled gaps in the ground - bigger and more challenging gaps
    const gaps = [
      { start: 500, width: 100 },
      { start: 900, width: 120 },
      { start: 1400, width: 150 },
      { start: 1800, width: 120 },
      { start: 2300, width: 170 },
      { start: 2800, width: 140 },
      { start: 3300, width: 180 },
      { start: 3700, width: 120 }
    ];
    
    // Process ground platform with gaps
    let currentGround = platforms[0];
    let newPlatforms = [];
    
    for (const gap of gaps) {
      // End current ground segment before gap
      const beforeGap = { 
        ...currentGround, 
        width: gap.start - currentGround.x 
      };
      newPlatforms.push(beforeGap);
      
      // Start new ground segment after gap
      currentGround = {
        ...currentGround,
        x: gap.start + gap.width,
        width: currentGround.width - (gap.start - currentGround.x) - gap.width
      };
    }
    
    // Add the final ground segment
    newPlatforms.push(currentGround);
    
    // Replace the original ground platform with the segmented ones
    platforms.splice(0, 1, ...newPlatforms);
    
    // Generate fewer coins in more organized patterns
    const coins = [];
    
    // Rows of coins above platforms - reduced quantity
    for (let i = 1; i < platforms.length; i += 2) { // Skip every other platform
      const platform = platforms[i];
      const coinCount = Math.min(3, Math.floor(platform.width / 40)); // Fewer coins
      const coinSpacing = platform.width / coinCount;
      
      for (let j = 0; j < coinCount; j++) {
        coins.push({
          x: platform.x + (j * coinSpacing) + (coinSpacing / 2) - 10,
          y: platform.y - 40,
          width: 20,
          height: 20,
          value: 100,
          collected: false
        });
      }
    }
    
    // Arc patterns of coins - reduced quantity
    for (let i = 0; i < 6; i++) { // More arcs but spread out
      const centerX = 400 + i * 600; // More spread out
      const centerY = GAME_HEIGHT - 150;
      const radius = 70;
      
      for (let j = 0; j < 5; j++) { // Fewer coins per arc
        const angle = (Math.PI / 5) * j + Math.PI / 10;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        coins.push({
          x: x - 10,
          y: y - 10,
          width: 20,
          height: 20,
          value: 100,
          collected: false
        });
      }
    }
    
    // Generate fewer powerups (mystery boxes) at strategic locations
    const powerups = [];
    
    // Place powerups on elevated platforms - much rarer
    for (let i = 1; i < platforms.length; i += 5) { // Much fewer powerups
      const platform = platforms[i];
      powerups.push({
        x: platform.x + platform.width / 2 - 15,
        y: platform.y - 45,
        width: 30,
        height: 30,
        value: 500, // Base value
        collected: false
      });
    }
    
    // Place some special powerups at key locations - higher value
    const specialLocations = [1000, 2000, 3000];
    specialLocations.forEach(x => {
      powerups.push({
        x,
        y: GAME_HEIGHT - 150,
        width: 30,
        height: 30,
        value: 1000, // Higher value for special powerups
        collected: false
      });
    });
    
    // Generate enemies in a more organized pattern with better spacing
    const enemies = [];
    
    // Luxury Purchases (stationary) - Placed at strategic points
    const luxuryPositions = [700, 1600, 2500, 3400];
    luxuryPositions.forEach(x => {
      enemies.push({ 
        x, 
        y: GAME_HEIGHT - 60, 
        width: 40, 
        height: 40, 
        type: 'luxury', 
        value: 500, // Higher value for more risk
        velocityX: 0, 
        hit: false 
      });
    });
    
    // Market Crashes (moving) - Placed in challenging areas
    const crashPositions = [1200, 2000, 2800, 3600];
    crashPositions.forEach((x, i) => {
      const range = 120 + (i * 30); // Increasing range for later enemies
      enemies.push({ 
        x, 
        y: GAME_HEIGHT - 60, 
        width: 50, 
        height: 50, 
        type: 'crash', 
        value: 1000, // Higher value for market crashes
        velocityX: -1.5 - (i * 0.3), // Faster movement
        hit: false,
        startX: x, 
        range
      });
    });
    
    // Set the finish line farther
    const finishLine = { 
      x: GAME_WIDTH * LEVEL_LENGTH_MULTIPLIER - 150, 
      y: GAME_HEIGHT - 80, 
      width: 50, 
      height: 60 
    };
    
    console.log("Level generation complete");
    
    // Reset player position
    const player = {
      x: 50,
      y: GAME_HEIGHT - 80,
      width: 40,
      height: 60,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isDucking: false
    };
    
    // Update game state ref with all our new level elements
    gameStateRef.current = {
      ...gameStateRef.current,
      platforms,
      coins,
      powerups,
      enemies,
      finishLine,
      player,
      camera: { x: 0, y: 0 },
      levelLength: GAME_WIDTH * LEVEL_LENGTH_MULTIPLIER,
      collectedCoins: 0,
      collectedPowerups: 0,
      gameCompleted: false, // Reset the game completed flag
      gameStarted: false // Reset the game started flag
    };
    
    // Update state to trigger re-render
    setGameState({...gameStateRef.current});
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't process key events if game is over or completed
    if (isPaused || isGameOver || gameStateRef.current.gameCompleted) return;
    
    // Mark the game as started on first key press
    if (!gameStateRef.current.gameStarted) {
      gameStateRef.current.gameStarted = true;
    }
    
    console.log("Key down:", e.key);
    
    // Game controls
    switch(e.key) {
      case 'ArrowLeft':
        keys.current.left = true;
        console.log("Left key pressed, keys state:", keys.current);
        break;
      case 'ArrowRight':
        keys.current.right = true;
        console.log("Right key pressed, keys state:", keys.current);
        break;
      case 'ArrowUp':
        keys.current.up = true;
        console.log("Up key pressed, keys state:", keys.current);
        break;
      case 'ArrowDown':
        keys.current.down = true;
        console.log("Down key pressed, keys state:", keys.current);
        break;
      case 'p':
      case 'P':
        setIsPaused(true);
        console.log("Game paused");
        break;
    }
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    console.log("Key up:", e.key);
    
    // Game controls
    switch(e.key) {
      case 'ArrowLeft':
        keys.current.left = false;
        break;
      case 'ArrowRight':
        keys.current.right = false;
        break;
      case 'ArrowUp':
        keys.current.up = false;
        break;
      case 'ArrowDown':
        keys.current.down = false;
        break;
    }
    
    console.log("Keys state after keyup:", keys.current);
  };
  
  // Start game loop
  const startGameLoop = () => {
    console.log("Game loop starting...");
    let lastTime = 0;
    
    const animate = (time: number) => {
      if (!canvasRef.current) {
        console.error("Canvas ref lost during animation loop");
        return;
      }
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        console.error("Canvas context lost during animation loop");
        return;
      }
      
      // Calculate delta time for smooth animations
      const deltaTime = lastTime ? (time - lastTime) / 16 : 1;
      lastTime = time;
      
      if (!isPaused && !isGameOver) {
        // Update game state
        updateGameState(deltaTime);
        
        // Draw game
        drawGame(ctx);
        
        // Check game over conditions
        checkGameOver();
        
        // Update money and score more frequently
        // This ensures the displayed values are always up-to-date
        const calculatedMoney = calculateCurrentMoney();
        setMoney(calculatedMoney);
        setScore(calculatedMoney);
        
        // Update React state occasionally for other game state updates
        if (time % 10 < 1) {
          setGameState({...gameStateRef.current});
        }
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    console.log("Animation frame requested");
  };
  
  // Update game state
  const updateGameState = (deltaTime: number) => {
    // Skip updates if game is completed but game over screen hasn't shown yet
    if (gameStateRef.current.gameCompleted) return;
    
    // Update player movement
    updatePlayerMovement(deltaTime);
    
    // Update camera position
    updateCamera();
    
    // Update enemies
    updateEnemies(deltaTime);
    
    // Check collisions
    checkCollisions();
    
    // Check if player reached the finish line
    checkFinish();
  };
  
  // Update player movement
  const updatePlayerMovement = (deltaTime: number) => {
    // Skip movement updates if game is completed
    if (gameStateRef.current.gameCompleted) return;
    
    const player = { ...gameStateRef.current.player };
      
    // Debug player state before update
    console.log("Player before update:", 
      { x: player.x, y: player.y, vx: player.velocityX, vy: player.velocityY, isJumping: player.isJumping });
    console.log("Keys state:", keys.current);
    
    // Horizontal movement
    if (keys.current.left) {
      player.velocityX = -5 * deltaTime;
      console.log("Moving left, new velocityX:", player.velocityX);
    } else if (keys.current.right) {
      player.velocityX = 5 * deltaTime;
      console.log("Moving right, new velocityX:", player.velocityX);
    } else {
      // Apply friction
      player.velocityX *= 0.8;
    }
    
    // Jumping - only allow jumping if not already jumping
    if (keys.current.up && !player.isJumping) {
      player.velocityY = -15;
      player.isJumping = true;
      console.log("Jumping, new velocityY:", player.velocityY);
    }
    
    // Ducking - FIX: Don't change height for ducking anymore to prevent falling through platforms
    player.isDucking = keys.current.down;
    
    // Apply gravity
    player.velocityY += gameStateRef.current.gravity * deltaTime;
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Debug player state after update
    console.log("Player after update:", 
      { x: player.x, y: player.y, vx: player.velocityX, vy: player.velocityY, isJumping: player.isJumping });
    
    // Boundary checks
    if (player.x < 0) player.x = 0;
    if (player.x > gameStateRef.current.levelLength - player.width) {
      player.x = gameStateRef.current.levelLength - player.width;
    }
    
    // Update player in gameStateRef
    gameStateRef.current.player = player;
  };
  
  // Update camera position to follow player
  const updateCamera = () => {
    const camera = { ...gameStateRef.current.camera };
    const player = gameStateRef.current.player;
    
    // Camera follows player with some margin
    const targetCameraX = Math.max(0, player.x - GAME_WIDTH / 3);
    
    // Add camera smoothing - gradually move toward target position
    camera.x += (targetCameraX - camera.x) * 0.1;
    
    // Camera boundaries
    if (camera.x < 0) camera.x = 0;
    if (camera.x > gameStateRef.current.levelLength - GAME_WIDTH) {
      camera.x = gameStateRef.current.levelLength - GAME_WIDTH;
    }
    
    // Update parallax backgrounds - using fixed offsets to prevent jittering
    const background = {
      far: { x: Math.floor(camera.x * 0.2) }, // Use Math.floor to prevent subpixel rendering
      mid: { x: Math.floor(camera.x * 0.5) },
      near: { x: Math.floor(camera.x * 0.8) }
    };
    
    // Debug camera position
    console.log("Camera position:", camera.x, "Player position:", player.x);
    
    // Update camera and background in gameStateRef
    gameStateRef.current.camera = camera;
    gameStateRef.current.background = background;
  };
  
  // Update enemies
  const updateEnemies = (deltaTime: number) => {
    // Skip enemy updates if game is completed
    if (gameStateRef.current.gameCompleted) return;
    
    const enemies = gameStateRef.current.enemies.map(enemy => {
      if (enemy.type === 'crash') {
        // Market crash enemies move back and forth
        enemy.x += enemy.velocityX * deltaTime;
        
        // Reverse direction if reached range limit
        if (enemy.x < enemy.startX - enemy.range || enemy.x > enemy.startX) {
          enemy.velocityX *= -1;
        }
      }
      return enemy;
    });
    
    // Update enemies in gameStateRef
    gameStateRef.current.enemies = enemies;
  };
  
  // Check for collisions
  const checkCollisions = () => {
    // Skip collision checks if game is completed
    if (gameStateRef.current.gameCompleted) return;
    
    const player = { ...gameStateRef.current.player };
    const coins = [...gameStateRef.current.coins];
    const powerups = [...gameStateRef.current.powerups];
    const enemies = [...gameStateRef.current.enemies];
    
    // Check platform collisions (ground and platforms)
    let isOnPlatform = false;
    gameStateRef.current.platforms.forEach(platform => {
      // Check if player is on platform
      if (
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + platform.height &&
        player.velocityY > 0
      ) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.isJumping = false;
        isOnPlatform = true;
        console.log("Player landed on platform");
      }
    });
    
    if (!isOnPlatform) {
      player.isJumping = true;
    }
    
    // Track if we collected anything in this frame
    let coinCollected = false;
    let powerupCollected = false;
    let powerupValue = 0;
    
    // Check coin collisions
    coins.forEach((coin, index) => {
      if (!coin.collected && checkObjectCollision(player, coin)) {
        coins[index] = { ...coin, collected: true };
        gameStateRef.current.collectedCoins += 1;
        coinCollected = true;
        console.log(`Coin collected! Money increased by ${coin.value}`);
      }
    });
    
    // Check powerup collisions
    powerups.forEach((powerup, index) => {
      if (!powerup.collected && checkObjectCollision(player, powerup)) {
        powerups[index] = { ...powerup, collected: true };
        gameStateRef.current.collectedPowerups += 1;
        powerupCollected = true;
        powerupValue = powerup.value;
        console.log(`Powerup collected! Money increased by ${powerup.value}`);
      }
    });
    
    // Check enemy collisions
    enemies.forEach((enemy, index) => {
      if (!enemy.hit && checkObjectCollision(player, enemy)) {
        enemies[index] = { ...enemy, hit: true };
        toast({
          title: enemy.type === 'luxury' ? "Luxury Purchase!" : "Market Crash!",
          description: `You lost $${enemy.value}`,
          variant: "destructive"
        });
        console.log(`Hit enemy! Money reduced by: ${enemy.value}`);
      }
    });
    
    // Show toast for collectibles
    if (coinCollected) {
      toast({
        title: "Coin Collected!",
        description: "You gained $100",
      });
    }
    
    if (powerupCollected) {
      toast({
        title: "Financial Bonus!",
        description: `You found a bonus worth $${powerupValue}!`,
      });
    }
    
    // Update in gameStateRef
    gameStateRef.current.player = player;
    gameStateRef.current.coins = coins;
    gameStateRef.current.powerups = powerups;
    gameStateRef.current.enemies = enemies;
  };
  
  // Helper to check collision between two objects
  const checkObjectCollision = (obj1: any, obj2: any) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  };
  
  // Check if player reached the finish line
  const checkFinish = () => {
    if (gameStateRef.current.finishLine && 
        checkObjectCollision(gameStateRef.current.player, gameStateRef.current.finishLine)) {
      // Set the game completed flag to freeze player movement
      gameStateRef.current.gameCompleted = true;
      
      // Calculate final score once before showing game over screen
      const finalScore = calculateCurrentMoney();
      setScore(finalScore);
      
      // Show game over screen
      setIsGameOver(true);
      setIsVictory(true);
      console.log("Player reached finish line! Victory!");
      
      // Ensure all key states are reset
      keys.current = {
        left: false,
        right: false,
        up: false,
        down: false
      };
      
      // Stop player momentum
      gameStateRef.current.player.velocityX = 0;
      gameStateRef.current.player.velocityY = 0;
    }
  };
  
  // Check game over conditions
  const checkGameOver = () => {
    // Skip game over checks if game is already completed
    if (gameStateRef.current.gameCompleted) return;
    
    // Check if player fell into a pit
    if (gameStateRef.current.player.y > GAME_HEIGHT) {
      setIsGameOver(true);
      setIsVictory(false);
      gameStateRef.current.gameCompleted = true;
      console.log("Game over: Player fell into a pit");
    }
    
    // Check if player has no money left
    const calculatedMoney = calculateCurrentMoney();
      
    if (calculatedMoney <= 0) {
      setIsGameOver(true);
      setIsVictory(false);
      gameStateRef.current.gameCompleted = true;
      console.log("Game over: Player has no money left");
    }
  };
  
  // Draw game
  const drawGame = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw background (simplified)
    drawBackground(ctx);
    
    // Save context for camera transformation
    ctx.save();
    
    // Apply camera transform - Use Math.floor to prevent subpixel rendering issues
    ctx.translate(-Math.floor(gameStateRef.current.camera.x), 0);
    
    // Draw platforms
    drawPlatforms(ctx);
    
    // Draw coins
    drawCoins(ctx);
    
    // Draw powerups
    drawPowerups(ctx);
    
    // Draw enemies
    drawEnemies(ctx);
    
    // Draw finish line
    drawFinishLine(ctx);
    
    // Draw player
    drawPlayer(ctx);
    
    // Restore context
    ctx.restore();
    
    // Draw HUD on top (not affected by camera)
    drawHUD(ctx);
  };
  
  // Draw background layers
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Simple gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, "#87CEEB"); // Sky blue
    gradient.addColorStop(1, "#E0F7FA"); // Light cyan
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw mountains in the far background - Use fixed positions
    ctx.fillStyle = "#9E9E9E";
    for (let i = 0; i < 5; i++) {
      const x = (i * 200) - (gameStateRef.current.background.far.x % 200);
      const height = 100 + Math.abs(Math.sin(i * 0.7)) * 50; // Use deterministic heights
      
      ctx.beginPath();
      ctx.moveTo(Math.floor(x - 100), GAME_HEIGHT);
      ctx.lineTo(Math.floor(x), Math.floor(GAME_HEIGHT - height));
      ctx.lineTo(Math.floor(x + 100), GAME_HEIGHT);
      ctx.fill();
    }
    
    // Draw hills in the mid background - Use fixed positions
    ctx.fillStyle = "#A5D6A7";
    for (let i = 0; i < 7; i++) {
      const x = (i * 150) - (gameStateRef.current.background.mid.x % 150);
      
      ctx.beginPath();
      ctx.arc(Math.floor(x), GAME_HEIGHT + 30, 80, Math.PI, 0, false);
      ctx.fill();
    }
    
    // Draw clouds - Use fixed positions
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (let i = 0; i < 8; i++) {
      const x = (i * 180) - (gameStateRef.current.background.far.x % 180);
      const y = 40 + Math.abs(Math.sin(i * 1.3)) * 30; // Use deterministic heights
      
      // Cloud shape
      ctx.beginPath();
      ctx.arc(Math.floor(x), Math.floor(y), 20, 0, Math.PI * 2);
      ctx.arc(Math.floor(x + 15), Math.floor(y - 10), 15, 0, Math.PI * 2);
      ctx.arc(Math.floor(x + 25), Math.floor(y + 5), 18, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Draw platforms
  const drawPlatforms = (ctx: CanvasRenderingContext2D) => {
    gameStateRef.current.platforms.forEach(platform => {
      // Platform gradient
      const gradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
      gradient.addColorStop(0, "#8D6E63"); // Brown
      gradient.addColorStop(1, "#5D4037"); // Darker brown
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        Math.floor(platform.x), 
        Math.floor(platform.y), 
        Math.floor(platform.width), 
        Math.floor(platform.height)
      );
      
      // Platform top edge
      ctx.fillStyle = "#A1887F";
      ctx.fillRect(
        Math.floor(platform.x), 
        Math.floor(platform.y), 
        Math.floor(platform.width), 
        5
      );
      
      // Grass on top of ground platforms
      if (platform.y === GAME_HEIGHT - 20) {
        ctx.fillStyle = "#66BB6A";
        ctx.fillRect(
          Math.floor(platform.x), 
          Math.floor(platform.y) - 2, 
          Math.floor(platform.width), 
          5
        );
      }
    });
  };
  
  // Draw coins
  const drawCoins = (ctx: CanvasRenderingContext2D) => {
    gameStateRef.current.coins.forEach(coin => {
      if (!coin.collected) {
        // Coin circle
        ctx.fillStyle = "#FFD700"; // Gold
        ctx.beginPath();
        ctx.arc(
          Math.floor(coin.x + coin.width / 2), 
          Math.floor(coin.y + coin.height / 2), 
          coin.width / 2, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        
        // Coin highlight
        ctx.fillStyle = "#FFFFFF"; // White
        ctx.beginPath();
        ctx.arc(
          Math.floor(coin.x + coin.width / 3), 
          Math.floor(coin.y + coin.height / 3), 
          coin.width / 6, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        
        // Coin dollar sign
        ctx.fillStyle = "#8D6E63";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "$", 
          Math.floor(coin.x + coin.width / 2), 
          Math.floor(coin.y + coin.height / 1.8 + 4)
        );
      }
    });
  };
  
  // Draw powerups (mystery boxes)
  const drawPowerups = (ctx: CanvasRenderingContext2D) => {
    gameStateRef.current.powerups.forEach(powerup => {
      if (!powerup.collected) {
        // Mystery box
        ctx.fillStyle = "#673AB7"; // Purple
        
        // Draw box
        ctx.fillRect(
          Math.floor(powerup.x),
          Math.floor(powerup.y),
          Math.floor(powerup.width),
          Math.floor(powerup.height)
        );
        
        // Draw dollar sign
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "$",
          Math.floor(powerup.x + powerup.width / 2),
          Math.floor(powerup.y + powerup.height / 2 + 6)
        );
        
        // Box border
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          Math.floor(powerup.x),
          Math.floor(powerup.y),
          Math.floor(powerup.width),
          Math.floor(powerup.height)
        );
      }
    });
  };
  
  // Draw enemies
  const drawEnemies = (ctx: CanvasRenderingContext2D) => {
    gameStateRef.current.enemies.forEach(enemy => {
      if (!enemy.hit) {
        if (enemy.type === 'luxury') {
          // Luxury Purchase (bag with $ sign)
          ctx.fillStyle = "#FF5722"; // Deep orange
          ctx.fillRect(
            Math.floor(enemy.x), 
            Math.floor(enemy.y), 
            Math.floor(enemy.width), 
            Math.floor(enemy.height)
          );
          
          // Bag handle
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(Math.floor(enemy.x + 10), Math.floor(enemy.y));
          ctx.lineTo(Math.floor(enemy.x + 10), Math.floor(enemy.y - 10));
          ctx.lineTo(Math.floor(enemy.x + enemy.width - 10), Math.floor(enemy.y - 10));
          ctx.lineTo(Math.floor(enemy.x + enemy.width - 10), Math.floor(enemy.y));
          ctx.stroke();
          
          // Dollar sign
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 20px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "$", 
            Math.floor(enemy.x + enemy.width / 2), 
            Math.floor(enemy.y + enemy.height / 1.5)
          );
        } else if (enemy.type === 'crash') {
          // Market Crash (down arrow)
          ctx.fillStyle = "#F44336"; // Red
          
          // Arrow body
          ctx.beginPath();
          ctx.moveTo(Math.floor(enemy.x + enemy.width / 2), Math.floor(enemy.y + enemy.height)); // Arrow point
          ctx.lineTo(Math.floor(enemy.x), Math.floor(enemy.y)); // Left corner
          ctx.lineTo(Math.floor(enemy.x + enemy.width), Math.floor(enemy.y)); // Right corner
          ctx.closePath();
          ctx.fill();
          
          // Arrow stem
          ctx.fillRect(
            Math.floor(enemy.x + enemy.width / 2 - 5),
            Math.floor(enemy.y - 20),
            10,
            25
          );
        }
      }
    });
  };
  
  // Draw finish line
  const drawFinishLine = (ctx: CanvasRenderingContext2D) => {
    if (gameStateRef.current.finishLine) {
      const { x, y, width, height } = gameStateRef.current.finishLine;
      
      // Finish flag
      ctx.fillStyle = "#4CAF50"; // Green
      ctx.fillRect(
        Math.floor(x), 
        Math.floor(y), 
        Math.floor(width), 
        Math.floor(height)
      );
      
      // Flag pole
      ctx.fillStyle = "#795548"; // Brown
      ctx.fillRect(
        Math.floor(x), 
        Math.floor(y), 
        5, 
        Math.floor(height)
      );
      
      // Checkered pattern
      ctx.fillStyle = "#FFFFFF"; // White
      const squareSize = 10;
      for (let i = 0; i < height / squareSize; i++) {
        for (let j = 0; j < width / squareSize; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(
              Math.floor(x + j * squareSize + 5),
              Math.floor(y + i * squareSize),
              squareSize,
              squareSize
            );
          }
        }
      }
    }
  };
  
  // Draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    const { x, y, width, height, isDucking, isJumping } = gameStateRef.current.player;
    
    // Player body
    ctx.fillStyle = "#2196F3"; // Blue
    ctx.fillRect(
      Math.floor(x), 
      Math.floor(y), 
      Math.floor(width), 
      Math.floor(height)
    );
    
    // Player face (different based on state)
    if (isDucking) {
      // Ducking face
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(
        Math.floor(x + width - 15), 
        Math.floor(y + 5), 
        10, 
        5
      );
    } else if (isJumping) {
      // Jumping face
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(
        Math.floor(x + width - 10), 
        Math.floor(y + 15), 
        8, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
    } else {
      // Normal face
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(
        Math.floor(x + width - 15), 
        Math.floor(y + 15), 
        10, 
        5
      );
    }
  };
  
  // Draw heads-up display (HUD)
  const drawHUD = (ctx: CanvasRenderingContext2D) => {
    // Money counter
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 10, 150, 40);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Money:", 20, 32);
    
    // Calculate current money value based on game state
    const currentMoney = calculateCurrentMoney();
    
    ctx.fillStyle = currentMoney > 0 ? "#4CAF50" : "#F44336";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`$${currentMoney}`, 90, 32);
    
    // Timer
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(GAME_WIDTH - 110, 10, 100, 40);
    
    // Draw clock icon
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 90, 30, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH - 90, 30);
    ctx.lineTo(GAME_WIDTH - 90, 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH - 90, 30);
    ctx.lineTo(GAME_WIDTH - 84, 30);
    ctx.stroke();
    
    // Time display
    ctx.fillStyle = timeLeft <= 10 ? "#F44336" : "#FFFFFF";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${timeLeft}s`, GAME_WIDTH - 60, 32);
    
    // Pause button
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(GAME_WIDTH - 50, 10, 40, 40);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("II", GAME_WIDTH - 30, 32);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT}
        id="game-canvas"
        onClick={(e) => {
          // Handle pause button click
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          if (x > GAME_WIDTH - 50 && x < GAME_WIDTH - 10 && y > 10 && y < 50) {
            setIsPaused(true);
          }
        }}
      />
      
      {/* Pause Menu */}
      {isPaused && !isGameOver && (
        <PauseMenu 
          onResume={() => setIsPaused(false)}
          onRestart={restartGame}
          onMainMenu={onExit}
        />
      )}
      
      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverScreen
          score={score}
          isVictory={isVictory}
          isTimeUp={isTimeUp}
          onRestart={restartGame}
          onMainMenu={onExit}
        />
      )}
      
      {/* Game Legend */}
      <GameLegend className="mt-6" />
    </div>
  );
};

export default GameEngine;
