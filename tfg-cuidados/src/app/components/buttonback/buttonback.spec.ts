import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Buttonback } from './buttonback';
import { TranslateModule } from '@ngx-translate/core';
import { Location } from '@angular/common';
declare var jasmine: any;

describe('Buttonback', () => {
  let component: Buttonback;
  let fixture: ComponentFixture<Buttonback>;
  let locationSpy: any;

  const locationMock = {
    back: jasmine.createSpy('back'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buttonback, TranslateModule.forRoot()],
      providers: [{ provide: Location, useValue: locationMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Buttonback);
    component = fixture.componentInstance;
    locationSpy = TestBed.inject(Location);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call location.back() when goBack is called', () => {
    component.goBack();
    expect(locationSpy.back).toHaveBeenCalled();
  });
});
