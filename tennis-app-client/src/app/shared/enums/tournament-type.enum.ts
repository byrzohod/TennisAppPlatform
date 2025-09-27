export enum TournamentType {
  ATP250 = 0,
  ATP500 = 1,
  ATPMasters1000 = 2,
  GrandSlam = 3,
  WTA250 = 4,
  WTA500 = 5,
  WTA1000 = 6,
  Challenger = 7,
  ITF = 8,
  Davis_Cup = 9,
  Fed_Cup = 10,
  Olympics = 11,
  NextGen_ATP_Finals = 12,
  ATP_Cup = 13,
  Laver_Cup = 14,
  UTS = 15
}

export const TournamentTypeLabels: Record<TournamentType, string> = {
  [TournamentType.ATP250]: 'ATP 250',
  [TournamentType.ATP500]: 'ATP 500',
  [TournamentType.ATPMasters1000]: 'ATP Masters 1000',
  [TournamentType.GrandSlam]: 'Grand Slam',
  [TournamentType.WTA250]: 'WTA 250',
  [TournamentType.WTA500]: 'WTA 500',
  [TournamentType.WTA1000]: 'WTA 1000',
  [TournamentType.Challenger]: 'Challenger',
  [TournamentType.ITF]: 'ITF',
  [TournamentType.Davis_Cup]: 'Davis Cup',
  [TournamentType.Fed_Cup]: 'Fed Cup',
  [TournamentType.Olympics]: 'Olympics',
  [TournamentType.NextGen_ATP_Finals]: 'NextGen ATP Finals',
  [TournamentType.ATP_Cup]: 'ATP Cup',
  [TournamentType.Laver_Cup]: 'Laver Cup',
  [TournamentType.UTS]: 'UTS'
};