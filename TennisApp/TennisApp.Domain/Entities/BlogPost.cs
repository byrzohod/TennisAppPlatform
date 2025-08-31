namespace TennisApp.Domain.Entities;

public class BlogPost
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? FeaturedImageUrl { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<BlogCategory> Categories { get; set; } = new List<BlogCategory>();
    public ICollection<BlogTag> Tags { get; set; } = new List<BlogTag>();
}