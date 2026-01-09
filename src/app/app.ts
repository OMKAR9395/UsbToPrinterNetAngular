import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrinterPanel } from "../pages/printer-panel/printer-panel";

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('usb-ui');
}
