import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize, timeout } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

import { PrintResponse, StoredBinding, UsbAgentApi, UsbDeviceInfo } from '../../services/usb-agent-api';

@Component({
  selector: 'app-printer-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatButtonModule,
  ],
  templateUrl: './printer-panel.html',
  styleUrl: './printer-panel.scss',
})
export class PrinterPanel implements OnInit {
   loading = false;
  private pending = 0;

  devices: UsbDeviceInfo[] = [];
  selected: UsbDeviceInfo | null = null;

  binding: StoredBinding | null = null;

  displayedColumns = ['select', 'name', 'vidpid', 'serial', 'status'];

  form = new FormGroup({
    tspl: new FormControl<string>(
      `SIZE 50 mm,50 mm
GAP 0 mm,0 mm
DIRECTION 1
REFERENCE 0,0
SPEED 2
DENSITY 15
CODEPAGE 850
CLS
BOX 10,10,550,550,4
TEXT 20,20,"3",0,3,3,"HELLO TSC"
BAR 20,120,500,6
TEXT 20,180,"3",0,2,2,"VID 1203 PID 0230"
PRINT 1,1
`,
      { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }
    ),
  });

  constructor(private api: UsbAgentApi, private snack: MatSnackBar,  private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll() {
    this.loadDevices();
    this.loadBinding();
  }

  isBindable(d: UsbDeviceInfo | null): boolean {
    return !!(d?.vid && d?.pid);
  }

  pick(d: UsbDeviceInfo) {
    this.selected = d;
  }

  loadDevices() {
    this.withLoader(
      () => this.api.getDevices(),
      (res) => {
        // USB-only: show only VID/PID devices
        this.devices = (res.devices || []).filter((d) => !!d.vid && !!d.pid);

        // keep selection if still present
        if (this.selected) {
          const still = this.devices.find((x) => x.pnpDeviceId === this.selected!.pnpDeviceId);
          this.selected = still || null;
        }

        this.toast(`Devices loaded: ${res.count}`, 'ok');
      },
      false
    );
  }

  loadBinding() {
    this.withLoader(
      () => this.api.getBinding(),
      (res) => {
        this.binding = res.binding ?? null;
      },
      false
    );
  }

  bindSelected() {
    if (!this.selected) {
      this.toast('Select TSC printer device first', 'warn');
      return;
    }
    if (!this.isBindable(this.selected)) {
      this.toast('Selected device has no VID/PID', 'warn');
      return;
    }

    const payload = {
      vid: this.selected.vid!,
      pid: this.selected.pid!,
      serial: this.selected.serial || '',
      friendlyName: this.selected.name || 'USB Device',
    };

    this.withLoader(
      () => this.api.bindPrinter(payload),
      (res) => {
        this.binding = res.binding;
        this.toast('Bind successful', 'ok');
      },
      false
    );
  }

  print() {
    if (!this.binding) {
      this.toast('Printer not bound. Bind first.', 'warn');
      return;
    }
    if (this.form.invalid) {
      this.toast('TSPL is empty/invalid', 'warn');
      return;
    }

    // TSPL hardening: ensure required commands exist
    let raw = this.form.controls.tspl.value || '';

    const header = `SIZE 50 mm,50 mm
  GAP 0 mm,0 mm
  DIRECTION 1
  REFERENCE 0,0
  SPEED 2
  DENSITY 15
  CODEPAGE 850
`;

    if (!/^\s*SIZE\s+/im.test(raw)) raw = header + '\n' + raw;
    if (!/^\s*CLS\s*$/im.test(raw)) raw = raw.trimEnd() + '\nCLS\n';
    if (!/^\s*PRINT\s+\d+\s*,\s*\d+\s*$/im.test(raw)) {
      raw = raw.trimEnd() + '\nPRINT 1,1\n';
      this.toast('PRINT 1,1 auto-added', 'warn');
    }

    const tspl = this.normalizeTspl(raw);
    const dataBase64 = this.toBase64Ascii(tspl);

    const payload = {
      vid: this.binding.vid,
      pid: this.binding.pid,
      serial: this.binding.serial,
      dataBase64,
    };

    this.withLoader(
      () => this.api.print(payload),
      (res: PrintResponse) => {
        if (res.ok) {
          this.toast(`Print OK (ptr=${res.resultPtr ?? 'n/a'})`, 'ok');
        } else {
          const msg =
            res.message ||
            res.error ||
            res.detail ||
            `Print failed (ptr=${res.resultPtr ?? 0}, winErr=${res.lastWin32Error ?? 0})`;
          this.toast(msg, 'err');
        }
      },
      false
    );
  }

  // ---------- helpers ----------

  private normalizeTspl(s: string): string {
    let t = (s || '').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
    if (!t.endsWith('\r\n')) t += '\r\n';
    t += '\r\n'; // extra safety
    return t;
  }

  // ASCII-safe base64 for TSPL
  private toBase64Ascii(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  // private startLoad() {
  //   this.pending++;
  //   this.loading = this.pending > 0;
  // }

  // private endLoad() {
  //   this.pending = Math.max(0, this.pending - 1);
  //   this.loading = this.pending > 0;
  // }
private startLoad() { this.pending++; console.log('pending++', this.pending); this.loading = this.pending > 0; }
private endLoad() { this.pending = Math.max(0, this.pending - 1); console.log('pending--', this.pending); this.loading = this.pending > 0; }

private withLoader<T>(
  call: () => Observable<T>,
  onOk: (res: T) => void,
  _showSuccessToast = false
) {
  // START
  this.startLoad();

  let obs: Observable<T>;
  try {
    obs = call();
  } catch (e: any) {
    // if call() throws synchronously, finalize never runs
    this.endLoad();
    this.toast(e?.message ?? 'Request failed (sync)', 'err');
    return;
  }

  obs
    .pipe(
      timeout({ first: 15000 }),
      finalize(() => {
        // ✅ finalize ALWAYS decrements
        this.endLoad();
      })
    )
    .subscribe({
 next: (res) => {
  // ✅ avoid NG0100 by updating state in next microtask
  queueMicrotask(() => {
    try {
      onOk(res);
    } catch (e: any) {
      this.toast(e?.message ?? 'UI handler error', 'err');
    }
    this.cdr.detectChanges(); // ensure UI sync
  });
},
      error: (err) => {
        const isTimeout = err?.name === 'TimeoutError';
        this.toast(isTimeout ? 'API timeout. Check agent/proxy.' : this.extractError(err), 'err');
        queueMicrotask(() => this.cdr.detectChanges());

        // ❌ DO NOT call endLoad() here (finalize will do it)
      },
    });
}


  private extractError(err: any): string {
    const problem = err?.error;
    if (typeof problem === 'string') return problem;
    if (problem?.message) return problem.message;
    if (problem?.error) return problem.error;
    if (problem?.detail) return problem.detail;
    if (err?.message) return err.message;
    return 'Request failed';
  }

  private toast(message: string, type: 'ok' | 'warn' | 'err') {
    this.snack.open(message, 'Close', {
      duration: type === 'ok' ? 2500 : 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`toast-${type}`],
    });
  }
}
