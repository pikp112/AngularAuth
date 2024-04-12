namespace AngularAuthAPI.Models
{
    public class EmailModel(string to, string subject, string content)
    {
        public string To { get; set; } = to;
        public string Subject { get; set; } = subject;
        public string Content { get; set; } = content;
    }
}