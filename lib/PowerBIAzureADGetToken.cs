using System;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace powerbi_azuread_gettoken
{
    class PowerBIAzureADGetToken
    {
        static void Main(string[] args)
        {
            string token = GetToken(args[0], args[1]);
            Console.WriteLine(token);
        }

        private static string GetToken(string clientID, string authorityUri)
        {
            // Uri's for PowerBI desktop app
            string redirectUri = "https://login.live.com/oauth20_desktop.srf";
            string resourceUri = "https://analysis.windows.net/powerbi/api";

            // Acquire an Azure access token
            AuthenticationContext authContext = new AuthenticationContext(authorityUri);
            string token = authContext.AcquireTokenAsync(resourceUri, clientID, new Uri(redirectUri),
              new PlatformParameters(PromptBehavior.Auto)).Result.AccessToken;

            return token;
        }
    }
}
