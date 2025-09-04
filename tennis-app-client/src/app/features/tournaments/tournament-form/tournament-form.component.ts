import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tournament-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tournament-form.component.html',
  styleUrl: './tournament-form.component.scss'
})
export class TournamentFormComponent implements OnInit {
  tournamentForm!: FormGroup;
  isEditMode = false;
  tournamentId?: number;
  loading = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.tournamentId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.tournamentId;
    
    this.initializeForm();
    
    if (this.isEditMode) {
      this.loadTournament();
    }
  }

  initializeForm() {
    this.tournamentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      location: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      type: ['ATP250', [Validators.required]],
      surface: ['HardCourt', [Validators.required]],
      drawSize: [32, [Validators.required]],
      prizeMoneyUSD: [0],
      entryFee: [0],
      description: ['']
    }, { validators: this.dateRangeValidator });
  }

  dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    
    if (start && end && new Date(start) >= new Date(end)) {
      return { dateRange: true };
    }
    return null;
  }

  loadTournament() {
    // Mock data for edit mode
    const tournament = {
      name: 'Wimbledon',
      location: 'London, UK',
      startDate: '2024-07-01',
      endDate: '2024-07-14',
      type: 'GrandSlam',
      surface: 'Grass',
      drawSize: 128,
      prizeMoneyUSD: 50000000,
      entryFee: 0,
      description: 'The oldest tennis tournament'
    };
    
    this.tournamentForm.patchValue(tournament);
  }

  onSubmit() {
    this.submitted = true;
    
    if (this.tournamentForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    // Mock save
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/tournaments', this.tournamentId || 1]);
    }, 1000);
  }

  cancel() {
    this.router.navigate(['/tournaments']);
  }
}