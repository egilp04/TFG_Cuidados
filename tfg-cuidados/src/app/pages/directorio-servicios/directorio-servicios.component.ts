import { Component, inject, OnInit, signal } from '@angular/core';
import { ServiceService } from '../../services/service.service';

@Component({
  selector: 'app-directorio-servicios',
  imports: [],
  templateUrl: './directorio-servicios.component.html',
  styleUrl: './directorio-servicios.component.css',
})
export default class DirectorioServiciosComponent implements OnInit {
  private serviceService = inject(ServiceService);
  public isLoading = signal(false);

  ngOnInit() {}
}
