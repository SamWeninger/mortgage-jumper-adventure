
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
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
    }
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
    const platforms = [
      // Ground platform
      { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH * 3, height: 20 }
    ];
    
    // Add some elevated platforms
    for (let i = 0; i < 10; i++) {
      const x = 300 + i * 250 + Math.random() * 100;
      const y = GAME_HEIGHT - 100 - Math.random() * 100;
      const width = 80 + Math.random() * 120;
      platforms.push({ x, y, width, height: 20 });
    }
    
    // Add gaps in the ground
    for (let i = 0; i < 5; i++) {
      const x = 500 + i * 400 + Math.random() * 200;
      const width = 60 + Math.random() * 80;
      
      // Remove part of the ground platform for the gap
      platforms[0] = { ...platforms[0], width: x - platforms[0].x };
      
      // Add ground platform after the gap
      platforms.push({
        x: x + width,
        y: GAME_HEIGHT - 20,
        width: platforms[0].width + GAME_WIDTH * 3 - (x + width),
        height: 20
      });
    }
    
    // Generate coins
    const coins = [];
    for (let i = 0; i < 40; i++) {
      const x = 200 + i * 120 + Math.random() * 80;
      const y = GAME_HEIGHT - 60 - Math.random() * 120;
      coins.push({ x, y, width: 20, height: 20, value: 100, collected: false });
    }
    
    // Generate powerups (mystery boxes)
    const powerups = [];
    for (let i = 0; i < 8; i++) {
      const x = 350 + i * 300 + Math.random() * 100;
      const y = GAME_HEIGHT - 80 - Math.random() * 100;
      const value = 250 + Math.floor(Math.random() * 750); // Random value between 250 and 1000
      powerups.push({ x, y, width: 30, height: 30, value, collected: false });
    }
    
    // Generate enemies
    const enemies = [];
    // Luxury Purchases (stationary)
    for (let i = 0; i < 6; i++) {
      const x = 300 + i * 400 + Math.random() * 200;
      const y = GAME_HEIGHT - 60;
      enemies.push({ 
        x, y, width: 40, height: 40, 
        type: 'luxury', value: 500, 
        velocityX: 0, hit: false 
      });
    }
    
    // Market Crashes (moving)
    for (let i = 0; i < 4; i++) {
      const x = 600 + i * 550 + Math.random() * 200;
      const y = GAME_HEIGHT - 60;
      enemies.push({ 
        x, y, width: 50, height: 50, 
        type: 'crash', value: 1000, 
        velocityX: -1 - Math.random(), hit: false,
        startX: x, range: 100 + Math.random() * 100
      });
    }
    
    // Set the finish line
    const finishLine = { 
      x: GAME_WIDTH * 3 - 100, 
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
    
    // Update game state ref
    gameStateRef.current = {
      ...gameStateRef.current,
      platforms,
      coins,
      powerups,
      enemies,
      finishLine,
      player,
      camera: { x: 0, y: 0 },
      levelLength: GAME_WIDTH * 3
    };
    
    // Update state to trigger re-render
    setGameState({...gameStateRef.current});
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isPaused || isGameOver) return;
    
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
        }
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    console.log("Animation frame requested");
  };
  
  // Update game state
  const updateGameState = (deltaTime: number) => {
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
    
    // Jumping
    if (keys.current.up && !player.isJumping) {
      player.velocityY = -15;
      player.isJumping = true;
      console.log("Jumping, new velocityY:", player.velocityY);
    }
    
    // Ducking
    player.isDucking = keys.current.down;
    if (player.isDucking) {
      player.height = 30; // Reduce height when ducking
      console.log("Ducking, height reduced");
    } else {
      player.height = 60; // Normal height
    }
    
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
    
    // Update parallax backgrounds
    const background = {
      far: { x: camera.x * 0.2 },
      mid: { x: camera.x * 0.5 },
      near: { x: camera.x * 0.8 }
    };
    
    // Debug camera position
    console.log("Camera position:", camera.x, "Player position:", player.x);
    
    // Update camera and background in gameStateRef
    gameStateRef.current.camera = camera;
    gameStateRef.current.background = background;
  };
  
  // Update enemies
  const updateEnemies = (deltaTime: number) => {
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
    const player = { ...gameStateRef.current.player };
    const coins = [...gameStateRef.current.coins];
    const powerups = [...gameStateRef.current.powerups];
    const enemies = [...gameStateRef.current.enemies];
    let newMoney = money;
    let newScore = score;
    
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
    
    // Check coin collisions
    coins.forEach((coin, index) => {
      if (!coin.collected && checkObjectCollision(player, coin)) {
        coins[index] = { ...coin, collected: true };
        newMoney += coin.value;
        newScore += coin.value;
        setMoney(newMoney);
        setScore(newScore);
        console.log(`Coin collected! Money: ${newMoney}, Score: ${newScore}`);
      }
    });
    
    // Check powerup collisions
    powerups.forEach((powerup, index) => {
      if (!powerup.collected && checkObjectCollision(player, powerup)) {
        powerups[index] = { ...powerup, collected: true };
        newMoney += powerup.value;
        newScore += powerup.value;
        setMoney(newMoney);
        setScore(newScore);
        console.log(`Powerup collected! Money: ${newMoney}, Score: ${newScore}`);
      }
    });
    
    // Check enemy collisions
    enemies.forEach((enemy, index) => {
      if (!enemy.hit && checkObjectCollision(player, enemy)) {
        enemies[index] = { ...enemy, hit: true };
        newMoney -= enemy.value;
        setMoney(newMoney);
        console.log(`Hit enemy! Money reduced to: ${newMoney}`);
      }
    });
    
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
      setIsGameOver(true);
      setIsVictory(true);
      console.log("Player reached finish line! Victory!");
    }
  };
  
  // Check game over conditions
  const checkGameOver = () => {
    // Check if player fell into a pit
    if (gameStateRef.current.player.y > GAME_HEIGHT) {
      setIsGameOver(true);
      setIsVictory(false);
      console.log("Game over: Player fell into a pit");
    }
    
    // Check if player has no money left
    if (money <= 0) {
      setIsGameOver(true);
      setIsVictory(false);
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
    
    // Draw mountains in the far background - Use Math.floor for positions
    ctx.fillStyle = "#9E9E9E";
    for (let i = 0; i < 5; i++) {
      const x = Math.floor((i * 200) - (gameStateRef.current.background.far.x % 200));
      const height = 100 + Math.random() * 50;
      
      ctx.beginPath();
      ctx.moveTo(x - 100, GAME_HEIGHT);
      ctx.lineTo(x, GAME_HEIGHT - height);
      ctx.lineTo(x + 100, GAME_HEIGHT);
      ctx.fill();
    }
    
    // Draw hills in the mid background - Use Math.floor for positions
    ctx.fillStyle = "#A5D6A7";
    for (let i = 0; i < 7; i++) {
      const x = Math.floor((i * 150) - (gameStateRef.current.background.mid.x % 150));
      
      ctx.beginPath();
      ctx.arc(x, GAME_HEIGHT + 30, 80, Math.PI, 0, false);
      ctx.fill();
    }
    
    // Draw clouds - Use Math.floor for positions
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (let i = 0; i < 8; i++) {
      const x = Math.floor((i * 180) - (gameStateRef.current.background.far.x % 180));
      const y = 40 + Math.random() * 50;
      
      // Cloud shape
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
      ctx.arc(x + 25, y + 5, 18, 0, Math.PI * 2);
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
        ctx.fillRect(
          Math.floor(powerup.x), 
          Math.floor(powerup.y), 
          Math.floor(powerup.width), 
          Math.floor(powerup.height)
        );
        
        // Question mark
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "?", 
          Math.floor(powerup.x + powerup.width / 2), 
          Math.floor(powerup.y + powerup.height / 1.5)
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
    
    ctx.fillStyle = money > 0 ? "#4CAF50" : "#F44336";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`$${money}`, 90, 32);
    
    // Pause button
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(GAME_WIDTH - 50, 10, 40, 40);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("II", GAME_WIDTH - 30, 32);
    
    // Debug info
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, GAME_HEIGHT - 30, 300, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    const player = gameStateRef.current.player;
    ctx.fillText(`x:${Math.round(player.x)} y:${Math.round(player.y)} vx:${player.velocityX.toFixed(2)} vy:${player.velocityY.toFixed(2)} jump:${player.isJumping}`, 15, GAME_HEIGHT - 15);
    
    // Add camera position debug info
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, GAME_HEIGHT - 55, 300, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Camera: ${Math.round(gameStateRef.current.camera.x)} Keys: L:${keys.current.left} R:${keys.current.right} U:${keys.current.up} D:${keys.current.down}`, 15, GAME_HEIGHT - 40);
  };

  return (
    <div className="relative w-full flex justify-center">
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
          onMainMenu={() => {
            cancelAnimationFrame(requestRef.current);
            onExit();
          }}
        />
      )}
      
      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverScreen
          score={score}
          isVictory={isVictory}
          onRestart={restartGame}
          onMainMenu={() => {
            cancelAnimationFrame(requestRef.current);
            onExit();
          }}
        />
      )}
    </div>
  );
};

export default GameEngine;
