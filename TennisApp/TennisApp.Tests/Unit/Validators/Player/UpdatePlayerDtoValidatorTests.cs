using FluentValidation.TestHelper;
using TennisApp.Application.DTOs.Player;
using TennisApp.Application.Validators.Player;
using Xunit;

namespace TennisApp.Tests.Unit.Validators.Player;

public class UpdatePlayerDtoValidatorTests
{
    private readonly UpdatePlayerDtoValidator _validator;

    public UpdatePlayerDtoValidatorTests()
    {
        _validator = new UpdatePlayerDtoValidator();
    }

    [Fact]
    public void Should_Have_Error_When_FirstName_Is_Empty()
    {
        var model = new UpdatePlayerDto { FirstName = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void Should_Have_Error_When_CurrentRanking_Is_Negative()
    {
        var model = new UpdatePlayerDto { CurrentRanking = -1 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.CurrentRanking);
    }

    [Fact]
    public void Should_Have_Error_When_CurrentRanking_Is_Too_High()
    {
        var model = new UpdatePlayerDto { CurrentRanking = 10001 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.CurrentRanking);
    }

    [Fact]
    public void Should_Have_Error_When_RankingPoints_Is_Negative()
    {
        var model = new UpdatePlayerDto { RankingPoints = -1 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.RankingPoints);
    }

    [Fact]
    public void Should_Have_Error_When_RankingPoints_Is_Too_High()
    {
        var model = new UpdatePlayerDto { RankingPoints = 100001 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.RankingPoints);
    }


    [Fact]
    public void Should_Pass_With_Valid_Data()
    {
        var model = new UpdatePlayerDto
        {
            FirstName = "Roger",
            LastName = "Federer",
            Country = "Switzerland",
            DateOfBirth = new DateTime(1981, 8, 8),
            CurrentRanking = 1,
            RankingPoints = 12000,
            ProfileImageUrl = "https://example.com/federer.jpg"
        };

        var result = _validator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }
}