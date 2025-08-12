// Quantity calculator utility (pure function)
// JSDoc types used to provide IDE help without adding TS build

/**
 * Compute order advice based on min/max/current.
 * Besteladvies = max(0, max - current)
 * @param {{ min: number, max: number, current: number }} input
 * @returns {number}
 */
export function computeAdvice(input) {
  var min = Number(input && input.min || 0);
  var max = Number(input && input.max || 0);
  var current = Number(input && input.current || 0);
  if (!isFinite(min)) min = 0;
  if (!isFinite(max)) max = 0;
  if (!isFinite(current)) current = 0;
  if (min > max) { // guard: invalid state, clamp min to max
    min = max;
  }
  if (current < 0) current = 0;
  var advice = Math.max(0, max - current);
  return Math.floor(advice);
}


