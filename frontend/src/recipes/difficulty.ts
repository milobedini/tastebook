import type { components } from '../api/schema';

type Difficulty = components['schemas']['DifficultyEnum'];

export const difficultyLabels: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
