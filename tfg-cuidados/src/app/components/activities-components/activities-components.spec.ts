import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivitiesComponents } from './activities-components';
import { TranslateModule } from '@ngx-translate/core';

describe('ActivitiesComponents', () => {
  let component: ActivitiesComponents;
  let fixture: ComponentFixture<ActivitiesComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivitiesComponents, TranslateModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivitiesComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
