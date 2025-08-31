using FluentValidation.TestHelper;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Application.Validators.Tournament;
using TennisApp.Domain.Enums;
using Xunit;

namespace TennisApp.Tests.Unit.Validators.Tournament;

public class UpdateTournamentDtoValidatorTests
{
    private readonly UpdateTournamentDtoValidator _validator;

    public UpdateTournamentDtoValidatorTests()
    {
        _validator = new UpdateTournamentDtoValidator();
    }

    [Fact]
    public void Should_Have_Error_When_Name_Is_Empty()
    {
        var model = new UpdateTournamentDto { Name = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_Have_Error_When_EndDate_Is_Before_StartDate()
    {
        var model = new UpdateTournamentDto 
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
        var model = new UpdateTournamentDto 
        { 
            StartDate = DateTime.Now.AddDays(10),
            EndDate = DateTime.Now.AddDays(41)
        };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.EndDate);
    }

    [Fact]
    public void Should_Have_Error_When_Invalid_Tournament_Type()
    {
        var model = new UpdateTournamentDto { Type = (TournamentType)999 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Type);
    }

    [Fact]
    public void Should_Have_Error_When_Invalid_Surface_Type()
    {
        var model = new UpdateTournamentDto { Surface = (Surface)999 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Surface);
    }

    [Fact]
    public void Should_Have_Error_When_Invalid_Tournament_Status()
    {
        var model = new UpdateTournamentDto { Status = (TournamentStatus)999 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Status);
    }

    [Fact]
    public void Should_Have_Error_When_Description_Is_Too_Long()
    {
        var model = new UpdateTournamentDto { Description = new string('a', 2001) };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public void Should_Pass_With_Valid_Data()
    {
        var model = new UpdateTournamentDto
        {
            Name = "Wimbledon",
            Location = "London, UK",
            StartDate = DateTime.Now.AddDays(30),
            EndDate = DateTime.Now.AddDays(44),
            Type = TournamentType.GrandSlam,
            Surface = Surface.Grass,
            Status = TournamentStatus.Upcoming,
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