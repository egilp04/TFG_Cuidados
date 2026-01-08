import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsLanding } from './cards-landing';
import { TranslateModule } from '@ngx-translate/core';

describe('CardsLanding', () => {
  let component: CardsLanding;
  let fixture: ComponentFixture<CardsLanding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsLanding, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(CardsLanding);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('imagen', 'assets/test.jpg');
    fixture.componentRef.setInput('titulo', 'Titulo de prueba');
    fixture.componentRef.setInput('descripcion', 'Desc de prueba');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
