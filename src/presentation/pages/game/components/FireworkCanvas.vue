<template>
    <canvas
        ref="canvasRef"
        class="fixed inset-0 pointer-events-none"
        style="z-index: 51"
    />
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

interface Particle {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

interface Shell {
    x: number;
    y: number;
    targetY: number;
    velocityY: number;
    color: string;
    trailTimer: number;
}

interface Firework {
    shell: Shell | null;
    particles: Particle[];
}

const GRAVITY = 0.03;
const PARTICLE_COUNT_MIN = 40;
const PARTICLE_COUNT_MAX = 60;
const SPAWN_INTERVAL_MIN = 300;
const SPAWN_INTERVAL_MAX = 600;
const SHELL_SPEED = -8;
const TRAIL_INTERVAL = 3;

const canvasRef = ref<HTMLCanvasElement | null>(null);
let fireworks: Firework[] = [];
let animationFrameId = 0;
let spawnTimeoutId = 0;

const getThemeColors = (): string[] => {
    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--color-primary").trim();
    const accent = style.getPropertyValue("--color-accent").trim();
    const primaryLight = style.getPropertyValue("--color-primary-light").trim();
    return [
        primary,
        accent,
        primaryLight,
        "#FFD700",
        "#FF6B6B",
        "#4ECDC4",
        "#A78BFA",
        "#FB923C",
    ].filter(Boolean);
};

const createExplosion = (x: number, y: number, colors: string[]): Particle[] => {
    const particleCount = PARTICLE_COUNT_MIN + Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN));
    const particles: Particle[] = [];
    const mainColor = colors[Math.floor(Math.random() * colors.length)];

    for (let index = 0; index < particleCount; index++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4;
        const maxLife = 60 + Math.random() * 40;
        particles.push({
            x,
            y,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            life: maxLife,
            maxLife,
            color: Math.random() < 0.7 ? mainColor : colors[Math.floor(Math.random() * colors.length)],
            size: 2.5 + Math.random() * 2,
        });
    }

    return particles;
};

const createFirework = (width: number, height: number, colors: string[]): Firework => {
    const startX = width * 0.15 + Math.random() * width * 0.7;
    const targetY = height * 0.1 + Math.random() * height * 0.35;

    return {
        shell: {
            x: startX,
            y: height,
            targetY,
            velocityY: SHELL_SPEED - Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            trailTimer: 0,
        },
        particles: [],
    };
};

const scheduleNextFirework = (width: number, height: number, colors: string[]) => {
    const delay = SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
    spawnTimeoutId = window.setTimeout(() => {
        fireworks.push(createFirework(width, height, colors));
        scheduleNextFirework(width, height, colors);
    }, delay);
};

const startAnimation = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    const resize = () => {
        canvas.width = window.innerWidth * ratio;
        canvas.height = window.innerHeight * ratio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = getThemeColors();
    fireworks.push(createFirework(window.innerWidth, window.innerHeight, colors));
    scheduleNextFirework(window.innerWidth, window.innerHeight, colors);

    const animate = () => {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (const firework of fireworks) {
            // 彈體上升階段
            if (firework.shell) {
                const shell = firework.shell;
                shell.y += shell.velocityY;
                shell.trailTimer++;

                // 畫彈體
                context.globalAlpha = 1;
                context.fillStyle = shell.color;
                context.beginPath();
                context.arc(shell.x, shell.y, 3, 0, Math.PI * 2);
                context.fill();

                // 尾跡粒子
                if (shell.trailTimer % TRAIL_INTERVAL === 0) {
                    firework.particles.push({
                        x: shell.x + (Math.random() - 0.5) * 2,
                        y: shell.y,
                        velocityX: (Math.random() - 0.5) * 0.3,
                        velocityY: Math.random() * 0.5 + 0.5,
                        life: 15 + Math.random() * 10,
                        maxLife: 25,
                        color: shell.color,
                        size: 1.5 + Math.random(),
                    });
                }

                // 到達目標高度 → 爆炸
                if (shell.y <= shell.targetY) {
                    firework.particles.push(...createExplosion(shell.x, shell.y, colors));
                    firework.shell = null;
                }
            }

            // 粒子更新
            for (const particle of firework.particles) {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.velocityY += GRAVITY;
                particle.life--;

                const opacity = particle.life / particle.maxLife;
                context.globalAlpha = opacity;
                context.fillStyle = particle.color;
                context.beginPath();
                context.arc(particle.x, particle.y, Math.max(0, particle.size * opacity), 0, Math.PI * 2);
                context.fill();
            }
            firework.particles = firework.particles.filter(particle => particle.life > 0);
        }
        fireworks = fireworks.filter(firework => firework.shell !== null || firework.particles.length > 0);

        context.globalAlpha = 1;
        animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    onBeforeUnmount(() => {
        cancelAnimationFrame(animationFrameId);
        clearTimeout(spawnTimeoutId);
        window.removeEventListener("resize", resize);
        fireworks = [];
    });
};

onMounted(startAnimation);
</script>
