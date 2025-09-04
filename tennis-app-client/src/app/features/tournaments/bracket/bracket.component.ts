import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface BracketNode {
  round: number;
  position: number;
  player1?: string;
  player2?: string;
  seed1?: number;
  seed2?: number;
  matchId?: string;
  winner?: string;
}

@Component({
  selector: 'app-bracket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bracket.component.html',
  styleUrl: './bracket.component.scss'
})
export class BracketComponent implements OnInit {
  tournamentId!: number;
  bracketGenerated = false;
  showGenerateModal = false;
  showSeedingModal = false;
  
  // Generation options
  bracketType = 'Main';
  drawSize = 32;
  autoSeed = true;
  manualSeeds = new Map<number, number>();
  
  // Bracket data
  rounds: BracketNode[][] = [];
  totalRounds = 0;
  players: { id: number; name: string; ranking: number }[] = [];
  
  // UI state
  zoomLevel = 1;
  selectedMatch: BracketNode | null = null;
  editMode = false;
  matchesStarted = false;
  
  private route = inject(ActivatedRoute);
  
  ngOnInit() {
    this.tournamentId = +this.route.snapshot.params['id'];
    this.loadBracketStatus();
    this.loadPlayers();
  }
  
  loadBracketStatus() {
    // Check if bracket exists for this tournament
    // For demo, we'll assume no bracket exists initially
    this.bracketGenerated = false;
  }
  
  loadPlayers() {
    // Mock registered players
    this.players = [
      { id: 1, name: 'Novak Djokovic', ranking: 1 },
      { id: 2, name: 'Carlos Alcaraz', ranking: 2 },
      { id: 3, name: 'Daniil Medvedev', ranking: 3 },
      { id: 4, name: 'Jannik Sinner', ranking: 4 },
      { id: 5, name: 'Andrey Rublev', ranking: 5 },
      { id: 6, name: 'Stefanos Tsitsipas', ranking: 6 },
      { id: 7, name: 'Alexander Zverev', ranking: 7 },
      { id: 8, name: 'Holger Rune', ranking: 8 },
    ];
    
    // Add more players to reach 24 for testing
    for (let i = 9; i <= 24; i++) {
      this.players.push({ id: i, name: `Player ${i}`, ranking: i });
    }
  }
  
  openGenerateModal() {
    this.showGenerateModal = true;
  }
  
  closeGenerateModal() {
    this.showGenerateModal = false;
  }
  
  validateDrawSize() {
    if (this.drawSize > this.players.length) {
      return 'Not enough players for selected draw size';
    }
    return null;
  }
  
  openSeedingModal() {
    this.showSeedingModal = true;
    this.showGenerateModal = false;
  }
  
  closeSeedingModal() {
    this.showSeedingModal = false;
  }
  
  applySeeds() {
    this.showSeedingModal = false;
    this.showGenerateModal = true;
  }
  
  updateManualSeed(playerId: number, seed: string) {
    if (seed) {
      this.manualSeeds.set(playerId, parseInt(seed));
    } else {
      this.manualSeeds.delete(playerId);
    }
  }
  
  generateBracket() {
    const error = this.validateDrawSize();
    if (error) {
      alert(error);
      return;
    }
    
    // Calculate number of rounds
    this.totalRounds = Math.log2(this.drawSize);
    this.rounds = [];
    
    // Generate bracket structure
    let matchesInRound = this.drawSize / 2;
    
    for (let round = 1; round <= this.totalRounds; round++) {
      const roundMatches: BracketNode[] = [];
      
      for (let position = 1; position <= matchesInRound; position++) {
        const node: BracketNode = {
          round,
          position,
          matchId: `R${round}-M${position}`
        };
        
        // For first round, assign players
        if (round === 1) {
          const playerIndex1 = (position - 1) * 2;
          const playerIndex2 = playerIndex1 + 1;
          
          if (playerIndex1 < this.players.length) {
            const player1 = this.players[playerIndex1];
            node.player1 = player1.name;
            if (this.autoSeed && playerIndex1 < 8) {
              node.seed1 = playerIndex1 + 1;
            }
          } else {
            node.player1 = 'BYE';
          }
          
          if (playerIndex2 < this.players.length) {
            const player2 = this.players[playerIndex2];
            node.player2 = player2.name;
            if (this.autoSeed && playerIndex2 < 8) {
              node.seed2 = playerIndex2 + 1;
            }
          } else {
            node.player2 = 'BYE';
          }
        }
        
        roundMatches.push(node);
      }
      
      this.rounds.push(roundMatches);
      matchesInRound = matchesInRound / 2;
    }
    
    this.bracketGenerated = true;
    this.closeGenerateModal();
  }
  
  regenerateBracket() {
    if (confirm('This will delete the current bracket. Are you sure?')) {
      this.bracketGenerated = false;
      this.rounds = [];
      this.matchesStarted = false;
    }
  }
  
  getRoundName(round: number): string {
    const totalRounds = this.totalRounds;
    
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinals';
    if (round === totalRounds - 2) return 'Quarterfinals';
    if (round === totalRounds - 3) return 'Round of 16';
    if (round === totalRounds - 4) return 'Round of 32';
    if (round === totalRounds - 5) return 'Round of 64';
    if (round === totalRounds - 6) return 'Round of 128';
    
    return `Round ${round}`;
  }
  
  selectMatch(node: BracketNode) {
    this.selectedMatch = node;
  }
  
  startMatch() {
    this.matchesStarted = true;
    // Start match logic
  }
  
  enableEditMode() {
    if (this.matchesStarted) {
      alert('Cannot edit bracket after matches have started');
      return;
    }
    this.editMode = true;
  }
  
  disableEditMode() {
    this.editMode = false;
  }
  
  saveBracketEdits() {
    this.editMode = false;
    // Save logic
  }
  
  exportBracket() {
    // Export to PDF logic
    alert('Exporting bracket to PDF...');
  }
  
  printBracket() {
    window.print();
  }
  
  shareBracket() {
    const shareUrl = `${window.location.origin}/public/bracket/${this.tournamentId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  }
  
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.2, 2);
  }
  
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.2, 0.5);
  }
  
  resetZoom() {
    this.zoomLevel = 1;
  }
  
  allowDrop(event: DragEvent) {
    event.preventDefault();
  }
  
  drag(event: DragEvent, player: string) {
    event.dataTransfer?.setData('player', player);
  }
  
  drop(event: DragEvent, node: BracketNode, playerSlot: number) {
    event.preventDefault();
    const player = event.dataTransfer?.getData('player');
    if (player) {
      if (playerSlot === 1) {
        node.player1 = player;
      } else {
        node.player2 = player;
      }
    }
  }
}