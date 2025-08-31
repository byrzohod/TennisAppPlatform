import { Player } from './player.model';
import { Tournament } from './tournament.model';

export enum MatchStatus {
  Scheduled = 'Scheduled',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Postponed = 'Postponed',
  Walkover = 'Walkover',
  Retired = 'Retired'
}

export interface Match {
  id: number;
  tournamentId: number;
  tournament?: Tournament;
  player1Id: number;
  player1?: Player;
  player2Id: number;
  player2?: Player;
  winnerId?: number;
  winner?: Player;
  round: string;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  court?: string;
  status: MatchStatus;
  scoreDisplay?: string;
  duration: number;
}

export interface CreateMatch {
  tournamentId: number;
  player1Id: number;
  player2Id: number;
  round: string;
  scheduledTime?: Date;
  court?: string;
}

export interface UpdateMatch {
  winnerId?: number;
  startTime?: Date;
  endTime?: Date;
  status: MatchStatus;
  scoreDisplay?: string;
  duration: number;
}