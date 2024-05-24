using System.IO.Compression;
using System.Xml.Linq;

namespace DerbyStatsExport;

public static class StatsBookModifier
{
	public static void ApplyStats(string xlsxPath, GameStats stats)
	{
		using var statsbook = ZipFile.Open(xlsxPath, ZipArchiveMode.Update);
		
		UpdateIgrf(statsbook, stats);
		UpdateScore(statsbook, stats);
		UpdatePenalties(statsbook, stats);
		UpdateLineups(statsbook, stats);
	}
	
	private static void UpdateIgrf(ZipArchive statsbook, GameStats stats)
	{
		var igrf = statsbook.GetEntry("xl/worksheets/sheet2.xml")!;
		XDocument document;

		using (var stream = igrf.Open())
		{
			document = XDocument.Load(stream);
		}

        SetCell(document, 1, 3, stats.Game.Venue);
        SetCell(document, 8, 3, stats.Game.City);
        SetCell(document, 10, 3, stats.Game.State);
        SetCell(document, 11, 3, stats.Game.GameNumber);
        SetCell(document, 1, 5, stats.Game.Tournament);
        SetCell(document, 8, 5, stats.Game.HostLeague);
        SetCell(document, 1, 7, stats.Game.Date);
        SetCell(document, 8, 7, stats.Game.Time);

		SetRoster(document, stats, TeamType.Home);
		SetRoster(document, stats, TeamType.Away);

		SetOfficialsRoster(document, stats);

		using (var stream = igrf.Open())
		{
			document.Save(stream, SaveOptions.DisableFormatting);
			stream.Flush();
		}
	}
	
	private static void UpdateScore(ZipArchive statsbook, GameStats stats)
	{
		var score = statsbook.GetEntry("xl/worksheets/sheet3.xml")!;
		XDocument document;
		
		using (var stream = score.Open())
		{
			document = XDocument.Load(stream);
		}
		
		void WriteScoreLine(ScoreLine scoreLine, int column, int row)
		{
			if (int.TryParse(scoreLine.JamNumber, out var jamNumber))
				SetCellValue(document, column, row, jamNumber);
			else
				SetCell(document, column, row, scoreLine.JamNumber);

			SetCell(document, column + 1, row, scoreLine.JammerNumber);
			if (scoreLine.Lost) SetCell(document, column + 2, row, "X");
			if (scoreLine.Lead) SetCell(document, column + 3, row, "X");
			if (scoreLine.Call) SetCell(document, column + 4, row, "X");
			if (scoreLine.Injury) SetCell(document, column + 5, row, "X");
			if (scoreLine.NoInitial) SetCell(document, column + 6, row, "X");

			for (var trip = 0; trip < scoreLine.ScoringTrips.Length; ++trip)
			{
				if (int.TryParse(scoreLine.ScoringTrips[trip], out var score))
				{
					SetCellValue(document, column + 7 + trip, row, score);
				}
			}
		}

		for (var line = 0; line < stats.Scores.Period1.HomeScores.Lines.Length; ++line)
			WriteScoreLine(stats.Scores.Period1.HomeScores.Lines[line], 0, line + 4);

		for (var line = 0; line < stats.Scores.Period1.AwayScores.Lines.Length; ++line)
			WriteScoreLine(stats.Scores.Period1.AwayScores.Lines[line], 19, line + 4);

		for (var line = 0; line < stats.Scores.Period2.HomeScores.Lines.Length; ++line)
			WriteScoreLine(stats.Scores.Period2.HomeScores.Lines[line], 0, line + 46);

		for (var line = 0; line < stats.Scores.Period2.AwayScores.Lines.Length; ++line)
			WriteScoreLine(stats.Scores.Period2.AwayScores.Lines[line], 19, line + 46);
		
		SetCell(document, 11, 1, stats.Scores.Period1.HomeScores.Scorekeeper);
		SetCell(document, 14, 1, stats.Scores.Period1.HomeScores.JammerRef);
		SetCell(document, 30, 1, stats.Scores.Period1.AwayScores.Scorekeeper);
		SetCell(document, 33, 1, stats.Scores.Period1.AwayScores.JammerRef);
		SetCell(document, 11, 43, stats.Scores.Period2.HomeScores.Scorekeeper);
		SetCell(document, 14, 43, stats.Scores.Period2.HomeScores.JammerRef);
		SetCell(document, 30, 43, stats.Scores.Period2.AwayScores.Scorekeeper);
		SetCell(document, 33, 43, stats.Scores.Period2.AwayScores.JammerRef);

		using (var stream = score.Open())
		{
			document.Save(stream, SaveOptions.DisableFormatting);
			stream.Flush();
		}

	}
	
	private static void UpdatePenalties(ZipArchive statsbook, GameStats stats)
	{
		var penalties = statsbook.GetEntry("xl/worksheets/sheet4.xml")!;
		XDocument document;

		using (var stream = penalties.Open())
		{
			document = XDocument.Load(stream);
		}

		void WritePenalties(Penalty[][] penalties, int column, int row)
		{
			for (var line = 0; line < penalties.Length; ++line)
			{
				WritePenaltyLine(penalties[line], column, row + line * 2);
			}
		}

		void WritePenaltyLine(Penalty[] penalties, int column, int row)
		{
			for (var penalty = 0; penalty < (penalties?.Length ?? 0); ++penalty)
			{
				if (penalties![penalty].Code.Length > 0)
					SetCell(document, column + penalty, row, penalties![penalty].Code);
				if (int.TryParse(penalties![penalty].Jam, out var jam))
					SetCellValue(document, column + penalty, row + 1, jam);
			}
		}

		WritePenalties(stats.Penalties.Period1.HomePenalties.Lines, 1, 4);
		WritePenalties(stats.Penalties.Period1.AwayPenalties.Lines, 16, 4);
		WritePenalties(stats.Penalties.Period2.HomePenalties.Lines, 29, 4);
		WritePenalties(stats.Penalties.Period2.AwayPenalties.Lines, 44, 4);

		var period1Tracker = 
			!string.IsNullOrWhiteSpace(stats.Penalties.Period1.AwayPenalties.PenaltyTracker) && stats.Penalties.Period1.HomePenalties.PenaltyTracker != stats.Penalties.Period1.AwayPenalties.PenaltyTracker
			? $"{stats.Penalties.Period1.HomePenalties.PenaltyTracker} / {stats.Penalties.Period1.AwayPenalties.PenaltyTracker}"
			: stats.Penalties.Period1.HomePenalties.PenaltyTracker;
		SetCell(document, 13, 1, period1Tracker);
		var period2Tracker = 
			!string.IsNullOrWhiteSpace(stats.Penalties.Period2.AwayPenalties.PenaltyTracker) && stats.Penalties.Period2.HomePenalties.PenaltyTracker != stats.Penalties.Period2.AwayPenalties.PenaltyTracker
			? $"{stats.Penalties.Period2.HomePenalties.PenaltyTracker} / {stats.Penalties.Period2.AwayPenalties.PenaltyTracker}"
			: stats.Penalties.Period2.HomePenalties.PenaltyTracker;
		SetCell(document, 41, 1, period2Tracker);

		using (var stream = penalties.Open())
		{
			document.Save(stream, SaveOptions.DisableFormatting);
			stream.Flush();
		}
	}

	private static void UpdateLineups(ZipArchive statsbook, GameStats stats)
	{
		var lineup = statsbook.GetEntry("xl/worksheets/sheet5.xml")!;
		XDocument document;

		using (var stream = lineup.Open())
		{
			document = XDocument.Load(stream);
		}

        void WriteLineup(LineupLine[] lineups, int column, int row)
        {
            for(var line = 0; line < lineups.Length; ++line)
            {
                WriteLineupLine(lineups[line], column, row + line);
            }
        }

        void WriteLineupLine(LineupLine line, int column, int row)
        {
			if (line == null) return;
			
			if(line.NoPivot) SetCell(document, column, row, "X");
			WriteSkaterLineup(line.Skaters.Jammer, column + 1, row, false);
			WriteSkaterLineup(line.Skaters.Pivot, column + 5, row);
			WriteSkaterLineup(line.Skaters.Blocker1, column + 9, row);
			WriteSkaterLineup(line.Skaters.Blocker2, column + 13, row);
			WriteSkaterLineup(line.Skaters.Blocker3, column + 17, row);
        }
		
		void WriteSkaterLineup(SkaterLineup skaterLineup, int startColumn, int row, bool writeNumber = true)
		{
			if(writeNumber) SetCell(document, startColumn, row, skaterLineup.Number);
			for(var i = 0; i < skaterLineup.Events.Length; ++i)
			{
				SetCell(document, startColumn + 1 + i, row, skaterLineup.Events[i]);
			}
		}

        WriteLineup(stats.Lineups.Period1.HomeLineups.Lines, 1, 4);
        WriteLineup(stats.Lineups.Period1.AwayLineups.Lines, 27, 4);
        WriteLineup(stats.Lineups.Period2.HomeLineups.Lines, 1, 46);
        WriteLineup(stats.Lineups.Period2.AwayLineups.Lines, 27, 46);

		SetCell(document, 15, 1, stats.Lineups.Period1.HomeLineups.LineupTracker);
		SetCell(document, 41, 1, stats.Lineups.Period1.AwayLineups.LineupTracker);
		SetCell(document, 15, 43, stats.Lineups.Period2.HomeLineups.LineupTracker);
		SetCell(document, 41, 43, stats.Lineups.Period2.AwayLineups.LineupTracker);

		using (var stream = lineup.Open())
		{
			document.Save(stream, SaveOptions.DisableFormatting);
			stream.Flush();
		}
	}

	private enum TeamType
	{
		Home,
		Away,
	}

	private static void SetRoster(XDocument document, GameStats stats, TeamType teamType)
	{
		var roster = teamType switch
		{
			TeamType.Home => stats.Rosters.HomeTeamRoster,
			TeamType.Away => stats.Rosters.AwayTeamRoster,
            _ => throw new ArgumentException()
        };

        SetCell(document, teamType == TeamType.Home ? 1 : 8, 10, roster.League);
        SetCell(document, teamType == TeamType.Home ? 1 : 8, 11, roster.Team);
        SetCell(document, teamType == TeamType.Home ? 1 : 8, 12, roster.Color);
		SetCell(document, teamType == TeamType.Home ? 1 : 8, 49, roster.CaptainSkateName);
		SetCell(document, teamType == TeamType.Home ? 1 : 8, 50, roster.CaptainLegalName);

		for (var i = 0; i < (roster.Skaters?.Length ?? 0); ++i)
		{
			if(roster.Skaters![i] == null)
				continue;
			SetSkater(document, teamType, i, roster.Skaters![i].Number, roster.Skaters[i].Name);
		}
	}

	private static void SetOfficialsRoster(XDocument document, GameStats stats)
	{
		var officials = stats.Officials.ToList();
		string[] targetOrder = [
			"Head Non-Skating Official",
			"Penalty Wrangler",
			"Inside Whiteboard Operator",
			"Jam Timer",
			"Penalty Lineup Tracker",
			"Penalty Lineup Tracker",
			"Scorekeeper",
			"Scorekeeper",
			"ScoreBoard Operator",
			"Penalty Box Manager",
			"Penalty Box Timer",
			"Penalty Box Timer",
			"Non-Skating Official Alternate",
			"Period Timer",
			"",
			"",
			"",
			"",
			"",
			"",
			"Head Referee",
			"Inside Pack Referee",
			"Jammer Referee",
			"Jammer Referee",
			"Outside Pack Referee",
			"Outside Pack Referee",
			"Outside Pack Referee",
			"Referee Alternate",
		];

		string NormalizeRole(string role) => role.ToLowerInvariant().Replace(" ", "").Replace("-", "");

		var orderedOfficials = new List<Official>();

		foreach (var target in targetOrder)
		{
			var normalizedTarget = NormalizeRole(target);
			var matchIndex = officials.FindIndex(o => NormalizeRole(o.Role).Equals(normalizedTarget));

			if(matchIndex >= 0)
			{
				orderedOfficials.Add(officials[matchIndex]);
				officials.RemoveAt(matchIndex);
			}
			else
			{
				orderedOfficials.Add(new Official() { Role = target });
			}
		}

		if(officials.Count > 5)
		{
			// Unable to find enough matches
			orderedOfficials = stats.Officials.ToList();
		}
		else
		{
			var firstBlankTarget = targetOrder.TakeWhile(r => !string.IsNullOrEmpty(r)).Count();
			for(var i = 0; i < officials.Count; ++i)
			{
				orderedOfficials[firstBlankTarget + i] = officials[i];
			}
		}

		for(var i = 0; i < 28; ++i)
		{
			var official = orderedOfficials.Count > i ? orderedOfficials[i] : new Official { Name = "", Role = "" };

			SetCell(document, 0, 60 + i, official.Role);
			SetCell(document, 2, 60 + i, official.Name);
			SetCell(document, 7, 60 + i, official.League);
			if(int.TryParse(official.CertificationLevel, out var certificationLevel))
			{
				SetCellValue(document, 10, 60 + i, certificationLevel);
			}
		}
	}
	
	private static string GetColumnString(int column)
	{
		if(column >= 26)
		{
			return $"{(char)('A' + (column / 26) - 1)}{(char)('A' + column % 26)}";
		}
		return ((char)('A' + column)).ToString();
	}
	
	private static void SetCell(XDocument document, int column, int row, string value)
	{
		if (string.IsNullOrWhiteSpace(value))
			return;

		var ns = document.Root!.Name.Namespace;
		
		var rowString = row.ToString();
		var columnString = GetColumnString(column);

		var cell = document.Root!
			.Element(ns + "sheetData")!
			.Elements(ns + "row")
			.Single(e => e.Attribute("r")!.Value == rowString)
			.Elements(ns + "c")
			.Single(e => e.Attribute("r")!.Value == $"{columnString}{rowString}");

		cell.Attribute("t")?.Remove();

		cell.Add(
			new XAttribute("t", "inlineStr"),
			new XElement(ns + "is",
				new XElement(ns + "t", value)
			)
		);
	}
	
	private static void SetCellValue(XDocument document, int column, int row, int value)
	{		
		var ns = document.Root!.Name.Namespace;

		var rowString = row.ToString();
		var columnString = GetColumnString(column);

		var cell = document.Root!
			.Element(ns + "sheetData")!
			.Elements(ns + "row")
			.Single(e => e.Attribute("r")!.Value == rowString)
			.Elements(ns + "c")
			.Single(e => e.Attribute("r")!.Value == $"{columnString}{rowString}");

		cell.Add(
			new XElement(ns + "v", value)
		);
	}

	private static void SetSkater(XDocument document, TeamType teamType, int line, string number, string name)
	{
		SetCell(document, teamType == TeamType.Home ? 1 : 8, line + 14, number);
		SetCell(document, teamType == TeamType.Home ? 2 : 9, line + 14, name);
	}
}