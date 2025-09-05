import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlayerService, PlayerCreateDto, PlayerUpdateDto } from '../../../core/services/player.service';
import { CustomValidators } from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './player-form.component.html',
  styleUrl: './player-form.component.scss'
})
export class PlayerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private playerService = inject(PlayerService);

  playerForm: FormGroup;
  isEditMode = false;
  playerId: string | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;

  constructor() {
    this.playerForm = this.createForm();
  }

  ngOnInit() {
    this.playerId = this.route.snapshot.paramMap.get('id');
    if (this.playerId) {
      this.isEditMode = true;
      this.loadPlayer(this.playerId);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(50),
        CustomValidators.noWhitespace()
      ]],
      lastName: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(50),
        CustomValidators.noWhitespace()
      ]],
      email: ['', [
        Validators.required, 
        CustomValidators.email()
      ]],
      phone: ['', [
        CustomValidators.phoneNumber()
      ]],
      dateOfBirth: ['', [
        CustomValidators.pastDate(),
        CustomValidators.age(10, 100) // Tennis players between 10 and 100 years old
      ]],
      rankingPoints: [0, [
        Validators.min(0),
        Validators.max(20000) // ATP points typically don't exceed this
      ]]
    });
  }

  loadPlayer(id: string) {
    this.loading = true;
    this.playerService.getPlayer(id).subscribe({
      next: (player) => {
        this.playerForm.patchValue({
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          phone: player.phone || '',
          dateOfBirth: player.dateOfBirth ? new Date(player.dateOfBirth).toISOString().split('T')[0] : '',
          rankingPoints: player.rankingPoints
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load player data';
        this.loading = false;
        console.error('Error loading player:', err);
      }
    });
  }

  onSubmit() {
    if (this.playerForm.invalid) {
      this.markFormGroupTouched(this.playerForm);
      return;
    }

    this.submitting = true;
    this.error = null;

    const formValue = this.playerForm.value;

    if (this.isEditMode && this.playerId) {
      const updateDto: PlayerUpdateDto = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone || undefined,
        dateOfBirth: formValue.dateOfBirth || undefined,
        rankingPoints: formValue.rankingPoints
      };

      this.playerService.updatePlayer(this.playerId, updateDto).subscribe({
        next: (player) => {
          this.router.navigate(['/players', player.id]);
        },
        error: (err) => {
          this.error = 'Failed to update player. Please try again.';
          this.submitting = false;
          console.error('Error updating player:', err);
        }
      });
    } else {
      const createDto: PlayerCreateDto = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone || undefined,
        dateOfBirth: formValue.dateOfBirth || undefined
      };

      this.playerService.createPlayer(createDto).subscribe({
        next: (player) => {
          this.router.navigate(['/players', player.id]);
        },
        error: (err) => {
          this.error = 'Failed to create player. Please try again.';
          this.submitting = false;
          console.error('Error creating player:', err);
        }
      });
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get firstName() { return this.playerForm.get('firstName'); }
  get lastName() { return this.playerForm.get('lastName'); }
  get email() { return this.playerForm.get('email'); }
  get phone() { return this.playerForm.get('phone'); }
  get dateOfBirth() { return this.playerForm.get('dateOfBirth'); }
  get rankingPoints() { return this.playerForm.get('rankingPoints'); }
}