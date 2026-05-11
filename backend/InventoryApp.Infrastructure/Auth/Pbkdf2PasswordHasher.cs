using System.Security.Cryptography;
using InventoryApp.Application.Abstractions;

namespace InventoryApp.Infrastructure.Auth;

public class Pbkdf2PasswordHasher : IPasswordHasher
{
    private const int SaltBytes = 16;
    private const int KeyBytes = 32;
    private const int Iterations = 100_000;
    private static readonly HashAlgorithmName HashAlg = HashAlgorithmName.SHA256;

    public string Hash(string password)
    {
        if (string.IsNullOrEmpty(password)) throw new ArgumentException("Password is required.", nameof(password));
        var salt = RandomNumberGenerator.GetBytes(SaltBytes);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlg, KeyBytes);
        // format: pbkdf2.<iterations>.<base64(salt)>.<base64(key)>
        return $"pbkdf2.{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    public bool Verify(string hashedPassword, string providedPassword)
    {
        if (string.IsNullOrEmpty(hashedPassword) || string.IsNullOrEmpty(providedPassword)) return false;
        var parts = hashedPassword.Split('.');
        if (parts.Length != 4 || parts[0] != "pbkdf2") return false;
        if (!int.TryParse(parts[1], out var iterations)) return false;

        byte[] salt, expected;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expected = Convert.FromBase64String(parts[3]);
        }
        catch { return false; }

        var actual = Rfc2898DeriveBytes.Pbkdf2(providedPassword, salt, iterations, HashAlg, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
