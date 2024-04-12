using AngularAuthAPI.Context;
using AngularAuthAPI.Helpers;
using AngularAuthAPI.Models;
using AngularAuthAPI.Models.Dto;
using AngularAuthAPI.UtilityService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace AngularAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController(AppDbContext authContext, IConfiguration config, IEmailService emailService) : ControllerBase
    {
        [HttpPost("authenticate")]
        public async Task<IActionResult> Authenticate([FromBody] User userObj)
        {
            if (userObj == null)
                return BadRequest();

            var user = await authContext.Users.FirstOrDefaultAsync(x => x.Username == userObj.Username);

            if (user == null)
                return NotFound(new { Message = "User not found!" });

            if (!PasswordHasher.VerifyPassword(userObj.Password, user.Password))
                return BadRequest(new { Message = "Invalid password!" });

            user.Token = CreateJwt(user);
            var newAccessToken = user.Token;
            var newRefreshToken = CreateRefreshToken();
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.Now.AddDays(7);
            await authContext.SaveChangesAsync(); // save the user with new refresh token

            return Ok(new TokenApiDto()
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUser([FromBody] User userObj)
        {
            if (userObj == null)
                return BadRequest();

            if (await CheckUserNameExistAsync(userObj.Username))
                return BadRequest(new { Message = "Username already exists!" });

            if (await CheckEmailExistAync(userObj.Email))
                return BadRequest(new { Message = "Email already exists!" });

            var pass = CheckPasswordStrength(userObj.Password);
            if (!string.IsNullOrEmpty(pass))
                return BadRequest(new { Message = pass.ToString() });

            userObj.Password = PasswordHasher.HashPassword(userObj.Password);
            userObj.Role = "User"; // Default role
            userObj.Token = "";
            await authContext.Users.AddAsync(userObj);
            await authContext.SaveChangesAsync();
            return Ok(new { Message = "User registered!" });
        }

        [Authorize] // to protect this route
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            return Ok(await authContext.Users.ToListAsync());
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(TokenApiDto tokenApiDto)
        {
            if (tokenApiDto is null)
                return BadRequest("Invalid client request");

            var accessToken = tokenApiDto.AccessToken;
            var refreshToken = tokenApiDto.RefreshToken;

            var principal = GetPrincipalFromExpiredToken(accessToken);
            var username = principal?.Identity?.Name; //this is mapped to the Name claim by default
            var user = await authContext.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null || user.RefreshToken != refreshToken || user.RefreshTokenExpiryTime <= DateTime.Now)
                return BadRequest("Invalid request");

            var newAccessToken = CreateJwt(user);
            var newRefreshToken = CreateRefreshToken();
            user.RefreshToken = newRefreshToken;
            await authContext.SaveChangesAsync();

            return Ok(new TokenApiDto()
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            });
        }

        [HttpPost("send-reset-email/{email}")]
        public async Task<IActionResult> SendEmail(string email)
        {
            var user = await authContext.Users.FirstOrDefaultAsync(x => x.Email == email);

            if (user == null)
                return NotFound(new
                {
                    StatusCode = 404,
                    Message = "Email does not exist!"
                });

            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var emailToken = Convert.ToBase64String(tokenBytes);
            user.ResetPasswordToken = emailToken;
            user.ResetPasswordExpiry = DateTime.Now.AddMinutes(15);
            var from = config["EmailSettings:From"];
            var emailModeol = new EmailModel(email, "Reset Password", EmailBody.EmailStringBody(email, emailToken));
            emailService.SendEmail(emailModeol);
            authContext.Entry(user).State = EntityState.Modified;
            await authContext.SaveChangesAsync();
            return Ok(new
            {
                StatusCode = 200,
                Message = "Email sent!"
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            var newToken = resetPasswordDto.EmailToken.Replace(" ", "+");
            var user = await authContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Email == resetPasswordDto.Email);

            if (user == null)
                return NotFound(new
                {
                    StatusCode = 404,
                    Message = "Email does not exist!"
                });

            var tokenCode = user.ResetPasswordToken;
            DateTime emailTokenExpiry = user.ResetPasswordExpiry;

            if (newToken != tokenCode || emailTokenExpiry < DateTime.Now)
                return BadRequest(new
                {
                    StatusCode = 400,
                    Message = "Invalid reset link!"
                });

            user.Password = PasswordHasher.HashPassword(resetPasswordDto.NewPassword);
            authContext.Entry(user).State = EntityState.Modified;
            await authContext.SaveChangesAsync();
            return Ok(new
            {
                StatusCode = 200,
                Message = "Password reset successful!"
            });
        }

        private Task<bool> CheckUserNameExistAsync(string username)
            => authContext.Users.AnyAsync(x => x.Username == username);

        private Task<bool> CheckEmailExistAync(string email)
            => authContext.Users.AnyAsync(x => x.Email == email);

        private static string CheckPasswordStrength(string pass)
        {
            StringBuilder sb = new StringBuilder();
            if (pass.Length < 9)
                sb.Append("Minimum password length should be 8" + Environment.NewLine);
            if (!(Regex.IsMatch(pass, "[a-z]") && Regex.IsMatch(pass, "[A-Z]") && Regex.IsMatch(pass, "[0-9]")))
                sb.Append("Password should be AlphaNumeric" + Environment.NewLine);
            if (!Regex.IsMatch(pass, "[<,>,@,!,#,$,%,^,&,*,(,),_,+,\\[,\\],{,},?,:,;,|,',\\,.,/,~,`,-,=]"))
                sb.Append("Password should contain special charcter" + Environment.NewLine);
            return sb.ToString();
        }

        private string CreateJwt(User user)
        {
            var jwtTokenHandler = new JwtSecurityTokenHandler();
            var signinKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("this is my custom Secret key for authentication"));
            var identity = new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name,$"{user.Username}")
            });

            var credentials = new SigningCredentials(signinKey, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = identity,
                Expires = DateTime.Now.AddSeconds(10),
                SigningCredentials = credentials
            };
            var token = jwtTokenHandler.CreateToken(tokenDescriptor);
            return jwtTokenHandler.WriteToken(token);
        }

        private string CreateRefreshToken()
        {
            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var refreshToken = Convert.ToBase64String(tokenBytes);

            var tokenInUser = authContext.Users.Any(x => x.RefreshToken == refreshToken);

            if (tokenInUser)
                return CreateRefreshToken();

            return refreshToken;
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("this is my custom Secret key for authentication")),
                ValidateLifetime = false
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            var jwtSecurityToken = securityToken as JwtSecurityToken;
            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token!");

            return principal; // return the payload of the token (claims, roles, etc)
        }
    }
}