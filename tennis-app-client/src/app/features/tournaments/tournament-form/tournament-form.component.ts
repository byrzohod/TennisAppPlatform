import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { TournamentType, TournamentTypeLabels } from '../../../shared/enums/tournament-type.enum';
import { Surface, SurfaceLabels } from '../../../shared/enums/surface.enum';
import { finalize } from 'rxjs';

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
  error = '';
  
  tournamentTypes = Object.values(TournamentType).filter(value => typeof value === 'number') as TournamentType[];
  tournamentTypeLabels = TournamentTypeLabels;
  surfaces = Object.values(Surface).filter(value => typeof value === 'number') as Surface[];
  surfaceLabels = SurfaceLabels;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tournamentService = inject(TournamentService);

  ngOnInit() {
    this.tournamentId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.tournamentId;
    
    this.initializeForm();
    
    if (this.isEditMode) {
      this.loadTournament();
    }
  }

  initializeForm() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.tournamentForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(100),
        CustomValidators.noWhitespace()
      ]],
      location: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]],
      startDate: ['', [
        Validators.required,
        CustomValidators.futureDate()
      ]],
      endDate: ['', [
        Validators.required
      ]],
      type: [TournamentType.ATP250, [Validators.required]],
      surface: [Surface.HardCourt, [Validators.required]],
      drawSize: [32, [
        Validators.required,
        CustomValidators.tournamentDrawSize()
      ]],
      prizeMoneyUSD: [0, [
        Validators.min(0),
        Validators.max(100000000)
      ]],
      entryFee: [0, [
        Validators.min(0),
        Validators.max(10000)
      ]],
      description: ['', [
        Validators.maxLength(1000)
      ]]
    }, { validators: CustomValidators.dateRange('startDate', 'endDate') });
  }

  get f() {
    return this.tournamentForm.controls;
  }

  loadTournament() {
    if (!this.tournamentId) return;
    
    this.loading = true;
    this.tournamentService.getTournament(this.tournamentId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (tournament) => {
          // Convert dates to YYYY-MM-DD format for HTML date inputs
          const formData = {
            ...tournament,
            startDate: tournament.startDate ? tournament.startDate.split('T')[0] : '',
            endDate: tournament.endDate ? tournament.endDate.split('T')[0] : ''
          };
          this.tournamentForm.patchValue(formData);
        },
        error: (error) => {
          this.error = 'Failed to load tournament';
          console.error('Error loading tournament:', error);
        }
      });
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    
    if (this.tournamentForm.invalid) {
      this.markFormGroupTouched(this.tournamentForm);
      return;
    }
    
    this.loading = true;
    
    const tournamentData = this.tournamentForm.value;
    const request = this.isEditMode && this.tournamentId
      ? this.tournamentService.updateTournament(this.tournamentId, tournamentData)
      : this.tournamentService.createTournament(tournamentData);
    
    request
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (tournament) => {
          this.router.navigate(['/tournaments', tournament.id]);
        },
        error: (error) => {
          console.error('Tournament creation error:', error);
          if (error.error && error.error.errors) {
            // Handle validation errors from the backend
            const validationErrors = Object.values(error.error.errors).flat();
            this.error = validationErrors.join(', ');
          } else if (error.error && error.error.title) {
            this.error = error.error.title;
          } else {
            this.error = error.message || 'Failed to save tournament';
          }
        }
      });
  }
  
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel() {
    this.router.navigate(['/tournaments']);
  }
}