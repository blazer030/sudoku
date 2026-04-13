<template>
    <canvas
        ref="canvasRef"
        class="fixed inset-0 pointer-events-none z-40"
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

interface Firework {
    particles: Particle[];
}

const GRAVITY = 0.04;
const PARTICLE_COUNT_MIN = 30;
const PARTICLE_COUNT_MAX = 50;
const SPAWN_INTERVAL_MIN = 400;
const SPAWN_INTERVAL_MAX = 800;

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

const createFirework = (width: number, height: number, colors: string[]): Firework => {
    const centerX = Math.random() * width;
    const centerY = Math.random() * height * 0.6;
    const particleCount = PARTICLE_COUNT_MIN + Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN));
    const particles: Particle[] = [];

    for (let index = 0; index < particleCount; index++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4;
        const maxLife = 60 + Math.random() * 40;
        particles.push({
            x: centerX,
            y: centerY,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            life: maxLife,
            maxLife,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 1.5 + Math.random() * 1.5,
        });
    }

    return { particles };
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
            for (const particle of firework.particles) {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.velocityY += GRAVITY;
                particle.life--;

                const opacity = particle.life / particle.maxLife;
                context.globalAlpha = opacity;
                context.fillStyle = particle.color;
                context.beginPath();
                context.arc(particle.x, particle.y, particle.size * opacity, 0, Math.PI * 2);
                context.fill();
            }
            firework.particles = firework.particles.filter(particle => particle.life > 0);
        }
        fireworks = fireworks.filter(firework => firework.particles.length > 0);

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
