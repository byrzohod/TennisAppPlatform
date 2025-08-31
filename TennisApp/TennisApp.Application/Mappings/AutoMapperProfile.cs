using AutoMapper;
using TennisApp.Application.DTOs.Blog;
using TennisApp.Application.DTOs.Match;
using TennisApp.Application.DTOs.Player;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Domain.Entities;

namespace TennisApp.Application.Mappings;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // Player mappings
        CreateMap<Player, PlayerDto>();
        CreateMap<CreatePlayerDto, Player>();
        CreateMap<UpdatePlayerDto, Player>();

        // Tournament mappings
        CreateMap<Tournament, TournamentDto>();
        CreateMap<CreateTournamentDto, Tournament>();
        CreateMap<UpdateTournamentDto, Tournament>();

        // Match mappings
        CreateMap<Match, MatchDto>()
            .ForMember(dest => dest.ScoreDisplay, 
                opt => opt.MapFrom(src => src.Score != null ? src.Score.GetScoreDisplay() : null));
        CreateMap<CreateMatchDto, Match>();
        CreateMap<UpdateMatchDto, Match>();

        // Blog mappings
        CreateMap<BlogPost, BlogPostDto>()
            .ForMember(dest => dest.Categories, 
                opt => opt.MapFrom(src => src.Categories.Select(c => c.Name)))
            .ForMember(dest => dest.Tags, 
                opt => opt.MapFrom(src => src.Tags.Select(t => t.Name)));
        CreateMap<CreateBlogPostDto, BlogPost>();
        CreateMap<UpdateBlogPostDto, BlogPost>();

        // Tournament Registration mappings
        CreateMap<TournamentPlayer, TournamentRegistrationDto>()
            .ForMember(dest => dest.TournamentName, 
                opt => opt.MapFrom(src => src.Tournament != null ? src.Tournament.Name : string.Empty))
            .ForMember(dest => dest.PlayerName,
                opt => opt.MapFrom(src => src.Player != null ? $"{src.Player.FirstName} {src.Player.LastName}" : string.Empty));
        CreateMap<RegisterPlayerDto, TournamentPlayer>();
        CreateMap<UpdateRegistrationDto, TournamentPlayer>();
    }
}