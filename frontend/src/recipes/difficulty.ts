import type { components } from '../api/schema';

type Difficulty = components['schemas']['DifficultyEnum'];

export const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

export const difficultyLabels: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
