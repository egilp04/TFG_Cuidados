import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBusiness } from './search-business';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Search } from 'lucide-angular';

describe('SearchBusiness', () => {
  let component: SearchBusiness;
  let fixture: ComponentFixture<SearchBusiness>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBusiness, TranslateModule.forRoot(), LucideAngularModule.pick({ Search })],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBusiness);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
