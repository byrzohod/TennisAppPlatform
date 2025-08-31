using FluentValidation;
using TennisApp.Application.DTOs.Player;

namespace TennisApp.Application.Validators.Player;

public class UpdatePlayerDtoValidator : AbstractValidator<UpdatePlayerDto>
{
    public UpdatePlayerDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(50).WithMessage("First name cannot exceed 50 characters")
            .Matches(@"^[a-zA-Z\s'-]+$").WithMessage("First name can only contain letters, spaces, hyphens, and apostrophes");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(50).WithMessage("Last name cannot exceed 50 characters")
            .Matches(@"^[a-zA-Z\s'-]+$").WithMessage("Last name can only contain letters, spaces, hyphens, and apostrophes");

        RuleFor(x => x.Country)
            .NotEmpty().WithMessage("Country is required")
            .MaximumLength(100).WithMessage("Country cannot exceed 100 characters");

        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Date of birth is required")
            .LessThan(DateTime.Now.AddYears(-10)).WithMessage("Player must be at least 10 years old")
            .GreaterThan(DateTime.Now.AddYears(-100)).WithMessage("Invalid date of birth");

        RuleFor(x => x.CurrentRanking)
            .GreaterThanOrEqualTo(0).WithMessage("Ranking must be non-negative")
            .LessThanOrEqualTo(10000).WithMessage("Ranking cannot exceed 10000");

        RuleFor(x => x.RankingPoints)
            .GreaterThanOrEqualTo(0).WithMessage("Ranking points must be non-negative")
            .LessThanOrEqualTo(20000).WithMessage("Ranking points cannot exceed 20000");

        RuleFor(x => x.ProfileImageUrl)
            .MaximumLength(500).WithMessage("Profile image URL cannot exceed 500 characters")
            .Must(BeAValidUrl).When(x => !string.IsNullOrEmpty(x.ProfileImageUrl))
            .WithMessage("Profile image must be a valid URL");
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var result) 
            && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }
}