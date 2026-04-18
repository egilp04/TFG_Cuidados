import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServicioModel } from '../../models/Servicio';
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
    initialValue: [] as ServicioModel[],
  });

  showOffersByService(servicio: ServicioModel) {
    this.router.navigate(['/search-business'], {
      state: { idServicio: servicio.id_servicio },
    });
  }
}
