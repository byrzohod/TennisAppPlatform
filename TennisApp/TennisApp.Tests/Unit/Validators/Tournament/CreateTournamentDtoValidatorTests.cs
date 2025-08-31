using FluentValidation.TestHelper;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Application.Validators.Tournament;
using TennisApp.Domain.Enums;
using Xunit;

namespace TennisApp.Tests.Unit.Validators.Tournament;

public class CreateTournamentDtoValidatorTests
{
    private readonly CreateTournamentDtoValidator _validator;

    public CreateTournamentDtoValidatorTests()
    {
        _validator = new CreateTournamentDtoValidator();
    }

    [Fact]
    public void Should_Have_Error_When_Name_Is_Empty()
    {
        var model = new CreateTournamentDto { Name = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_Have_Error_When_Name_Exceeds_200_Characters()
    {
        var model = new CreateTournamentDto { Name = new string('a', 201) };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_Have_Error_When_Location_Is_Empty()
    {
        var model = new CreateTournamentDto { Location = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Location);
    }

    [Fact]
    public void Should_Have_Error_When_StartDate_Is_Default()
    {
        var model = new CreateTournamentDto { StartDate = default };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.StartDate);
    }

    [Fact]
    public void Should_Have_Error_When_StartDate_Is_In_Past()
    {
        var model = new CreateTournamentDto { StartDate = DateTime.Now.AddDays(-2) };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.StartDate);
    }

    [Fact]
    public void Should_Have_Error_When_EndDate_Is_Before_StartDate()
    {
        var model = new CreateTournamentDto 
        { 
            StartDate = DateTime.Now.AddDays(10),
            EndDate = DateTime.Now.AddDays(5)
        };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.EndDate);
    }

    [Fact]
    public void Should_Have_Error_When_Tournament_Exceeds_30_Days()
    {
        var model = new CreateTournamentDto 
        { 
            StartDate = DateTime.Now.AddDays(10),
            EndDate = DateTime.Now.AddDays(41)
        };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.EndDate);
    }

    [Fact]
    public void Should_Have_Error_When_DrawSize_Is_Invalid()
    {
        var model = new CreateTournamentDto { DrawSize = 15 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.DrawSize);
    }

    [Theory]
    [InlineData(4)]
    [InlineData(8)]
    [InlineData(16)]
    [InlineData(32)]
    [InlineData(64)]
    [InlineData(128)]
    [InlineData(256)]
    public void Should_Not_Have_Error_When_DrawSize_Is_Valid(int drawSize)
    {
        var model = new CreateTournamentDto { DrawSize = drawSize };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveValidationErrorFor(x => x.DrawSize);
    }

    [Fact]
    public void Should_Have_Error_When_PrizeMoney_Is_Negative()
    {
        var model = new CreateTournamentDto { PrizeMoney = -1 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.PrizeMoney);
    }

    [Fact]
    public void Should_Have_Error_When_PrizeMoney_Exceeds_Maximum()
    {
        var model = new CreateTournamentDto { PrizeMoney = 100000001 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.PrizeMoney);
    }

    [Fact]
    public void Should_Have_Error_When_RankingPoints_Is_Negative()
    {
        var model = new CreateTournamentDto { RankingPoints = -1 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.RankingPoints);
    }

    [Fact]
    public void Should_Have_Error_When_RankingPoints_Exceeds_2000()
    {
        var model = new CreateTournamentDto { RankingPoints = 2001 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.RankingPoints);
    }

    [Fact]
    public void Should_Have_Error_When_LogoUrl_Is_Invalid()
    {
        var model = new CreateTournamentDto { LogoUrl = "not-a-url" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.LogoUrl);
    }

    [Fact]
    public void Should_Pass_With_Valid_Data()
    {
        var model = new CreateTournamentDto
        {
            Name = "Wimbledon",
            Location = "London, UK",
            StartDate = DateTime.Now.AddDays(30),
            EndDate = DateTime.Now.AddDays(44),
            Type = TournamentType.GrandSlam,
            Surface = Surface.Grass,
            DrawSize = 128,
            PrizeMoney = 50000000,
            RankingPoints = 2000,
            Description = "The oldest tennis tournament",
            LogoUrl = "https://example.com/wimbledon.png"
        };

        var result = _validator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }
}