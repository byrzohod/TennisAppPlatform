namespace TennisApp.Application.DTOs.Blog;

public class BlogPostDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? FeaturedImageUrl { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int ViewCount { get; set; }
    public List<string> Categories { get; set; } = new();
    public List<string> Tags { get; set; } = new();
}

public class CreateBlogPostDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? FeaturedImageUrl { get; set; }
    public List<string> Categories { get; set; } = new();
    public List<string> Tags { get; set; } = new();
}

public class UpdateBlogPostDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? FeaturedImageUrl { get; set; }
    public bool IsPublished { get; set; }
    public List<string> Categories { get; set; } = new();
    public List<string> Tags { get; set; } = new();
}