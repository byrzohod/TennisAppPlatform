import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/tournaments', pathMatch: 'full' },
  { 
    path: 'tournaments', 
    loadComponent: () => import('./features/tournaments/tournament-list/tournament-list').then(m => m.TournamentListComponent)
  },
  { 
    path: 'players', 
    loadComponent: () => import('./features/players/player-list/player-list').then(m => m.PlayerListComponent)
  },
  { 
    path: 'rankings', 
    loadComponent: () => import('./features/rankings/rankings-table/rankings-table').then(m => m.RankingsTableComponent)
  },
  { 
    path: 'blog', 
    loadComponent: () => import('./features/blog/blog-list/blog-list').then(m => m.BlogListComponent)
  }
];
