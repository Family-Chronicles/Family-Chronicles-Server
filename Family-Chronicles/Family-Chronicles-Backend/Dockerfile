#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["Family-Chronicles-Backend/Family-Chronicles-Backend.csproj", "Family-Chronicles-Backend/"]
RUN dotnet restore "Family-Chronicles-Backend/Family-Chronicles-Backend.csproj"
COPY . .
WORKDIR "/src/Family-Chronicles-Backend"
RUN dotnet build "Family-Chronicles-Backend.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Family-Chronicles-Backend.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Family-Chronicles-Backend.dll"]