using AutoMapper;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Domain.Enums;
using TennisApp.Infrastructure.Repositories.Base;

namespace TennisApp.Application.Services.Tournament;

public class TournamentService : ITournamentService
{
    private readonly IRepository<Domain.Entities.Tournament> _tournamentRepository;
    private readonly IMapper _mapper;

    public TournamentService(IRepository<Domain.Entities.Tournament> tournamentRepository, IMapper mapper)
    {
        _tournamentRepository = tournamentRepository;
        _mapper = mapper;
    }

    public async Task<TournamentDto?> GetByIdAsync(int id)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        return tournament == null ? null : _mapper.Map<TournamentDto>(tournament);
    }

    public async Task<IEnumerable<TournamentDto>> GetAllAsync()
    {
        var tournaments = await _tournamentRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<TournamentDto>>(tournaments);
    }

    public async Task<TournamentDto> CreateAsync(CreateTournamentDto dto)
    {
        var tournament = _mapper.Map<Domain.Entities.Tournament>(dto);
        tournament.Status = TournamentStatus.Upcoming;
        tournament.CreatedAt = DateTime.UtcNow;
        tournament.UpdatedAt = DateTime.UtcNow;
        
        var created = await _tournamentRepository.AddAsync(tournament);
        return _mapper.Map<TournamentDto>(created);
    }

    public async Task<TournamentDto> UpdateAsync(int id, UpdateTournamentDto dto)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament == null)
            throw new ArgumentException($"Tournament with id {id} not found");
        
        _mapper.Map(dto, tournament);
        tournament.UpdatedAt = DateTime.UtcNow;
        
        await _tournamentRepository.UpdateAsync(tournament);
        return _mapper.Map<TournamentDto>(tournament);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament == null)
            return false;
        
        await _tournamentRepository.DeleteAsync(tournament);
        return true;
    }

    public async Task<IEnumerable<TournamentDto>> GetUpcomingTournamentsAsync()
    {
        var tournaments = await _tournamentRepository.FindAsync(t => t.Status == TournamentStatus.Upcoming);
        return _mapper.Map<IEnumerable<TournamentDto>>(tournaments.OrderBy(t => t.StartDate));
    }

    public async Task<IEnumerable<TournamentDto>> GetActiveTournamentsAsync()
    {
        var tournaments = await _tournamentRepository.FindAsync(t => t.Status == TournamentStatus.InProgress);
        return _mapper.Map<IEnumerable<TournamentDto>>(tournaments);
    }
}