import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const MAZE_WIDTH = 25;
const MAZE_HEIGHT = 15;
const WALL_HEIGHT = 100;
const PERSPECTIVE = 400;
const FOV = 60;

// Лабиринт: 1 = стена, 0 = проход, 2 = выход
const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

interface Player {
  x: number;
  y: number;
  angle: number;
}

const Index = () => {
  const [gameState, setGameState] = useState("menu");
  const [player, setPlayer] = useState<Player>({ x: 1.5, y: 1.5, angle: 0 });
  const [skebob, setSkebob] = useState({ x: 1.5, y: 13.5, angle: 0 });
  const [isBlinded, setIsBlinded] = useState(false);
  const [blindCooldown, setBlindCooldown] = useState(0);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([1250, 980, 765, 432, 201]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keys, setKeys] = useState({
    w: false,
    s: false,
    a: false,
    d: false,
    left: false,
    right: false,
  });

  const isWall = (x: number, y: number) => {
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    if (gridX < 0 || gridX >= MAZE_WIDTH || gridY < 0 || gridY >= MAZE_HEIGHT)
      return true;
    return MAZE[gridY][gridX] === 1;
  };

  const isExit = (x: number, y: number) => {
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    if (gridX < 0 || gridX >= MAZE_WIDTH || gridY < 0 || gridY >= MAZE_HEIGHT)
      return false;
    return MAZE[gridY][gridX] === 2;
  };

  const castRay = (startX: number, startY: number, angle: number) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let x = startX;
    let y = startY;
    let distance = 0;

    while (distance < 30) {
      x += dx * 0.1;
      y += dy * 0.1;
      distance += 0.1;

      if (isWall(x, y)) {
        return { distance, hitWall: true };
      }
    }

    return { distance: 30, hitWall: false };
  };

  const render3D = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Очистка
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Пол
    ctx.fillStyle = "#2d2d2d";
    ctx.fillRect(0, height / 2, width, height / 2);

    // Потолок
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height / 2);

    // Рендер стен
    const numRays = width / 2;
    for (let i = 0; i < numRays; i++) {
      const rayAngle =
        player.angle -
        (FOV / 2) * (Math.PI / 180) +
        (i / numRays) * FOV * (Math.PI / 180);
      const ray = castRay(player.x, player.y, rayAngle);

      if (ray.hitWall) {
        const wallHeight = (WALL_HEIGHT / ray.distance) * PERSPECTIVE;
        const wallTop = height / 2 - wallHeight / 2;
        const wallBottom = height / 2 + wallHeight / 2;

        // Затенение по расстоянию
        const brightness = Math.max(0, 1 - ray.distance / 15);
        const colorValue = Math.floor(brightness * 200);

        ctx.fillStyle = `rgb(${colorValue + 55}, ${colorValue + 20}, ${colorValue + 20})`;
        ctx.fillRect(i * 2, wallTop, 2, wallHeight);

        // Добавляем текстуру стен
        if (i % 4 === 0) {
          ctx.fillStyle = `rgb(${colorValue + 30}, ${colorValue + 10}, ${colorValue + 10})`;
          ctx.fillRect(i * 2, wallTop, 1, wallHeight);
        }
      }
    }

    // Рендер СКЕБОБА
    const skebobDx = skebob.x - player.x;
    const skebobDy = skebob.y - player.y;
    const skebobDistance = Math.sqrt(skebobDx * skebobDx + skebobDy * skebobDy);
    const skebobAngle = Math.atan2(skebobDy, skebobDx);
    const angleDiff = skebobAngle - player.angle;

    // Нормализация угла
    let normalizedAngle = angleDiff;
    while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
    while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

    const fovRad = FOV * (Math.PI / 180);
    if (Math.abs(normalizedAngle) < fovRad / 2 && skebobDistance < 15) {
      const skebobScreenX =
        width / 2 + (normalizedAngle / (fovRad / 2)) * (width / 2);
      const skebobSize = (80 / skebobDistance) * PERSPECTIVE;
      const skebobTop = height / 2 - skebobSize / 2;

      // Рендер СКЕБОБА
      ctx.fillStyle = isBlinded
        ? "rgba(139, 69, 19, 0.3)"
        : "rgba(139, 69, 19, 0.8)";
      ctx.fillRect(
        skebobScreenX - skebobSize / 2,
        skebobTop,
        skebobSize,
        skebobSize,
      );

      // Глаза СКЕБОБА
      if (!isBlinded) {
        ctx.fillStyle = "red";
        ctx.fillRect(
          skebobScreenX - skebobSize / 3,
          skebobTop + skebobSize / 4,
          skebobSize / 6,
          skebobSize / 6,
        );
        ctx.fillRect(
          skebobScreenX + skebobSize / 6,
          skebobTop + skebobSize / 4,
          skebobSize / 6,
          skebobSize / 6,
        );
      }
    }

    // Crosshair
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 10, height / 2);
    ctx.lineTo(width / 2 + 10, height / 2);
    ctx.moveTo(width / 2, height / 2 - 10);
    ctx.lineTo(width / 2, height / 2 + 10);
    ctx.stroke();

    // Миникарта
    const miniSize = 120;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(width - miniSize - 10, 10, miniSize, miniSize);

    // Стены на миникарте
    ctx.fillStyle = "#8B0000";
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (MAZE[y][x] === 1) {
          ctx.fillRect(
            width - miniSize - 10 + (x * miniSize) / MAZE_WIDTH,
            10 + (y * miniSize) / MAZE_HEIGHT,
            miniSize / MAZE_WIDTH,
            miniSize / MAZE_HEIGHT,
          );
        }
      }
    }

    // Игрок на миникарте
    ctx.fillStyle = "blue";
    ctx.fillRect(
      width - miniSize - 10 + (player.x * miniSize) / MAZE_WIDTH - 2,
      10 + (player.y * miniSize) / MAZE_HEIGHT - 2,
      4,
      4,
    );

    // СКЕБОБ на миникарте
    ctx.fillStyle = isBlinded
      ? "rgba(139, 69, 19, 0.3)"
      : "rgba(139, 69, 19, 1)";
    ctx.fillRect(
      width - miniSize - 10 + (skebob.x * miniSize) / MAZE_WIDTH - 2,
      10 + (skebob.y * miniSize) / MAZE_HEIGHT - 2,
      4,
      4,
    );
  };

  const movePlayer = (dx: number, dy: number) => {
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (!isWall(newX, player.y)) {
      setPlayer((prev) => ({ ...prev, x: newX }));
    }
    if (!isWall(player.x, newY)) {
      setPlayer((prev) => ({ ...prev, y: newY }));
    }
  };

  const findPath = (
    start: { x: number; y: number },
    target: { x: number; y: number },
  ) => {
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return start;

    const moveSpeed = 0.02;
    const newX = start.x + (dx / distance) * moveSpeed;
    const newY = start.y + (dy / distance) * moveSpeed;

    if (!isWall(newX, start.y)) {
      if (!isWall(start.x, newY)) {
        return { x: newX, y: newY };
      }
      return { x: newX, y: start.y };
    }
    if (!isWall(start.x, newY)) {
      return { x: start.x, y: newY };
    }

    return start;
  };

  useEffect(() => {
    if (gameState === "playing") {
      const gameLoop = setInterval(() => {
        setScore((prev) => prev + 1);

        if (isExit(player.x, player.y)) {
          setGameState("victory");
          return;
        }

        if (blindCooldown > 0) {
          setBlindCooldown((prev) => prev - 1);
        }

        render3D();
      }, 50);

      return () => clearInterval(gameLoop);
    }
  }, [gameState, player, skebob, isBlinded, blindCooldown]);

  useEffect(() => {
    if (gameState === "playing") {
      const skebobLoop = setInterval(() => {
        if (!isBlinded) {
          setSkebob((prev) => {
            const newPos = findPath(prev, { x: player.x, y: player.y });
            const distance = Math.sqrt(
              (newPos.x - player.x) ** 2 + (newPos.y - player.y) ** 2,
            );
            if (distance < 0.5) {
              setGameState("gameOver");
            }
            return newPos;
          });
        }
      }, 100);

      return () => clearInterval(skebobLoop);
    }
  }, [gameState, player, isBlinded]);

  useEffect(() => {
    if (gameState === "playing") {
      const moveLoop = setInterval(() => {
        const moveSpeed = 0.03;
        const rotSpeed = 0.02;

        let dx = 0,
          dy = 0;
        if (keys.w) {
          dx += Math.cos(player.angle) * moveSpeed;
          dy += Math.sin(player.angle) * moveSpeed;
        }
        if (keys.s) {
          dx -= Math.cos(player.angle) * moveSpeed;
          dy -= Math.sin(player.angle) * moveSpeed;
        }
        if (keys.a) {
          dx += Math.cos(player.angle - Math.PI / 2) * moveSpeed;
          dy += Math.sin(player.angle - Math.PI / 2) * moveSpeed;
        }
        if (keys.d) {
          dx += Math.cos(player.angle + Math.PI / 2) * moveSpeed;
          dy += Math.sin(player.angle + Math.PI / 2) * moveSpeed;
        }

        if (dx !== 0 || dy !== 0) {
          movePlayer(dx, dy);
        }

        if (keys.left)
          setPlayer((prev) => ({ ...prev, angle: prev.angle - rotSpeed }));
        if (keys.right)
          setPlayer((prev) => ({ ...prev, angle: prev.angle + rotSpeed }));

        render3D();
      }, 16);

      return () => clearInterval(moveLoop);
    }
  }, [keys, gameState, player]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      e.preventDefault();

      if (e.key === "w" || e.key === "W")
        setKeys((prev) => ({ ...prev, w: true }));
      if (e.key === "s" || e.key === "S")
        setKeys((prev) => ({ ...prev, s: true }));
      if (e.key === "a" || e.key === "A")
        setKeys((prev) => ({ ...prev, a: true }));
      if (e.key === "d" || e.key === "D")
        setKeys((prev) => ({ ...prev, d: true }));
      if (e.key === "ArrowLeft") setKeys((prev) => ({ ...prev, left: true }));
      if (e.key === "ArrowRight") setKeys((prev) => ({ ...prev, right: true }));
      if (e.key === " ") blindSkebob();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W")
        setKeys((prev) => ({ ...prev, w: false }));
      if (e.key === "s" || e.key === "S")
        setKeys((prev) => ({ ...prev, s: false }));
      if (e.key === "a" || e.key === "A")
        setKeys((prev) => ({ ...prev, a: false }));
      if (e.key === "d" || e.key === "D")
        setKeys((prev) => ({ ...prev, d: false }));
      if (e.key === "ArrowLeft") setKeys((prev) => ({ ...prev, left: false }));
      if (e.key === "ArrowRight")
        setKeys((prev) => ({ ...prev, right: false }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState === "playing") {
        const sensitivity = 0.003;
        const deltaX = e.movementX * sensitivity;
        setPlayer((prev) => ({ ...prev, angle: prev.angle + deltaX }));
      }
    };

    const handleClick = () => {
      if (gameState === "playing") {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.requestPointerLock();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [gameState, blindCooldown]);

  const startGame = () => {
    setGameState("playing");
    setPlayer({ x: 1.5, y: 1.5, angle: 0 });
    setSkebob({ x: 1.5, y: 13.5, angle: 0 });
    setScore(0);
    setIsBlinded(false);
    setBlindCooldown(0);
  };

  const blindSkebob = () => {
    if (blindCooldown === 0) {
      setIsBlinded(true);
      setBlindCooldown(100);
      setTimeout(() => setIsBlinded(false), 3000);
    }
  };

  const backToMenu = () => {
    setGameState("menu");
    if (score > Math.min(...highScores)) {
      const newScores = [...highScores, score]
        .sort((a, b) => b - a)
        .slice(0, 5);
      setHighScores(newScores);
    }
  };

  if (gameState === "menu") {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-red-900 via-black to-red-900 flex items-center justify-center text-white overflow-hidden">
        <div className="text-center space-y-8 max-w-md">
          <h1
            className="text-6xl font-black tracking-wider mb-4"
            style={{ fontFamily: "Impact, sans-serif" }}
          >
            СКЕБОБ
          </h1>
          <p className="text-xl opacity-80 mb-8">3D ХОРРОР ЛАБИРИНТ</p>

          <div className="space-y-4">
            <Button
              onClick={startGame}
              className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-4 text-xl"
            >
              ИГРАТЬ
            </Button>

            <Card className="bg-black/50 border-red-800">
              <CardHeader>
                <CardTitle className="text-red-400 text-center">
                  РЕКОРДЫ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {highScores.map((score, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-white"
                    >
                      <span>#{index + 1}</span>
                      <span>{score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="h-screen w-screen bg-black text-white relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="absolute inset-0 w-full h-full object-cover cursor-none"
          style={{ imageRendering: "pixelated" }}
        />

        <div className="absolute top-4 left-4 text-2xl font-bold z-10 bg-black/50 px-4 py-2 rounded">
          ОЧКИ: {score}
        </div>

        <div className="absolute top-4 right-4 space-y-2 z-10">
          <Button
            onClick={blindSkebob}
            disabled={blindCooldown > 0}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold"
          >
            {blindCooldown > 0
              ? `ПЕРЕЗАРЯДКА ${Math.ceil(blindCooldown / 20)}`
              : "ОСЛЕПИТЬ"}
          </Button>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-10 bg-black/50 px-4 py-2 rounded">
          <p className="text-sm opacity-70">
            WASD - движение | Мышь - поворот | ПРОБЕЛ - ослепление | Кликни для
            захвата курсора
          </p>
        </div>
      </div>
    );
  }

  if (gameState === "victory") {
    return (
      <div className="h-screen w-screen bg-green-900 flex items-center justify-center text-white overflow-hidden">
        <div className="text-center space-y-6">
          <h1
            className="text-6xl font-black text-green-400"
            style={{ fontFamily: "Impact, sans-serif" }}
          >
            ПОБЕДА!
          </h1>
          <p className="text-2xl">ТЫ СБЕЖАЛ ОТ СКЕБОБА!</p>
          <p className="text-xl">Твой счет: {score}</p>

          <div className="space-y-4">
            <Button
              onClick={startGame}
              className="bg-green-800 hover:bg-green-700 text-white font-bold py-4 px-8 text-xl"
            >
              ИГРАТЬ СНОВА
            </Button>
            <Button
              onClick={backToMenu}
              variant="outline"
              className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
            >
              В МЕНЮ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "gameOver") {
    return (
      <div className="h-screen w-screen bg-red-900 flex items-center justify-center text-white overflow-hidden">
        <div className="text-center space-y-6">
          <h1
            className="text-6xl font-black text-red-400"
            style={{ fontFamily: "Impact, sans-serif" }}
          >
            ПОРАЖЕНИЕ!
          </h1>
          <p className="text-2xl">СКЕБОБ ПОЙМАЛ ТЕБЯ!</p>
          <p className="text-xl">Твой счет: {score}</p>

          <div className="space-y-4">
            <Button
              onClick={startGame}
              className="bg-red-800 hover:bg-red-700 text-white font-bold py-4 px-8 text-xl"
            >
              ИГРАТЬ СНОВА
            </Button>
            <Button
              onClick={backToMenu}
              variant="outline"
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
            >
              В МЕНЮ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
