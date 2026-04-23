export function getHomeRouteByRole(rol?: string): string {

  console.log(rol)
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
