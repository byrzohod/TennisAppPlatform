using FluentValidation;
using TennisApp.Application.DTOs.Tournament;

namespace TennisApp.Application.Validators.Tournament;

public class UpdateTournamentDtoValidator : AbstractValidator<UpdateTournamentDto>
{
    public UpdateTournamentDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tournament name is required")
            .MaximumLength(200).WithMessage("Tournament name cannot exceed 200 characters");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Location is required")
            .MaximumLength(200).WithMessage("Location cannot exceed 200 characters");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required")
            .GreaterThan(x => x.StartDate).WithMessage("End date must be after start date")
            .LessThanOrEqualTo(x => x.StartDate.AddDays(30)).WithMessage("Tournament cannot exceed 30 days");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid tournament type");

        RuleFor(x => x.Surface)
            .IsInEnum().WithMessage("Invalid surface type");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid tournament status");

        RuleFor(x => x.DrawSize)
            .Must(BeAValidDrawSize).WithMessage("Draw size must be a power of 2 between 4 and 256");

        RuleFor(x => x.PrizeMoney)
            .GreaterThanOrEqualTo(0).WithMessage("Prize money cannot be negative")
            .LessThanOrEqualTo(100000000).WithMessage("Prize money cannot exceed 100 million");

        RuleFor(x => x.RankingPoints)
            .InclusiveBetween(0, 2000).WithMessage("Ranking points must be between 0 and 2000");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

        RuleFor(x => x.LogoUrl)
            .MaximumLength(500).WithMessage("Logo URL cannot exceed 500 characters")
            .Must(BeAValidUrl).When(x => !string.IsNullOrEmpty(x.LogoUrl))
            .WithMessage("Logo must be a valid URL");
    }

    private bool BeAValidDrawSize(int drawSize)
    {
        var validSizes = new[] { 4, 8, 16, 32, 64, 128, 256 };
        return validSizes.Contains(drawSize);
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var result) 
            && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }
}