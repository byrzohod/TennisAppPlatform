import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [],
  template: ''
})
export class PlayersComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Redirect to player list
    this.router.navigate(['/players/list']);
  }
}