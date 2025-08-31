namespace TennisApp.Domain.Entities;

public class BlogTag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    
    // Navigation properties
    public ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();
}