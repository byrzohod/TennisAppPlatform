import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [],
  template: ''
})
export class PlayersComponent implements OnInit {
  private router = inject(Router);


  ngOnInit() {
    // Redirect to player list
    this.router.navigate(['/players/list']);
  }
}