export function getHomeRouteByRole(rol?: string): string {

  console.log(rol)
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
