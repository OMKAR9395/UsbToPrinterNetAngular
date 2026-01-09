import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AppConfigFile {
  agentBaseUrl: string;
}
@Injectable({
  providedIn: 'root',
})
export class AppConfig {
  private cfg: AppConfigFile | null = null;

  constructor(private http: HttpClient) {}

 async load(): Promise<void> {
    this.cfg = await firstValueFrom(this.http.get<AppConfigFile>('/assets/app-config.json'));
  }

  get agentBaseUrl(): string {
    return (this.cfg?.agentBaseUrl || 'http://localhost:5151').replace(/\/$/, '');
  }
}
