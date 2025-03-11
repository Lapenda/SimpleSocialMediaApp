import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPaneComponent } from './admin-pane.component';

describe('AdminPaneComponent', () => {
  let component: AdminPaneComponent;
  let fixture: ComponentFixture<AdminPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPaneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
