const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');

// Replace with your actual Client ID and Client Secret from Google Cloud Console
const CLIENT_ID = 'YOUR_CLIENT_ID'; 
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000'; // Must match the Authorized redirect URI in Google Cloud Console

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function getRefreshToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this URL:');
  console.log(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      console.log('\nSuccessfully obtained tokens:');
      console.log('Access Token:', tokens.access_token);
      console.log('Refresh Token:', tokens.refresh_token);
      console.log('\nIMPORTANT: Save the Refresh Token in your .env.local file!');
    } catch (error) {
      console.error('Error retrieving access token:', error);
    }
  });
}

getRefreshToken();