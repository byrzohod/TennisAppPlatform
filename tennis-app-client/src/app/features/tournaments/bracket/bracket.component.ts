import { Component, OnInit, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';

interface BracketNode {
  round: number;
  position: number;
  player1?: string;
  player2?: string;
  seed1?: number;
  seed2?: number;
  matchId?: string;
  winner?: string;
  score1?: string;
  score2?: string;
  x?: number;
  y?: number;
  status?: 'upcoming' | 'in-progress' | 'completed';
}

@Component({
  selector: 'app-bracket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bracket.component.html',
  styleUrl: './bracket.component.scss'
})
export class BracketComponent implements OnInit, AfterViewInit {
  @ViewChild('bracketSvg', { static: false }) bracketSvg!: ElementRef;
  
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
  
  // D3.js properties
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom!: d3.ZoomBehavior<Element, unknown>;
  private width = 1400;
  private height = 900;
  private matchWidth = 200;
  private matchHeight = 60;
  private roundSpacing = 280;
  private verticalSpacing = 80;
  
  private route = inject(ActivatedRoute);
  
  ngOnInit() {
    this.tournamentId = +this.route.snapshot.params['id'];
    this.loadBracketStatus();
    this.loadPlayers();
  }
  
  ngAfterViewInit() {
    if (this.bracketGenerated) {
      this.initializeD3Bracket();
    }
  }
  
  private initializeD3Bracket() {
    if (!this.bracketSvg) return;
    
    const element = this.bracketSvg.nativeElement;
    
    // Clear any existing SVG
    d3.select(element).selectAll('*').remove();
    
    // Create SVG
    this.svg = d3.select(element)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .classed('bracket-svg', true);
    
    // Add zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });
    
    this.svg.call(this.zoom as any);
    
    // Create main group for all bracket elements
    this.g = this.svg.append('g')
      .attr('class', 'bracket-group');
    
    // Add background pattern
    const defs = this.svg.append('defs');
    const pattern = defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', 40)
      .attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse');
    
    pattern.append('rect')
      .attr('width', 40)
      .attr('height', 40)
      .attr('fill', 'none')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 0.5);
    
    // Add background
    this.g.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'url(#grid)')
      .attr('opacity', 0.3);
    
    // Render the bracket
    this.renderD3Bracket();
  }
  
  private renderD3Bracket() {
    if (!this.g || this.rounds.length === 0) return;
    
    // Calculate positions for each match
    this.calculateMatchPositions();
    
    // Draw connections between rounds
    this.drawConnections();
    
    // Draw matches
    this.drawMatches();
  }
  
  private calculateMatchPositions() {
    this.rounds.forEach((round, roundIndex) => {
      const matchesInRound = round.length;
      const startY = (this.height - (matchesInRound * this.verticalSpacing)) / 2;
      
      round.forEach((match, matchIndex) => {
        match.x = 50 + (roundIndex * this.roundSpacing);
        match.y = startY + (matchIndex * this.verticalSpacing * Math.pow(2, roundIndex));
      });
    });
  }
  
  private drawConnections() {
    for (let roundIndex = 1; roundIndex < this.rounds.length; roundIndex++) {
      const prevRound = this.rounds[roundIndex - 1];
      const currentRound = this.rounds[roundIndex];
      
      currentRound.forEach((match, matchIndex) => {
        const sourceMatch1 = prevRound[matchIndex * 2];
        const sourceMatch2 = prevRound[matchIndex * 2 + 1];
        
        if (sourceMatch1 && sourceMatch1.x && sourceMatch1.y && match.x && match.y) {
          this.drawConnection(sourceMatch1, match, 'top');
        }
        
        if (sourceMatch2 && sourceMatch2.x && sourceMatch2.y && match.x && match.y) {
          this.drawConnection(sourceMatch2, match, 'bottom');
        }
      });
    }
  }
  
  private drawConnection(sourceMatch: BracketNode, targetMatch: BracketNode, position: 'top' | 'bottom') {
    const path = d3.path();
    const sourceX = (sourceMatch.x || 0) + this.matchWidth;
    const sourceY = (sourceMatch.y || 0) + this.matchHeight / 2;
    const targetX = targetMatch.x || 0;
    const targetY = (targetMatch.y || 0) + (position === 'top' ? 15 : this.matchHeight - 15);
    
    const midX = (sourceX + targetX) / 2;
    
    path.moveTo(sourceX, sourceY);
    path.lineTo(midX, sourceY);
    path.lineTo(midX, targetY);
    path.lineTo(targetX, targetY);
    
    this.g.append('path')
      .attr('d', path.toString())
      .attr('class', 'bracket-connection')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
  }
  
  private drawMatches() {
    const matchGroups = this.g.selectAll('.match-group')
      .data(this.rounds.flat())
      .enter()
      .append('g')
      .attr('class', 'match-group')
      .attr('transform', (d: BracketNode) => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: BracketNode) => this.selectMatch(d))
      .on('mouseover', (event: MouseEvent, d: BracketNode) => this.onMatchHover(d, true))
      .on('mouseout', (event: MouseEvent, d: BracketNode) => this.onMatchHover(d, false));
    
    // Match background with gradient
    matchGroups.append('rect')
      .attr('width', this.matchWidth)
      .attr('height', this.matchHeight)
      .attr('rx', 8)
      .attr('class', 'match-bg')
      .attr('fill', (d: BracketNode) => this.getMatchColor(d))
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');
    
    // Player 1
    matchGroups.append('text')
      .attr('x', 10)
      .attr('y', 22)
      .attr('class', 'player-name')
      .attr('font-size', '14px')
      .attr('font-weight', (d: BracketNode) => d.winner === d.player1 ? 'bold' : 'normal')
      .attr('fill', (d: BracketNode) => d.winner === d.player1 ? '#059669' : '#374151')
      .text((d: BracketNode) => {
        const seed = d.seed1 ? `[${d.seed1}] ` : '';
        return seed + (d.player1 || 'TBD');
      });
    
    // Player 2
    matchGroups.append('text')
      .attr('x', 10)
      .attr('y', 45)
      .attr('class', 'player-name')
      .attr('font-size', '14px')
      .attr('font-weight', (d: BracketNode) => d.winner === d.player2 ? 'bold' : 'normal')
      .attr('fill', (d: BracketNode) => d.winner === d.player2 ? '#059669' : '#374151')
      .text((d: BracketNode) => {
        const seed = d.seed2 ? `[${d.seed2}] ` : '';
        return seed + (d.player2 || 'TBD');
      });
    
    // Score display (if available)
    matchGroups.append('text')
      .attr('x', this.matchWidth - 10)
      .attr('y', 22)
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text((d: BracketNode) => d.score1 || '');
    
    matchGroups.append('text')
      .attr('x', this.matchWidth - 10)
      .attr('y', 45)
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text((d: BracketNode) => d.score2 || '');
    
    // Add animation on entrance
    matchGroups
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d: BracketNode, i: number) => i * 30)
      .style('opacity', 1);
  }
  
  private getMatchColor(match: BracketNode): string {
    if (match.status === 'completed') return '#f0fdf4';
    if (match.status === 'in-progress') return '#fef3c7';
    return '#ffffff';
  }
  
  private onMatchHover(match: BracketNode, isHovering: boolean) {
    const matchGroup = this.g.selectAll('.match-group')
      .filter((d: any) => (d as BracketNode).matchId === match.matchId);
    
    matchGroup.select('.match-bg')
      .transition()
      .duration(200)
      .attr('stroke', isHovering ? '#059669' : '#e5e7eb')
      .attr('stroke-width', isHovering ? 3 : 2)
      .style('filter', isHovering ? 
        'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.15))' : 
        'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');
  }
  
  resetD3Zoom() {
    if (this.svg && this.zoom) {
      this.svg.transition()
        .duration(750)
        .call(this.zoom.transform as any, d3.zoomIdentity);
    }
  }
  
  zoomInD3() {
    if (this.svg && this.zoom) {
      this.svg.transition()
        .duration(300)
        .call(this.zoom.scaleBy as any, 1.3);
    }
  }
  
  zoomOutD3() {
    if (this.svg && this.zoom) {
      this.svg.transition()
        .duration(300)
        .call(this.zoom.scaleBy as any, 0.7);
    }
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
          matchId: `R${round}-M${position}`,
          status: 'upcoming'
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
    
    // Initialize D3 visualization after generating bracket
    setTimeout(() => {
      this.initializeD3Bracket();
    }, 100);
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
    this.zoomInD3();
  }
  
  zoomOut() {
    this.zoomOutD3();
  }
  
  resetZoom() {
    this.resetD3Zoom();
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