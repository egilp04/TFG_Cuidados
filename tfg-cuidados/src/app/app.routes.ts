import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/public-guard';
import Landing from './pages/landing/landing';

export const routes: Routes = [
  // RUTAS PÚBLICAS (Accesibles por cualquiera)
  {
    path: '',
    component: Landing,
    pathMatch: 'full',
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing'),
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
    path: 'terms',
    loadComponent: () => import('./pages/terms/terms'),
  },
  {
    path: 'privacity',
    loadComponent: () => import('./pages/privacity/privacity.component'),
  },
  {
    path: 'cookies_politics',
    loadComponent: () => import('./pages/cookies/cookies.component'),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register'),
    canActivate: [publicGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'recover-password',
    loadComponent: () => import('./pages/recover-password/recover-password'),
    canActivate: [publicGuard],
  },

  {
    path: 'modify-profile',
    loadComponent: () => import('./pages/modify-profile/modify-profile'),
    canActivate: [authGuard],
    data: { roles: ['client', 'business', 'administrator'] },
  },
  {
    path: 'messages',
    loadComponent: () => import('./pages/messages/messages'),
    canActivate: [authGuard],
    data: { roles: ['client', 'business', 'administrator'] },
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications'),
    canActivate: [authGuard],
    data: { roles: ['client', 'business', 'administrator'] },
  },

  {
    path: 'contract',
    loadComponent: () => import('./pages/contracts/contracts'),
    canActivate: [authGuard],
    data: { roles: ['client', 'business'] },
  },
  {
    path: 'activities',
    loadComponent: () => import('./pages/activities/activities'),
    canActivate: [authGuard],
    data: { roles: ['client', 'business'] },
  },

  // RUTAS ESPECÍFICAS DE CLIENTES
  {
    path: 'services-directory',
    loadComponent: () => import('./pages/services-directory/services-directory.component'),
    canActivate: [authGuard],
    data: { roles: ['client'] },
  },
  {
    path: 'search-business',
    loadComponent: () => import('./pages/search-business/search-business'),
    canActivate: [authGuard],
    data: { roles: ['client'] },
  },

  // RUTAS ESPECÍFICAS DE LAS EMPRESAS
  {
    path: 'admin-services',
    loadComponent: () => import('./pages/servicesbusiness/servicesbusiness'),
    canActivate: [authGuard],
    data: { roles: ['business'] },
  },
  // RUTAS EXCLUSIVAS DE ADMINISTRADORES
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard'),
    canActivate: [authGuard],
    data: { roles: ['administrator'] },
  },
  {
    path: 'admin-management',
    loadComponent: () => import('./pages/management-admin/management-admin'),
    canActivate: [authGuard],
    data: { roles: ['administrator'] },
  },
  {
    path: 'global-services',
    loadComponent: () => import('./pages/management-services-global/management-services-global'),
    canActivate: [authGuard],
    data: { roles: ['administrator'] },
  },
  {
    path: 'global-times',
    loadComponent: () => import('./pages/management-time-global/management-time-global'),
    canActivate: [authGuard],
    data: { roles: ['administrator'] },
  },
  {
    path: 'global-contracts',
    loadComponent: () => import('./pages/admin-contracts/admin-contracts.component'),
    canActivate: [authGuard],
    data: { roles: ['administrator'] },
  },
  {
    path: 'global-offers',
    loadComponent: () => import('./pages/admin-offers/admin-offers.component'),
    canActivate: [authGuard],
    data: { roles: ['administrator'] },
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
