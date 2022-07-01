namespace Family_Chronicles_Backend.Helper;

public class MariaDbContext : DbContext
{
	private readonly IConfiguration _config;

	public MariaDbContext(IConfiguration config)
	{
		_config = config;
	}

	protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
	{
		optionsBuilder.UseMySQL(@_config["MariaDbConnectionString"]);
	}
}
