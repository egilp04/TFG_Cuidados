import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { AboutUs } from './pages/about-us/about-us';
import { Contact } from './pages/contact/contact';
import { Manuals } from './pages/manuals/manuals';
import { Home } from './pages/home/home';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/public-guard';
import { ModifyProfilePage } from './pages/modify-profile/modify-profile';
import { SearchBusiness } from './pages/search-business/search-business';
import { Activities } from './pages/activities/activities';
import { Contracts } from './pages/contracts/contracts';
import { Register } from './pages/register/register';
import { Notifications } from './pages/notifications/notifications';
import { Messages } from './pages/messages/messages';
import { ManagementAdmin } from './pages/management-admin/management-admin';
import { ManagementTimeGlobal } from './pages/management-time-global/management-time-global';
import { ManagementServicesGlobal } from './pages/management-services-global/management-services-global';
import { Dashboard } from './pages/dashboard/dashboard';
import { Servicesbusiness } from './pages/servicesbusiness/servicesbusiness';
import { Terms } from './pages/terms/terms';
export const routes: Routes = [
  { path: '', component: Landing, pathMatch: 'full', canActivate: [publicGuard] },
  { path: 'about-us', component: AboutUs },
  { path: 'contact', component: Contact },
  { path: 'manuals', component: Manuals },
  { path: 'register', component: Register, runGuardsAndResolvers: 'always' },
  { path: 'modify-profile', component: ModifyProfilePage, canActivate: [authGuard] },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'contract', component: Contracts, canActivate: [authGuard] },
  { path: 'activities', component: Activities, canActivate: [authGuard] },
  { path: 'messages', component: Messages, canActivate: [authGuard] },
  { path: 'notifications', component: Notifications, canActivate: [authGuard] },
  { path: 'search-business', component: SearchBusiness, canActivate: [authGuard] },
  { path: 'admin-gestion', component: ManagementAdmin, canActivate: [authGuard] },
  { path: 'global-services', component: ManagementServicesGlobal, canActivate: [authGuard] },
  { path: 'global-times', component: ManagementTimeGlobal, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'admin-services', component: Servicesbusiness, canActivate: [authGuard] },
  { path: 'terms', component: Terms },

  {
    path: 'recover-password',
    loadComponent: () =>
      import('./pages/recover-password/recover-password').then((m) => m.RecoverPasswordPage),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
