using System.Net;
using System.Text;
using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace DerbyStatsDocuments;

public class Function
{
    public static async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest request) =>
        request.RequestContext.Http.Method switch {
            "GET" => await GetCurrentDocument(request),
            "POST" => await SetCurrentDocument(request),
            _ => new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.NotFound }
        };

    private static async Task<APIGatewayProxyResponse> GetCurrentDocument(APIGatewayHttpApiV2ProxyRequest request)
    {
        if (!request.RequestContext.Authorizer.Jwt.Claims.TryGetValue("username", out var userId) || string.IsNullOrEmpty(userId))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.Forbidden };

        var s3Client = new AmazonS3Client();

        GetObjectResponse s3Response;
        try
        {
            s3Response = await s3Client.GetObjectAsync("derby-stats-documents", userId);
        }
        catch (AmazonS3Exception)
        {
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.NotFound };
        }
        
        using var dataReader = new StreamReader(s3Response.ResponseStream);

        return new APIGatewayProxyResponse 
        {
            StatusCode = (int)HttpStatusCode.OK,
            Body = await dataReader.ReadToEndAsync(),
        };
    }

    private static async Task<APIGatewayProxyResponse> SetCurrentDocument(APIGatewayHttpApiV2ProxyRequest request)
    {
        if (!request.RequestContext.Authorizer.Jwt.Claims.TryGetValue("username", out var userId) || string.IsNullOrEmpty(userId))
            return new APIGatewayProxyResponse { StatusCode = (int)HttpStatusCode.Forbidden };
        
        var documentData = JsonSerializer.Deserialize<GameStats>(
            request.IsBase64Encoded 
            ? Encoding.UTF8.GetString(Convert.FromBase64String(request.Body)) 
            : request.Body);

        var s3Client = new AmazonS3Client();
        await s3Client.PutObjectAsync(new PutObjectRequest 
        {
            BucketName = "derby-stats-documents",
            Key = userId,
            ContentType = "application/json",
            ContentBody = JsonSerializer.Serialize(documentData),
        });

        return new APIGatewayProxyResponse
        {
            StatusCode = (int)HttpStatusCode.OK,
        };
    }
}