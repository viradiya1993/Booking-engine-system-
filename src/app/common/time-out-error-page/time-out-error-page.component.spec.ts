import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeOutErrorPageComponent } from './time-out-error-page.component';

describe('TimeOutErrorPageComponent', () => {
  let component: TimeOutErrorPageComponent;
  let fixture: ComponentFixture<TimeOutErrorPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeOutErrorPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeOutErrorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
