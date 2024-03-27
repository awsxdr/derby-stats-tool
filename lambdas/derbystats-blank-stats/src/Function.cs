using System.IO.Compression;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace DerbyStatsBlankStats;

public class Function
{
    public static async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest request) =>
        request.RequestContext.Http.Method switch {
            "GET" when request.PathParameters?.ContainsKey("documentId") ?? false => await GetBlankStatsBook(request),
            "GET" => await GetBlankStatsBookList(request),
            "POST" => await PutBlankStatsBook(request),
            _ => new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.NotFound }
        };

    private static async Task<APIGatewayProxyResponse> GetBlankStatsBookList(APIGatewayHttpApiV2ProxyRequest request)
    {
        if (!request.RequestContext.Authorizer.Jwt.Claims.TryGetValue("username", out var userId) || string.IsNullOrEmpty(userId))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.Forbidden };

        var dbClient = new AmazonDynamoDBClient();
        var response = await dbClient.GetItemAsync("derbystats-users", new() { ["user_id"] = new () { S = userId } });
        
        if (response.HttpStatusCode != HttpStatusCode.OK)
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.NotFound };
        
        if (!response.Item.TryGetValue("blank_stats_book_filename", out var item))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.OK, Body = "[]" };

        return new APIGatewayProxyResponse 
        { 
            StatusCode = (int)HttpStatusCode.OK, 
            Body = JsonSerializer.Serialize(new[] { item.S }),
        };
    }

    private static async Task<APIGatewayProxyResponse> GetBlankStatsBook(APIGatewayHttpApiV2ProxyRequest request)
    {
        if (!request.RequestContext.Authorizer.Jwt.Claims.TryGetValue("username", out var userId) || string.IsNullOrEmpty(userId))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.Forbidden };

        var dbClient = new AmazonDynamoDBClient();
        var response = await dbClient.GetItemAsync("derbystats-users", new() { ["user_id"] = new () { S = userId } });
        
        if (response.HttpStatusCode != HttpStatusCode.OK)
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.NotFound };
        
        if (!response.Item.TryGetValue("blank_stats_book_key", out var item))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.NotFound };

        var s3Client = new AmazonS3Client();
        var data = await s3Client.GetObjectAsync("derby-stats-blank-statsbooks", item.S);

        using var dataStream = new MemoryStream();
        await data.ResponseStream.CopyToAsync(dataStream);

        return new APIGatewayProxyResponse
        {
            Headers = new Dictionary<string, string>
            {
                ["Content-Type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            },
            StatusCode = (int)HttpStatusCode.OK,
            Body = Convert.ToBase64String(dataStream.ToArray()),
            IsBase64Encoded = true,
        };
    }

    private static async Task<APIGatewayProxyResponse> PutBlankStatsBook(APIGatewayHttpApiV2ProxyRequest request)
    {
        if (!request.RequestContext.Authorizer.Jwt.Claims.TryGetValue("username", out var userId) || string.IsNullOrEmpty(userId))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.Forbidden };

        if (!request.Headers.TryGetValue("content-length", out var contentLengthString))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.LengthRequired };

        if (!int.TryParse(contentLengthString, out var contentLength))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.BadRequest, Body = "content-length header is malformed" };
        
        if (contentLength <= 0 || string.IsNullOrEmpty(request.Body))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.BadRequest, Body = "Body must be provided" };

        if (contentLength > 10 * 1024 * 1024 /* 10MB */)
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.RequestEntityTooLarge };

        var parsedData = JsonNode.Parse(request.IsBase64Encoded ? Encoding.UTF8.GetString(Convert.FromBase64String(request.Body)) : request.Body)?.AsObject();

        if(parsedData == null)
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.BadRequest, Body = "Body cannot be parsed" };

        if(!parsedData.ContainsKey("filename") || !parsedData.ContainsKey("data"))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.BadRequest, Body = "Required fields missing from body" };

        var filename = parsedData["filename"]?.AsValue().ToString();
        var data = parsedData["data"]?.AsValue().ToString();

        if(filename == null || data == null)
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.BadRequest, Body = "Required fields missing from body" };

        byte[] uploadedData;
        try
        {
            uploadedData = Convert.FromBase64String(data);
        }
        catch(FormatException)
        {
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.BadRequest, Body = "Data is not valid base64" };
        }

        var zipFilePath = Path.GetTempFileName();
        try
        {
            File.WriteAllBytes(zipFilePath, uploadedData);
            using var zipFile = ZipFile.OpenRead(zipFilePath);

            if(!zipFile.Entries.Any(f => f.FullName.Contains("xl/worksheets/sheet2.xml")))
                throw new InvalidDataException();
        }
        catch(InvalidDataException)
        {
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.BadRequest, Body = "Invalid file format" };
        }
        finally
        {
            if(File.Exists(zipFilePath))
                File.Delete(zipFilePath);
        }

        var dbClient = new AmazonDynamoDBClient();
        var s3Client = new AmazonS3Client();

        var getItemResponse = await dbClient.GetItemAsync("derbystats-users", new() { ["user_id"] = new () { S = userId } });
        
        if (getItemResponse.Item.TryGetValue("blank_stats_book_key", out var blankStatsKey))
        {
            await s3Client.DeleteObjectAsync("derby-stats-blank-statsbooks", blankStatsKey.S);
        }

        var key = Guid.NewGuid().ToString();

        using var uploadedDataStream = new MemoryStream(uploadedData);

        await s3Client.PutObjectAsync(new PutObjectRequest 
        {
            BucketName = "derby-stats-blank-statsbooks",
            Key = key,
            InputStream = uploadedDataStream
        });

        await dbClient.PutItemAsync(
            "derbystats-users", 
            new Dictionary<string, AttributeValue>() {
                ["user_id"] = new() { S = userId },
                ["document_id"] = new() { S = Guid.NewGuid().ToString() },
                ["blank_stats_book_key"] = new() { S = key },
                ["blank_stats_book_filename"] = new() { S = filename },
            });

        return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.OK };
    }
}