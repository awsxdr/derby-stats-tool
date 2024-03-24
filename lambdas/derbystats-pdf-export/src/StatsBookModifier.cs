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

			for (var trip = 2; trip < scoreLine.ScoringTrips.Length; ++trip)
			{
				if (int.TryParse(scoreLine.ScoringTrips[trip], out var score))
				{
					SetCellValue(document, column + 7 + trip - 2, row, score);
				}
			}
		}

		for (var line = 0; line < stats.Scores.Period1.HomeScores.Length; ++line)
			WriteScoreLine(stats.Scores.Period1.HomeScores[line], 0, line + 4);

		for (var line = 0; line < stats.Scores.Period1.AwayScores.Length; ++line)
			WriteScoreLine(stats.Scores.Period1.AwayScores[line], 19, line + 4);

		for (var line = 0; line < stats.Scores.Period2.HomeScores.Length; ++line)
			WriteScoreLine(stats.Scores.Period2.HomeScores[line], 0, line + 46);

		for (var line = 0; line < stats.Scores.Period2.AwayScores.Length; ++line)
			WriteScoreLine(stats.Scores.Period2.AwayScores[line], 19, line + 46);

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

        void WritePenalties(Penalty[][] penalties, int column, int row, int[] lineOffsets)
        {
            for(var line = 0; line < penalties.Length; ++line)
            {
                WritePenaltyLine(penalties[line], column + lineOffsets[line], row + line * 2);
            }
        }

        void WritePenaltyLine(Penalty[] penalties, int column, int row)
        {
			for (var penalty = 0; penalty < penalties.Length; ++penalty)
			{
                if(penalties[penalty].Code.Length > 0)
				    SetCell(document, column + penalty, row, penalties[penalty].Code);
				if (int.TryParse(penalties[penalty].Jam, out var jam))
					SetCellValue(document, column + penalty, row + 1, jam);
			}
        }

        WritePenalties(stats.Penalties.Period1.HomePenalties, 1, 4, new int[stats.Penalties.Period1.HomePenalties.Length]);
        WritePenalties(stats.Penalties.Period1.AwayPenalties, 16, 4, new int[stats.Penalties.Period1.AwayPenalties.Length]);
        WritePenalties(stats.Penalties.Period2.HomePenalties, 29, 4, stats.Penalties.Period1.HomePenalties.Select(p => p.Length).ToArray());
        WritePenalties(stats.Penalties.Period2.AwayPenalties, 44, 4, stats.Penalties.Period1.AwayPenalties.Select(p => p.Length).ToArray());

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

        WriteLineup(stats.Lineups.Period1.HomeLineups, 1, 4);
        WriteLineup(stats.Lineups.Period1.AwayLineups, 27, 4);
        WriteLineup(stats.Lineups.Period2.HomeLineups, 1, 46);
        WriteLineup(stats.Lineups.Period2.AwayLineups, 27, 46);

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

		for (var i = 0; i < roster.Skaters.Length; ++i)
		{
			SetSkater(document, teamType, i, roster.Skaters[i].Number, roster.Skaters[i].Name);
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