using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace DerbyStatsExport;

public class Function
{
    private IAmazonS3 S3Client { get; set; }

    public Function() 
    {
        S3Client = new AmazonS3Client();
    }

    public static async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request)
    {
        var client = new AmazonS3Client(RegionEndpoint.GetBySystemName("eu-west-2"));

        using var getResponse = await client.GetObjectAsync(new GetObjectRequest 
        {
            BucketName = "derby-stats-blank-statsbooks",
            Key = "wftda-statsbook-full-A4.xlsx",
        });

        using var memoryStream = new MemoryStream();

        await getResponse.ResponseStream.CopyToAsync(memoryStream);

        var gameStats = JsonSerializer.Deserialize<GameStats>(request.Body)!;
        
        var zipFilePath = Path.GetTempFileName();
        File.WriteAllBytes(zipFilePath, memoryStream.ToArray());

        StatsBookModifier.ApplyStats(zipFilePath, gameStats);

        var base64Data = Convert.ToBase64String(File.ReadAllBytes(zipFilePath));

        return new APIGatewayProxyResponse
        {
            Headers = new Dictionary<string, string>
            {
                ["Content-Type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            },
            StatusCode = (int)HttpStatusCode.OK,
            Body = base64Data,
            IsBase64Encoded = true
        };
    }
}