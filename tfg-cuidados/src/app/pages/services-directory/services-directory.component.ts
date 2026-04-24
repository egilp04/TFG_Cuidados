import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceModel } from '../../models/ServiceModel';
import { ServiceService } from '../../services/service.service';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../components/button/button';

/**
 * Componente para mostrar el directorio de servicios disponibles.
 * Permite a los usuarios navegar a negocios que ofrecen un servicio específico.
 */
@Component({
  selector: 'app-services-directory',
  standalone: true,
  imports: [TranslateModule, ButtonComponent],
  templateUrl: './services-directory.component.html',
  styleUrl: './services-directory.component.css',
})
export default class ServicesDirectoryComponent {
  private serviceService = inject(ServiceService);
  private router = inject(Router);

  public isLoading = true;

  public allServices = toSignal(
    this.serviceService.getServicesObservable().pipe(
      tap(() => this.isLoading = false),
      catchError((error) => {
        console.error('Error cargando el directorio:', error);
        this.isLoading = false;
        return of([]);
      })
    ),
    { initialValue: [] as ServiceModel[] }
  );

  /**
   * Navega a la vista de búsqueda de negocios filtrada por el servicio seleccionado.
   * @param service El modelo de servicio seleccionado por el usuario.
   */
  showOffersByService(service: ServiceModel): void {
    this.router.navigate(['/search-business'], {
      state: { idService: service.id_service },
    });
  }
}
