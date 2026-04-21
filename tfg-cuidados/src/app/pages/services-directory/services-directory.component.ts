import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceModel } from '../../models/ServiceModel';
import { ServiceService } from '../../services/service.service';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../components/button/button';

@Component({
  selector: 'app-services-directory',
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

  showOffersByService(service: ServiceModel) {
    this.router.navigate(['/search-business'], {
      state: { idServicio: service.id_servicio },
    });
  }
}
