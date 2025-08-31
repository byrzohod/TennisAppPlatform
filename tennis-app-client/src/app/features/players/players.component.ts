import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <h1>Players</h1>
      <p>Players list will be displayed here.</p>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 1rem;
    }
  `]
})
export class PlayersComponent {
}