using Xunit;
using TennisApp.Infrastructure.Services;

namespace TennisApp.Tests.Services;

public class PasswordHasherTests
{
    private readonly PasswordHasher _passwordHasher;

    public PasswordHasherTests()
    {
        _passwordHasher = new PasswordHasher();
    }

    [Fact]
    public void HashPassword_Should_Return_Different_Hash_For_Same_Password()
    {
        var password = "TestPassword123!";
        
        var hash1 = _passwordHasher.HashPassword(password);
        var hash2 = _passwordHasher.HashPassword(password);

        Assert.NotNull(hash1);
        Assert.NotNull(hash2);
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void VerifyPassword_Should_Return_True_For_Correct_Password()
    {
        var password = "CorrectPassword123!";
        var hash = _passwordHasher.HashPassword(password);

        var result = _passwordHasher.VerifyPassword(password, hash);

        Assert.True(result);
    }

    [Fact]
    public void VerifyPassword_Should_Return_False_For_Incorrect_Password()
    {
        var password = "CorrectPassword123!";
        var wrongPassword = "WrongPassword456!";
        var hash = _passwordHasher.HashPassword(password);

        var result = _passwordHasher.VerifyPassword(wrongPassword, hash);

        Assert.False(result);
    }

    [Fact]
    public void VerifyPassword_Should_Return_False_For_Invalid_Hash()
    {
        var password = "TestPassword123!";
        var invalidHash = "InvalidHashString";

        var result = _passwordHasher.VerifyPassword(password, invalidHash);

        Assert.False(result);
    }
}