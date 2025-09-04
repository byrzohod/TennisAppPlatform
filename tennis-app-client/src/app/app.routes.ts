import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'players',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./features/players/player-list/player-list.component').then(m => m.PlayerListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./features/players/player-form/player-form.component').then(m => m.PlayerFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/players/player-detail/player-detail.component').then(m => m.PlayerDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/players/player-form/player-form.component').then(m => m.PlayerFormComponent)
      }
    ]
  },
  {
    path: 'tournaments',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tournaments/tournament-list/tournament-list.component').then(m => m.TournamentListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/tournaments/tournament-form/tournament-form.component').then(m => m.TournamentFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/tournaments/tournament-detail/tournament-detail.component').then(m => m.TournamentDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/tournaments/tournament-form/tournament-form.component').then(m => m.TournamentFormComponent)
      },
      {
        path: ':id/bracket',
        loadComponent: () => import('./features/tournaments/bracket/bracket.component').then(m => m.BracketComponent)
      }
    ]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
