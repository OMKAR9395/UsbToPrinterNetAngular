import { TestBed } from '@angular/core/testing';

import { UsbAgentApi } from './usb-agent-api';

describe('UsbAgentApi', () => {
  let service: UsbAgentApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsbAgentApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
