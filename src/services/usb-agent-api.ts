import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfig } from './app-config';

export interface UsbDeviceInfo {
  name: string;
  pnpDeviceId: string;
  vid: string | null;
  pid: string | null;
  serial: string | null;
  status: string | null;
}

export interface DevicesResponse {
  count: number;
  devices: UsbDeviceInfo[];
}

export interface StoredBinding {
  machineId: string;
  vid: string;
  pid: string;
  serial: string;
  friendlyName: string;
  boundAt: string;
}

export interface BindingResponse {
  ok: boolean;
  binding: StoredBinding | null;
}

export interface BindResponse {
  ok: boolean;
  binding: StoredBinding;
}

export interface PrintResponse {
  ok: boolean;
  resultPtr?: number;
  lastWin32Error?: number;

  // ProblemDetails / custom error possibilities:
  error?: string;
  message?: string;
  detail?: string;

  dllArgs?: {
    dataLen: number;
    vid: string;
    pid: string;
    serialList: string;
    matchSerial: string;
  };

  device?: UsbDeviceInfo;
}

@Injectable({
  providedIn: 'root',
})
export class UsbAgentApi {
 constructor(private http: HttpClient,private cfg: AppConfig) {}

   private url(path: string) {
    return `${this.cfg.agentBaseUrl}${path}`;
  }

  getDevices(): Observable<DevicesResponse> {
    return this.http.get<DevicesResponse>(this.url('/api/usb/devices'));
  }

  getBinding(): Observable<BindingResponse> {
    return this.http.get<BindingResponse>(this.url('/api/printer/identity'));
  }

  bindPrinter(payload: { vid: string; pid: string; serial?: string; friendlyName?: string }): Observable<BindResponse> {
    return this.http.post<BindResponse>(this.url('/api/printer/bind'), payload);
  }

  print(payload: { vid: string; pid: string; serial?: string; dataBase64: string }): Observable<PrintResponse> {
    return this.http.post<PrintResponse>(this.url('/api/printer/print'), payload);
  }

}
