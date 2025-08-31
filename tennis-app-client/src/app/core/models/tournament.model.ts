export enum TournamentType {
  GrandSlam = 'GrandSlam',
  Masters1000 = 'Masters1000',
  ATP500 = 'ATP500',
  ATP250 = 'ATP250',
  Challenger = 'Challenger',
  ITF = 'ITF',
  Exhibition = 'Exhibition',
  TeamEvent = 'TeamEvent'
}

export enum Surface {
  HardCourt = 'HardCourt',
  Clay = 'Clay',
  Grass = 'Grass',
  Indoor = 'Indoor',
  Carpet = 'Carpet'
}

export enum TournamentStatus {
  Upcoming = 'Upcoming',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Postponed = 'Postponed'
}

export interface Tournament {
  id: number;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  type: TournamentType;
  surface: Surface;
  drawSize: number;
  prizeMoney: number;
  rankingPoints: number;
  description?: string;
  logoUrl?: string;
  status: TournamentStatus;
}

export interface CreateTournament {
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  type: TournamentType;
  surface: Surface;
  drawSize: number;
  prizeMoney: number;
  rankingPoints: number;
  description?: string;
  logoUrl?: string;
}

export interface UpdateTournament {
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  type: TournamentType;
  surface: Surface;
  drawSize: number;
  prizeMoney: number;
  rankingPoints: number;
  description?: string;
  logoUrl?: string;
  status: TournamentStatus;
}