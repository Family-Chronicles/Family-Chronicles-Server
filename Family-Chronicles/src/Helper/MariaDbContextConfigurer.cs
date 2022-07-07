using System.Data.Common;

namespace Family_Chronicles_Server.Helper;

public static class MariaDbContextConfigurer
{
	public static void Configure(DbContextOptionsBuilder<MariaDbContext> builder, string connectionString)
	{
		var serverVersion = ServerVersion.AutoDetect(connectionString);
		builder.UseMySql(connectionString, serverVersion);
	}

	public static void Configure(DbContextOptionsBuilder<MariaDbContext> builder, DbConnection connection)
	{
		var serverVersion = ServerVersion.AutoDetect(connection.ConnectionString);

		builder.UseMySql(connection, serverVersion);
	}
}
