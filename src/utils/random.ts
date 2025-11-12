/**
 * Generates a random integer between `0` and `max`.
 *
 * @param max Range maximum
 * @return Random integer
 */
export function randInt(max: number): number;

/**
 * Generates a random integer between `min` and `max`.
 *
 * @param min Range minimum
 * @param max Range maximum
 * @return Random integer
 */
export function randInt(min: number, max: number): number;

/**
 * Generates a random integer between `min` and `max` with given stride.
 *
 * @param min Range minimum
 * @param max Range maximum
 * @param stride Stride from range minimum
 * @return Random integer
 */
export function randInt(min: number, max: number, stride: number): number;

export function randInt(
  ...args: [number] | [number, number] | [number, number, number]
): number {
  let min: number;
  let max: number;
  let stride: number;

  switch (args.length) {
    case 1:
      min = 0;
      max = args[0];
      stride = 1;
      break;

    case 2:
      min = args[0];
      max = args[1];
      stride = 1;
      break;

    case 3:
      min = args[0];
      max = args[1];
      stride = args[2];
      break;

    default:
      throw new Error('Invalid number of arguments');
  }

  const range = Math.floor((max - min) / stride);
  return min + stride * Math.floor(Math.random() * range);
}

/**
 * Generates a random HEX color.
 *
 * @returns HEX color string
 */
export function randHexColor(): string {
  const r = randInt(255);
  const g = randInt(255);
  const b = randInt(255);

  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
