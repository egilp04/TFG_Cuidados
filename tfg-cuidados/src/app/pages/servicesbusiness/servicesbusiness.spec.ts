import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Servicesbusiness } from './servicesbusiness';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Search } from 'lucide-angular';

describe('Servicesbusiness', () => {
  let component: Servicesbusiness;
  let fixture: ComponentFixture<Servicesbusiness>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Servicesbusiness, TranslateModule.forRoot(), LucideAngularModule.pick({ Search })],
    }).compileComponents();

    fixture = TestBed.createComponent(Servicesbusiness);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
