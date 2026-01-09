import { Routes } from '@angular/router';
import { PrinterPanel } from '../pages/printer-panel/printer-panel';

export const routes: Routes = [
   { path: '', component: PrinterPanel },
  { path: '**', redirectTo: '' },
];
