using AngularAuthAPI.Models;
using MailKit.Net.Smtp;
using MimeKit;

namespace AngularAuthAPI.UtilityService
{
    public class EmailService(IConfiguration configuration) : IEmailService
    {
        public void SendEmail(EmailModel emailModel)
        {
            var emailMessage = new MimeMessage();
            var from = configuration["EmailSettings:From"];
            emailMessage.From.Add(new MailboxAddress("Sorin ADM", from));
            emailMessage.To.Add(new MailboxAddress(emailModel.To, emailModel.To));
            emailMessage.Subject = emailModel.Subject;
            emailMessage.Body = new TextPart(MimeKit.Text.TextFormat.Html)
            {
                Text = string.Format(emailModel.Content)
            };

            using (var client = new SmtpClient())
            {
                try
                {
                    client.Connect(configuration["EmailSettings:SmtpServer"], 465, true);
                    client.Authenticate(configuration["EmailSettings:From"], configuration["EmailSettings:Password"]);
                    client.Send(emailMessage);
                }
                catch (Exception ex)
                {
                    throw new Exception(ex.Message);
                }
                finally
                {
                    client.Disconnect(true); // disconnect from the server
                    client.Dispose();
                }
            }
        }
    }
}