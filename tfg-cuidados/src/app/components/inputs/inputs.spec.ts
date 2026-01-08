import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inputs } from './inputs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
describe('Inputs', () => {
  let component: Inputs;
  let fixture: ComponentFixture<Inputs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inputs, ReactiveFormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(Inputs);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('control', new FormControl(''));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
