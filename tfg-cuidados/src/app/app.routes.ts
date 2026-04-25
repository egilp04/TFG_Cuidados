import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/public-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing'),
    pathMatch: 'full',
    canActivate: [publicGuard],
  },
  {
    path: 'about-us',
    loadComponent: () => import('./pages/about-us/about-us'),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact'),
  },
  {
    path: 'manuals',
    loadComponent: () => import('./pages/manuals/manuals'),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register'),
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'modify-profile',
    loadComponent: () => import('./pages/modify-profile/modify-profile'),
    canActivate: [authGuard],
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing'),
  },
  {
    path: 'contract',
    loadComponent: () => import('./pages/contracts/contracts'),
    canActivate: [authGuard],
  },
  {
    path: 'activities',
    loadComponent: () => import('./pages/activities/activities'),
    canActivate: [authGuard],
  },
  {
    path: 'services-directory',
    loadComponent: () => import('./pages/services-directory/services-directory.component'),
    canActivate: [authGuard],
  },
  {
    path: 'messages',
    loadComponent: () => import('./pages/messages/messages'),
    canActivate: [authGuard],
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications'),
    canActivate: [authGuard],
  },
  {
    path: 'search-business',
    loadComponent: () => import('./pages/search-business/search-business'),
    canActivate: [authGuard],
  },
  {
    path: 'admin-management',
    loadComponent: () => import('./pages/management-admin/management-admin'),
    canActivate: [authGuard],
  },
  {
    path: 'global-services',
    loadComponent: () => import('./pages/management-services-global/management-services-global'),
    canActivate: [authGuard],
  },
  {
    path: 'global-times',
    loadComponent: () => import('./pages/management-time-global/management-time-global'),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard'),
    canActivate: [authGuard],
  },
  {
    path: 'admin-services',
    loadComponent: () => import('./pages/servicesbusiness/servicesbusiness'),
    canActivate: [authGuard],
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms/terms'),
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms/terms'),
  },
  {
    path: 'recover-password',
    loadComponent: () => import('./pages/recover-password/recover-password'),
  },
  {
    path: 'cookies_politics',
    loadComponent: () => import('./pages/cookies/cookies.component'),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
