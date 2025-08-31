using System.Security.Cryptography;

namespace TennisApp.Infrastructure.Services;

public class PasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100000;

    public string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);
        
        byte[] result = new byte[SaltSize + HashSize];
        Buffer.BlockCopy(salt, 0, result, 0, SaltSize);
        Buffer.BlockCopy(hash, 0, result, SaltSize, HashSize);
        
        return Convert.ToBase64String(result);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        try
        {
            byte[] decoded = Convert.FromBase64String(hashedPassword);
            
            if (decoded.Length != SaltSize + HashSize)
                return false;
            
            byte[] salt = new byte[SaltSize];
            Buffer.BlockCopy(decoded, 0, salt, 0, SaltSize);
            
            byte[] storedHash = new byte[HashSize];
            Buffer.BlockCopy(decoded, SaltSize, storedHash, 0, HashSize);
            
            byte[] computedHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);
            
            return CryptographicOperations.FixedTimeEquals(computedHash, storedHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}