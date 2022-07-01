var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var config = builder.Configuration;
var connectionString = config.GetConnectionString("MariaDbConnectionString");
var serverVersion = ServerVersion.AutoDetect(connectionString);

builder.Services.AddDbContext<MariaDbContext>(
			dbContextOptions => dbContextOptions
				.UseMySql(connectionString, serverVersion)
				// The following three options help with debugging, but should
				// be changed or removed for production.
				.LogTo(Console.WriteLine, LogLevel.Information)
				.EnableSensitiveDataLogging()
				.EnableDetailedErrors()
		);

builder.Services.AddMvc();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
using (var context = scope.ServiceProvider.GetService<MariaDbContext>())
{
	if (context != null)
	{
		context.Database.EnsureCreated();
	}
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.UseSwagger(x => x.SerializeAsV2 = true);
	app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
