require('dotenv').config();
const { 
  getStoreSize, 
  clearStore 
} = require('../utils/tokenStore');

async function monitorTokens() {
  try {
    console.log('🔍 Token Store Monitoring');
    console.log('========================');
    
    const tokenCount = await getStoreSize();
    console.log(`📊 Active tokens: ${tokenCount}`);
    
    const estimatedMemory = tokenCount * 0.5;
    console.log(`💾 Estimated memory usage: ${estimatedMemory.toFixed(2)} KB`);
    
    console.log('========================');
    
    if (tokenCount > 1000) {
      console.log('⚠️  Warning: High token count detected');
      console.log('💡 Consider clearing old tokens');
    }
    
  } catch (error) {
    console.error('❌ Monitoring error:', error);
  }
}

async function clearAllTokens() {
  try {
    console.log('🧹 Clearing all tokens...');
    await clearStore();
    console.log('✅ All tokens cleared successfully');
  } catch (error) {
    console.error('❌ Clear error:', error);
  }
}

const command = process.argv[2];

switch (command) {
  case 'monitor':
    monitorTokens();
    break;
  case 'clear':
    clearAllTokens();
    break;
  default:
    console.log('Usage:');
    console.log('  node scripts/monitorTokens.js monitor  - Monitor token usage');
    console.log('  node scripts/monitorTokens.js clear    - Clear all tokens');
    break;
} 