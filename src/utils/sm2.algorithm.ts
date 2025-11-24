/**
 * SM-2 Algorithm Implementation
 * Based on SuperMemo 2 algorithm by Piotr Wozniak
 *
 * Quality ratings (0-5):
 * 5 - Perfect response
 * 4 - Correct response after hesitation
 * 3 - Correct response with difficulty
 * 2 - Incorrect but remembered
 * 1 - Incorrect but familiar
 * 0 - Complete blackout
 */

export interface SM2Result {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: Date;
  state: 'new' | 'learning' | 'review' | 'relearning';
}

export interface SM2Input {
  quality: number; // 0-5
  repetitions: number;
  easeFactor: number;
  interval: number;
}

/**
 * Calculate next review using SM-2 algorithm
 * @param input - Current flashcard state and quality rating
 * @returns Updated flashcard state
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, repetitions, easeFactor, interval } = input;

  // Validate quality (0-5)
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  let newRepetitions = repetitions;
  let newInterval = interval;
  let newEaseFactor = easeFactor;
  let state: 'new' | 'learning' | 'review' | 'relearning' = 'review';

  // Step 1: Update Easiness Factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure EF is at least 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // Step 2: Calculate interval based on quality
  if (quality < 3) {
    // Failed - Reset to beginning
    newRepetitions = 0;
    newInterval = 0; // 0 indicates intraday review (e.g. 10 mins)
    state = 'relearning';
  } else {
    // Passed - Calculate next interval
    if (repetitions === 0) {
      newInterval = 1;
      state = 'learning';
    } else if (repetitions === 1) {
      // Modified SM-2: Reduced from 6 to 3 days for tighter repetition
      newInterval = 3;
      state = 'learning';
    } else {
      newInterval = Math.round(interval * newEaseFactor);
      state = 'review';
    }

    newRepetitions = repetitions + 1;
  }

  // Step 3: Calculate next review date
  const nextReviewDate = new Date();

  if (newInterval === 0) {
    // Intraday review: 10 minutes
    nextReviewDate.setMinutes(nextReviewDate.getMinutes() + 10);
  } else {
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    // Set to start of day (midnight)
    nextReviewDate.setHours(0, 0, 0, 0);
  }

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    nextReviewDate,
    state,
  };
}

/**
 * Get quality rating from simplified rating (1-4)
 * Anki-style: Again, Hard, Good, Easy
 * @param rating - 1=Again, 2=Hard, 3=Good, 4=Easy
 * @returns SM-2 quality (0-5)
 */
export function ratingToQuality(rating: number): number {
  const ratingMap: { [key: number]: number } = {
    1: 0, // Again -> Complete blackout
    2: 3, // Hard -> Correct with difficulty
    3: 4, // Good -> Correct after hesitation
    4: 5, // Easy -> Perfect response
  };

  return ratingMap[rating] ?? 3;
}

/**
 * Check if a flashcard is due for review
 * @param nextReviewDate - Next scheduled review date
 * @returns true if due for review
 */
export function isDue(nextReviewDate: Date | null): boolean {
  if (!nextReviewDate) return true;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return nextReviewDate <= now;
}

/**
 * Get initial SM-2 values for a new flashcard
 */
export function getInitialSM2Values(): Omit<SM2Result, 'nextReviewDate'> {
  return {
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    state: 'new',
  };
}
