using FluentValidation.TestHelper;
using TennisApp.Application.DTOs.Player;
using TennisApp.Application.Validators.Player;
using Xunit;

namespace TennisApp.Tests.Unit.Validators.Player;

public class CreatePlayerDtoValidatorTests
{
    private readonly CreatePlayerDtoValidator _validator;

    public CreatePlayerDtoValidatorTests()
    {
        _validator = new CreatePlayerDtoValidator();
    }

    [Fact]
    public void Should_Have_Error_When_FirstName_Is_Empty()
    {
        var model = new CreatePlayerDto { FirstName = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void Should_Have_Error_When_FirstName_Exceeds_50_Characters()
    {
        var model = new CreatePlayerDto { FirstName = new string('a', 51) };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void Should_Have_Error_When_FirstName_Contains_Invalid_Characters()
    {
        var model = new CreatePlayerDto { FirstName = "John123" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void Should_Not_Have_Error_When_FirstName_Is_Valid()
    {
        var model = new CreatePlayerDto { FirstName = "Jean-Pierre O'Connor" };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveValidationErrorFor(x => x.FirstName);
    }

    [Fact]
    public void Should_Have_Error_When_LastName_Is_Empty()
    {
        var model = new CreatePlayerDto { LastName = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.LastName);
    }

    [Fact]
    public void Should_Have_Error_When_Country_Is_Empty()
    {
        var model = new CreatePlayerDto { Country = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Country);
    }

    [Fact]
    public void Should_Have_Error_When_DateOfBirth_Is_Default()
    {
        var model = new CreatePlayerDto { DateOfBirth = default };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.DateOfBirth);
    }

    [Fact]
    public void Should_Have_Error_When_Player_Is_Too_Young()
    {
        var model = new CreatePlayerDto { DateOfBirth = DateTime.Now.AddYears(-10) };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.DateOfBirth);
    }

    [Fact]
    public void Should_Have_Error_When_Player_Is_Too_Old()
    {
        var model = new CreatePlayerDto { DateOfBirth = DateTime.Now.AddYears(-101) };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.DateOfBirth);
    }

    [Fact]
    public void Should_Have_Error_When_DateOfBirth_Is_In_Future()
    {
        var model = new CreatePlayerDto { DateOfBirth = DateTime.Now.AddDays(1) };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.DateOfBirth);
    }

    [Fact]
    public void Should_Have_Error_When_ProfileImageUrl_Is_Invalid()
    {
        var model = new CreatePlayerDto { ProfileImageUrl = "not-a-url" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.ProfileImageUrl);
    }

    [Fact]
    public void Should_Not_Have_Error_When_ProfileImageUrl_Is_Valid()
    {
        var model = new CreatePlayerDto { ProfileImageUrl = "https://example.com/photo.jpg" };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveValidationErrorFor(x => x.ProfileImageUrl);
    }

    [Fact]
    public void Should_Pass_With_Valid_Data()
    {
        var model = new CreatePlayerDto
        {
            FirstName = "Roger",
            LastName = "Federer",
            Country = "Switzerland",
            DateOfBirth = new DateTime(1981, 8, 8),
            ProfileImageUrl = "https://example.com/federer.jpg"
        };

        var result = _validator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }
}