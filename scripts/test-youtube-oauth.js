const { generateAuthUrl, exchangeCodeForTokens } = require('../config/youtube');

// Demo script to test YouTube OAuth2 flow
const testOAuth2Flow = async () => {
  console.log('🎯 YouTube OAuth2 Flow Test');
  console.log('============================\n');

  try {
    // Step 1: Generate authorization URL
    console.log('1️⃣ Generating authorization URL...');
    const authUrl = generateAuthUrl('test-state');
    console.log('✅ Authorization URL generated:');
    console.log(authUrl);
    console.log('\n📝 Instructions:');
    console.log('1. Copy the URL above and open it in your browser');
    console.log('2. Sign in with your YouTube account');
    console.log('3. Grant the requested permissions');
    console.log('4. Copy the authorization code from the redirect URL');
    console.log('5. Run the next step with the code\n');

    // Step 2: Exchange code for tokens (manual step)
    console.log('2️⃣ To exchange code for tokens, run:');
    console.log('node -e "');
    console.log('  const { exchangeCodeForTokens } = require(\'./config/youtube\');');
    console.log('  exchangeCodeForTokens(\'YOUR_AUTH_CODE_HERE\').then(console.log);');
    console.log('"\n');

    // Step 3: Test with a sample code (if provided)
    const sampleCode = process.argv[2];
    if (sampleCode) {
      console.log('3️⃣ Testing with provided authorization code...');
      const result = await exchangeCodeForTokens(sampleCode);
      
      if (result.success) {
        console.log('✅ Token exchange successful!');
        console.log('📊 Token info:');
        console.log(`   - Access Token: ${result.tokens.access_token.substring(0, 20)}...`);
        console.log(`   - Refresh Token: ${result.tokens.refresh_token ? 'Present' : 'Not provided'}`);
        console.log(`   - Scope: ${result.tokens.scope}`);
        console.log(`   - Expires: ${result.tokens.expiry_date ? new Date(result.tokens.expiry_date) : 'Never'}`);
        console.log(`   - Has Analytics Access: ${result.tokens.scope.includes('yt-analytics-monetary.readonly')}`);
      } else {
        console.log('❌ Token exchange failed:');
        console.log(`   Error: ${result.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Error in OAuth2 flow test:', error);
  }
};

// Check if environment variables are set
const checkEnvironment = () => {
  console.log('🔍 Environment Check');
  console.log('===================');
  
  const requiredVars = [
    'YOUTUBE_CLIENT_ID',
    'YOUTUBE_CLIENT_SECRET',
    'YOUTUBE_REDIRECT_URI'
  ];

  let allSet = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Not set`);
      allSet = false;
    }
  });

  console.log('');
  return allSet;
};

// Main execution
const main = async () => {
  if (!checkEnvironment()) {
    console.log('⚠️  Please set all required environment variables before running this test.');
    console.log('   Copy from env.example to .env and fill in your YouTube API credentials.');
    return;
  }

  await testOAuth2Flow();
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testOAuth2Flow, checkEnvironment }; 