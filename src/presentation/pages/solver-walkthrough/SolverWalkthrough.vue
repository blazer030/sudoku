<template>
    <div class="grid grid-cols-9">
        <div
            v-for="row in 9"
            :key="`row-${row}`"
            class="contents"
        >
            <div
                v-for="column in 9"
                :key="`cell-${row}-${column}`"
                :data-testid="`solver-cell-${row - 1}-${column - 1}`"
                class="aspect-square flex items-center justify-center border"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
</script>
