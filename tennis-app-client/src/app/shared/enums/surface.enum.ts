export enum Surface {
  HardCourt = 0,
  Clay = 1,
  Grass = 2,
  Indoor = 3,
  Carpet = 4
}

export const SurfaceLabels: Record<Surface, string> = {
  [Surface.HardCourt]: 'Hard Court',
  [Surface.Clay]: 'Clay',
  [Surface.Grass]: 'Grass',
  [Surface.Indoor]: 'Indoor',
  [Surface.Carpet]: 'Carpet'
};