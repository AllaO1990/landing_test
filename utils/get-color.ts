import { scaleLinear } from 'd3-scale';
import { color, HSLColor, RGBColor } from 'd3-color';

export const getColor = scaleLinear<string, string, never>(
  [1, 50, 100],
  ['#FF103B', '#EEF1F9', '#039322']
);

export const getRGBA = (
  value: string,
  opacity: number
): RGBColor | HSLColor | null => {
  const c: RGBColor | HSLColor | null = color(value);
  if (c) {
    c.opacity = opacity;
  }

  return c;
};
