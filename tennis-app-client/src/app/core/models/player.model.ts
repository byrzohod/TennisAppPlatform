export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  country: string;
  dateOfBirth: Date;
  age: number;
  profileImageUrl?: string;
  currentRanking: number;
  rankingPoints: number;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlayer {
  firstName: string;
  lastName: string;
  country: string;
  dateOfBirth: Date;
  profileImageUrl?: string;
}

export interface UpdatePlayer {
  firstName: string;
  lastName: string;
  country: string;
  dateOfBirth: Date;
  profileImageUrl?: string;
  currentRanking: number;
  rankingPoints: number;
}