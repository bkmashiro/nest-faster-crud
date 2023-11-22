import { z } from 'zod';
export class GeoData {
  longitude: number;
  latitude: number;
}

export const GeoDataScheme = z.object({
  longitude: z.number(),
  latitude: z.number(),
});