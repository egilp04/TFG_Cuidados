import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceModel } from '../../models/ServiceModel';
import { ServiceService } from '../../services/service.service';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../components/button/button';

/**
 * Component for displaying the directory of available services.
 * Allows users to navigate to businesses offering a specific service.
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

  public allServices = toSignal(this.serviceService.getServicesObservable(), {
    initialValue: [] as ServiceModel[],
  });

  /**
   * Navigates to the business search view filtered by the selected service.
   * @param service The service model selected by the user.
   */
  showOffersByService(service: ServiceModel): void {
    this.router.navigate(['/search-business'], {
      state: { idService: service.id_service },
    });
  }
}