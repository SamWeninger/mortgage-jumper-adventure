
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import PauseMenu from './PauseMenu';
import GameOverScreen from './GameOverScreen';

// Game sprites and assets would be imported here in a real implementation
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;

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
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH * 3, height: 20 }
    ],
    coins: [] as any[],
    powerups: [] as any[],
    enemies: [] as any[],
    finishLine: {
      x: GAME_WIDTH * 3 - 100, 
      y: GAME_HEIGHT - 80, 
      width: 50, 
      height: 60 
    } as FinishLine,
    camera: {
      x: 0,
      y: 0
    },
    levelLength: GAME_WIDTH * 3,
    gravity: 0.6,
    background: {
      far: { x: 0 },
      mid: { x: 0 },
      near: { x: 0 }
    },
    collectedCoins: 0,
    collectedPowerups: 0,
    gameCompleted: false // New flag to track if the game is completed
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
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH * 3, height: 20 }
    ];
    
    // Add evenly spaced elevated platforms
    for (let i = 0; i < 12; i++) {
      const x = 250 + i * 200; // More predictable spacing
      const y = GAME_HEIGHT - 100 - (i % 3) * 30; // Varying heights but in a pattern
      const width = 100; // Consistent width
      platforms.push({ x, y, width, height: 20 });
    }
    
    // Add controlled gaps in the ground
    const gaps = [
      { start: 400, width: 80 },
      { start: 800, width: 100 },
      { start: 1200, width: 120 },
      { start: 1600, width: 100 },
      { start: 2000, width: 80 }
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
    
    // Generate coins in more organized patterns
    const coins = [];
    // Rows of coins above platforms
    for (let i = 1; i < platforms.length; i++) {
      const platform = platforms[i];
      const coinCount = Math.min(5, Math.floor(platform.width / 30));
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
    
    // Arc patterns of coins
    for (let i = 0; i < 5; i++) {
      const centerX = 300 + i * 400;
      const centerY = GAME_HEIGHT - 150;
      const radius = 70;
      
      for (let j = 0; j < 7; j++) {
        const angle = (Math.PI / 7) * j + Math.PI / 14;
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
    
    // Generate powerups (mystery boxes) at strategic locations
    const powerups = [];
    // Place powerups on elevated platforms
    for (let i = 1; i < platforms.length; i += 2) {
      const platform = platforms[i];
      powerups.push({
        x: platform.x + platform.width / 2 - 15,
        y: platform.y - 45,
        width: 30,
        height: 30,
        value: 500,
        collected: false
      });
    }
    
    // Place some special powerups at key locations
    const specialLocations = [400, 1200, 2000];
    specialLocations.forEach(x => {
      powerups.push({
        x,
        y: GAME_HEIGHT - 150,
        width: 30,
        height: 30,
        value: 750,
        collected: false
      });
    });
    
    // Generate enemies in a more organized pattern
    const enemies = [];
    
    // Luxury Purchases (stationary) - Placed at strategic points
    const luxuryPositions = [300, 700, 1100, 1500, 1900];
    luxuryPositions.forEach(x => {
      enemies.push({ 
        x, 
        y: GAME_HEIGHT - 60, 
        width: 40, 
        height: 40, 
        type: 'luxury', 
        value: 250, 
        velocityX: 0, 
        hit: false 
      });
    });
    
    // Market Crashes (moving) - Placed in challenging areas
    const crashPositions = [500, 900, 1300, 1700, 2100];
    crashPositions.forEach((x, i) => {
      const range = 100 + (i * 20); // Increasing range for later enemies
      enemies.push({ 
        x, 
        y: GAME_HEIGHT - 60, 
        width: 50, 
        height: 50, 
        type: 'crash', 
        value: 400 + (i * 100), // Increasing cost for later enemies
        velocityX: -1 - (i * 0.2), // Increasing speed for later enemies
        hit: false,
        startX: x, 
        range
      });
    });
    
    // Set the finish line
    const finishLine = { 
      x: GAME_WIDTH * 3 - 150, 
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
      levelLength: GAME_WIDTH * 3,
      collectedCoins: 0,
      collectedPowerups: 0,
      gameCompleted: false // Reset the game completed flag
    };
    
    // Update state to trigger re-render
    setGameState({...gameStateRef.current});
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't process key events if game is over or completed
    if (isPaused || isGameOver || gameStateRef.current.gameCompleted) return;
    
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
        
        // Update React state occasionally to show debug info
        if (time % 10 < 1) {
          setGameState({...gameStateRef.current});
          // Update money state to reflect current game state
          setMoney(prev => {
            const calculatedMoney = 1000 + 
              (gameStateRef.current.collectedCoins * 100) + 
              (gameStateRef.current.collectedPowerups * 500) - 
              gameStateRef.current.enemies.filter(e => e.hit).reduce((sum, e) => sum + e.value, 0);
            
            if (prev !== calculatedMoney) {
              return calculatedMoney;
            }
            return prev;
          });
          
          // Update score
          setScore(prev => {
            const calculatedScore = 1000 + 
              (gameStateRef.current.collectedCoins * 100) + 
              (gameStateRef.current.collectedPowerups * 500) - 
              gameStateRef.current.enemies.filter(e => e.hit).reduce((sum, e) => sum + e.value, 0);
            
            if (prev !== calculatedScore) {
              return calculatedScore;
            }
            return prev;
          });
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
        title: "Bonus Found!",
        description: "You found a financial bonus!",
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
    const calculatedMoney = 1000 + 
      (gameStateRef.current.collectedCoins * 100) + 
      (gameStateRef.current.collectedPowerups * 500) - 
      gameStateRef.current.enemies.filter(e => e.hit).reduce((sum, e) => sum + e.value, 0);
      
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
        
        // Draw question mark
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "$",
          Math.floor(powerup.x + powerup.width / 2),
          Math.floor(powerup.y + powerup.height / 2 + 6)
        );
        
        // Draw glow effect
        ctx.strokeStyle = "#B39DDB";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          Math.floor(powerup.x - 2),
          Math.floor(powerup.y - 2),
          Math.floor(powerup.width + 4),
          Math.floor(powerup.height + 4)
        );
      }
    });
  };
  
  // Draw enemies
  const drawEnemies = (ctx: CanvasRenderingContext2D) => {
    gameStateRef.current.enemies.forEach(enemy => {
      if (!enemy.hit) {
        if (enemy.type === 'luxury') {
          // Luxury purchase - red square
          ctx.fillStyle = "#E57373"; // Light red
          ctx.fillRect(
            Math.floor(enemy.x),
            Math.floor(enemy.y),
            Math.floor(enemy.width),
            Math.floor(enemy.height)
          );
          
          // Dollar sign
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 16px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "$$",
            Math.floor(enemy.x + enemy.width / 2),
            Math.floor(enemy.y + enemy.height / 2 + 5)
          );
        } else {
          // Market crash - blue triangle
          ctx.fillStyle = "#42A5F5"; // Light blue
          
          // Triangle pointing left for moving enemies
          ctx.beginPath();
          ctx.moveTo(Math.floor(enemy.x + enemy.width), Math.floor(enemy.y));
          ctx.lineTo(Math.floor(enemy.x + enemy.width), Math.floor(enemy.y + enemy.height));
          ctx.lineTo(Math.floor(enemy.x), Math.floor(enemy.y + enemy.height / 2));
          ctx.closePath();
          ctx.fill();
          
          // Down arrow symbol
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 16px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "↓",
            Math.floor(enemy.x + enemy.width / 2 + 5),
            Math.floor(enemy.y + enemy.height / 2 + 5)
          );
        }
      }
    });
  };
  
  // Draw finish line
  const drawFinishLine = (ctx: CanvasRenderingContext2D) => {
    const finishLine = gameStateRef.current.finishLine;
    
    // Draw checkered pattern
    const squareSize = 10;
    const rows = Math.ceil(finishLine.height / squareSize);
    const cols = Math.ceil(finishLine.width / squareSize);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isEven = (row + col) % 2 === 0;
        ctx.fillStyle = isEven ? "#000000" : "#FFFFFF";
        ctx.fillRect(
          Math.floor(finishLine.x + col * squareSize),
          Math.floor(finishLine.y + row * squareSize),
          squareSize,
          squareSize
        );
      }
    }
    
    // Draw flag
    ctx.fillStyle = "#4CAF50"; // Green
    ctx.fillRect(
      Math.floor(finishLine.x + finishLine.width / 2 - 2),
      Math.floor(finishLine.y - 30),
      4,
      30
    );
    
    // Flag part
    ctx.fillStyle = "#F44336"; // Red
    ctx.beginPath();
    ctx.moveTo(Math.floor(finishLine.x + finishLine.width / 2), Math.floor(finishLine.y - 30));
    ctx.lineTo(Math.floor(finishLine.x + finishLine.width / 2 + 20), Math.floor(finishLine.y - 20));
    ctx.lineTo(Math.floor(finishLine.x + finishLine.width / 2), Math.floor(finishLine.y - 10));
    ctx.closePath();
    ctx.fill();
  };
  
  // Draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    const player = gameStateRef.current.player;
    
    // Calculate head position
    const headX = player.x + player.width / 2;
    const headY = player.y + player.height / 4;
    const headRadius = player.width / 2.5;
    
    // Draw body
    ctx.fillStyle = "#4CAF50"; // Green
    ctx.fillRect(
      Math.floor(player.x + player.width / 4),
      Math.floor(player.y + player.height / 2),
      Math.floor(player.width / 2),
      Math.floor(player.height / 2)
    );
    
    // Draw head
    ctx.fillStyle = "#FFA726"; // Orange
    ctx.beginPath();
    ctx.arc(
      Math.floor(headX),
      Math.floor(headY),
      headRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = "#FFFFFF";
    
    // Left eye
    ctx.beginPath();
    ctx.arc(
      Math.floor(headX - headRadius / 3),
      Math.floor(headY - headRadius / 5),
      headRadius / 5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(
      Math.floor(headX + headRadius / 3),
      Math.floor(headY - headRadius / 5),
      headRadius / 5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw pupils
    ctx.fillStyle = "#000000";
    
    // Left pupil
    ctx.beginPath();
    ctx.arc(
      Math.floor(headX - headRadius / 3 + (player.velocityX > 0 ? 2 : -2)),
      Math.floor(headY - headRadius / 5),
      headRadius / 10,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Right pupil
    ctx.beginPath();
    ctx.arc(
      Math.floor(headX + headRadius / 3 + (player.velocityX > 0 ? 2 : -2)),
      Math.floor(headY - headRadius / 5),
      headRadius / 10,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw mouth
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    if (player.isJumping) {
      // Surprised mouth when jumping
      ctx.arc(
        Math.floor(headX),
        Math.floor(headY + headRadius / 3),
        headRadius / 6,
        0,
        Math.PI * 2
      );
    } else {
      // Smiling mouth when running or standing
      ctx.arc(
        Math.floor(headX),
        Math.floor(headY + headRadius / 5),
        headRadius / 4,
        0.2,
        Math.PI - 0.2
      );
    }
    
    ctx.stroke();
    
    // Draw arms
    ctx.fillStyle = "#FFA726"; // Orange
    
    // Left arm
    ctx.fillRect(
      Math.floor(player.x),
      Math.floor(player.y + player.height / 2),
      Math.floor(player.width / 4),
      Math.floor(player.height / 3)
    );
    
    // Right arm
    ctx.fillRect(
      Math.floor(player.x + player.width * 0.75),
      Math.floor(player.y + player.height / 2),
      Math.floor(player.width / 4),
      Math.floor(player.height / 3)
    );
    
    // Draw legs
    ctx.fillStyle = "#1565C0"; // Blue
    
    // Left leg
    ctx.fillRect(
      Math.floor(player.x + player.width / 4),
      Math.floor(player.y + player.height - player.height / 4),
      Math.floor(player.width / 6),
      Math.floor(player.height / 4)
    );
    
    // Right leg
    ctx.fillRect(
      Math.floor(player.x + player.width - player.width / 4 - player.width / 6),
      Math.floor(player.y + player.height - player.height / 4),
      Math.floor(player.width / 6),
      Math.floor(player.height / 4)
    );
  };
  
  // Draw HUD (heads-up display)
  const drawHUD = (ctx: CanvasRenderingContext2D) => {
    // Draw money counter
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 10, 150, 40);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      `Money: $${money}`,
      20,
      35
    );
    
    // Draw instructions
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(GAME_WIDTH - 160, 10, 150, 40);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      "Press P to pause",
      GAME_WIDTH - 20,
      35
    );
  };
  
  return (
    <div className="relative">
      {/* Game canvas */}
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT}
        className="border border-gray-300 shadow-lg"
      />
      
      {/* Money display */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-xl">
          <span className="font-bold">Money:</span> ${money}
        </div>
      </div>
      
      {/* Pause menu overlay */}
      {isPaused && (
        <PauseMenu 
          onResume={() => setIsPaused(false)} 
          onRestart={restartGame}
          onExit={onExit}
        />
      )}
      
      {/* Game over screen */}
      {isGameOver && (
        <GameOverScreen 
          score={score}
          isVictory={isVictory}
          onRestart={restartGame}
          onMainMenu={onExit}
        />
      )}
    </div>
  );
};

export default GameEngine;
