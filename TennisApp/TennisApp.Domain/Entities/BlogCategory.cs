namespace TennisApp.Domain.Entities;

public class BlogCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    // Navigation properties
    public ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();
}