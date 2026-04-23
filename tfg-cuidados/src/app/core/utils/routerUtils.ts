export function getHomeRouteByRole(rol?: string): string {
  switch (rol) {
    case 'administrator':
      return '/dashboard';
    case 'business':
      return '/activities';
    case 'client':
      return '/services-directory';
    default:
      return '/';
  }
}
