export function getHomeRouteByRole(rol?: string): string {
  switch (rol) {
    case 'administrador':
      return '/dashboard';
    case 'empresa':
      return '/activities';
    case 'cliente':
      return '/services-directory';
    default:
      return '/';
  }
}
