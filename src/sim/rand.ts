/**
 * Seedable PRNG and uncertainty system for AI Habitat
 * Implements mulberry32 PRNG for reproducible randomness
 */

// Mulberry32 seedable PRNG implementation
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // Generate next random number [0, 1)
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Get current seed/state for reproducibility
  getSeed(): number {
    return this.state;
  }

  // Reset to specific seed
  setSeed(seed: number): void {
    this.state = seed;
  }
}

// Global PRNG instance
let globalRng: SeededRandom;
let globalSeed: number;

// Initialize with random seed or provided seed
export function initializeRandom(seed?: number): void {
  globalSeed = seed ?? Math.floor(Math.random() * 2147483647);
  globalRng = new SeededRandom(globalSeed);
}

// Get current seed
export function getCurrentSeed(): number {
  return globalSeed;
}

// Basic random functions
export function rng(): number {
  if (!globalRng) {
    initializeRandom();
  }
  return globalRng.next();
}

// Random integer [min, max)
export function rngInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min)) + min;
}

// Random float [min, max)
export function rngFloat(min: number, max: number): number {
  return rng() * (max - min) + min;
}

// Normal distribution using Box-Muller transform
let nextGaussian: number | null = null;
export function rngNorm(mean: number = 0, stdDev: number = 1): number {
  if (nextGaussian !== null) {
    const result = nextGaussian;
    nextGaussian = null;
    return result * stdDev + mean;
  }

  let u = 0, v = 0;
  while (u === 0) u = rng(); // Converting [0,1) to (0,1)
  while (v === 0) v = rng();

  const z0 = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  const z1 = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);

  nextGaussian = z1;
  return z0 * stdDev + mean;
}

// Weighted random selection
export function pickWeighted<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must have same length');
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive');
  }

  let random = rng() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  // Fallback (should never reach here with valid weights)
  return items[items.length - 1];
}

// Random boolean with probability
export function rngBool(probability: number = 0.5): boolean {
  return rng() < probability;
}

// Random element from array
export function rngChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }
  return array[rngInt(0, array.length)];
}

// Shuffle array in-place (Fisher-Yates)
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = rngInt(0, i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Sample without replacement
export function sample<T>(array: T[], count: number): T[] {
  if (count >= array.length) {
    return shuffle([...array]);
  }

  const result: T[] = [];
  const indices = new Set<number>();

  while (result.length < count) {
    const index = rngInt(0, array.length);
    if (!indices.has(index)) {
      indices.add(index);
      result.push(array[index]);
    }
  }

  return result;
}

// Perlin-like noise for smooth variation
export class NoiseGenerator {
  private permutation: number[];

  constructor(seed?: number) {
    if (seed !== undefined) {
      const tempRng = new SeededRandom(seed);
      this.permutation = Array.from({length: 256}, (_, i) => i);
      // Shuffle using seeded random
      for (let i = this.permutation.length - 1; i > 0; i--) {
        const j = Math.floor(tempRng.next() * (i + 1));
        [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
      }
    } else {
      this.permutation = Array.from({length: 256}, (_, i) => i);
      shuffle(this.permutation);
    }

    // Duplicate to avoid wrapping
    this.permutation = [...this.permutation, ...this.permutation];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number): number {
    return (hash & 1) === 0 ? x : -x;
  }

  // 1D noise
  noise1D(x: number): number {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const u = this.fade(x);

    return this.lerp(
      this.grad(this.permutation[X], x),
      this.grad(this.permutation[X + 1], x - 1),
      u
    );
  }

  // Octave noise for more complex patterns
  octaveNoise(x: number, octaves: number = 4, persistence: number = 0.5): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise1D(x * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return value / maxValue;
  }
}

// Utility for time-based seeds
export function generateTimeSeed(): number {
  return Date.now() % 2147483647;
}

// Create reproducible variation within bounds
export function jitter(baseValue: number, variation: number): number {
  return baseValue + rngFloat(-variation, variation);
}

// Probability distributions
export namespace Distributions {
  export function exponential(lambda: number): number {
    return -Math.log(1 - rng()) / lambda;
  }

  export function poisson(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;

    do {
      k++;
      p *= rng();
    } while (p > L);

    return k - 1;
  }

  export function uniform(min: number, max: number): number {
    return rngFloat(min, max);
  }

  export function triangular(min: number, max: number, mode: number): number {
    const u = rng();
    const c = (mode - min) / (max - min);

    if (u < c) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }
}

// Initialize on module load
initializeRandom();