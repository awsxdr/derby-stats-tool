using System.Text.Json.Serialization;

namespace DerbyStatsExport;

public class GameStats
{
    [JsonPropertyName("game")] public GameDetails Game { get; set; }
	[JsonPropertyName("rosters")] public Rosters Rosters { get; set; }
	[JsonPropertyName("scores")] public Scores Scores { get; set; }
	[JsonPropertyName("penalties")] public Penalties Penalties { get; set; }
	[JsonPropertyName("lineups")] public Lineups Lineups { get; set; }
}

public class GameDetails
{
    [JsonPropertyName("venue")] public string Venue { get; set; }
    [JsonPropertyName("city")] public string City { get; set; }
    [JsonPropertyName("state")] public string State { get; set; }
    [JsonPropertyName("gameNumber")] public string GameNumber { get; set; }
    [JsonPropertyName("tournament")] public string Tournament { get; set; }
    [JsonPropertyName("hostLeague")] public string HostLeague { get; set; }
    [JsonPropertyName("date")] public string Date { get; set; }
    [JsonPropertyName("time")] public string Time { get; set; }
}

public class Lineups
{
	[JsonPropertyName("1")] public PeriodLineups Period1 { get; set; }
	[JsonPropertyName("2")] public PeriodLineups Period2 { get; set; }
}

public class PeriodLineups
{
	[JsonPropertyName("home")] public LineupLine[] HomeLineups { get; set; }
	[JsonPropertyName("away")] public LineupLine[] AwayLineups { get; set; }
}

public class LineupLine
{
	[JsonPropertyName("skaters")] public SkaterLineups Skaters { get; set; }
	[JsonPropertyName("jamNumber")] public string JamNumber { get; set; }
	[JsonPropertyName("noPivot")] public bool NoPivot { get; set; }
}

public class SkaterLineups
{
	[JsonPropertyName("jammer")] public SkaterLineup Jammer { get; set; }
	[JsonPropertyName("pivot")] public SkaterLineup Pivot { get; set; }
	[JsonPropertyName("blocker1")] public SkaterLineup Blocker1 { get; set; }
	[JsonPropertyName("blocker2")] public SkaterLineup Blocker2 { get; set; }
	[JsonPropertyName("blocker3")] public SkaterLineup Blocker3 { get; set; }
}

public class SkaterLineup
{
	[JsonPropertyName("number")] public string Number { get; set; }
	[JsonPropertyName("events")] public string[] Events { get; set; }
}

public class Penalties 
{
	[JsonPropertyName("1")] public PeriodPenalties Period1 { get; set; }
	[JsonPropertyName("2")] public PeriodPenalties Period2 { get; set; }
}

public class PeriodPenalties
{
	[JsonPropertyName("home")] public Penalty[][] HomePenalties { get; set; }
	[JsonPropertyName("away")] public Penalty[][] AwayPenalties { get; set; }
}

public class Penalty
{
	[JsonPropertyName("jam")] public string Jam { get; set;}
	[JsonPropertyName("code")] public string Code { get; set; }
}

public class Scores
{
	[JsonPropertyName("1")] public PeriodScores Period1 { get; set; }
	[JsonPropertyName("2")] public PeriodScores Period2 { get; set; }
}

public class PeriodScores
{
	[JsonPropertyName("home")] public ScoreLine[] HomeScores { get; set; }
	[JsonPropertyName("away")] public ScoreLine[] AwayScores { get; set; }
}

public class ScoreLine
{
	[JsonPropertyName("jam")] public string JamNumber { get; set; }
	[JsonPropertyName("jammer")] public string JammerNumber { get; set; }
	[JsonPropertyName("lost")] public bool Lost { get; set; }
	[JsonPropertyName("lead")] public bool Lead { get; set; }
	[JsonPropertyName("call")] public bool Call { get; set; }
	[JsonPropertyName("injury")] public bool Injury { get; set; }
	[JsonPropertyName("noInitial")] public bool NoInitial { get; set; }
	[JsonPropertyName("trips")] public string[] ScoringTrips { get; set; }
	[JsonPropertyName("jamTotal")] public string JamTotal { get; set; }
	[JsonPropertyName("gameTotal")] public string GameTotal { get; set; }
}

public class Rosters
{
    [JsonPropertyName("home")] public TeamRoster HomeTeamRoster { get; set; }
    [JsonPropertyName("away")] public TeamRoster AwayTeamRoster { get; set; }
}

public class TeamRoster
{
    [JsonPropertyName("league")] public string League { get; set; }
    [JsonPropertyName("team")] public string Team { get; set; }
    [JsonPropertyName("color")] public string Color { get; set; }
    [JsonPropertyName("skaters")] public Skater[] Skaters { get; set; }
}

public class Skater
{
    [JsonPropertyName("number")] public string Number { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; }
}