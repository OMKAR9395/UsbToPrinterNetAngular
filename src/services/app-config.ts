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
  private cfg: AppConfigFile = { agentBaseUrl: 'http://localhost:5151' };

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<AppConfigFile>('/assets/app-config.json'));
      if (data?.agentBaseUrl && typeof data.agentBaseUrl === 'string') {
        this.cfg.agentBaseUrl = data.agentBaseUrl;
      }
    } catch {
      // ✅ ignore any errors so app still boots
    }
  }

  get agentBaseUrl(): string {
    return (this.cfg.agentBaseUrl || 'http://localhost:5151').replace(/\/$/, '');
  }
}
