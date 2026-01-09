import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterPanel } from './printer-panel';

describe('PrinterPanel', () => {
  let component: PrinterPanel;
  let fixture: ComponentFixture<PrinterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
