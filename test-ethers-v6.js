// 测试ethers.js v6的BrowserProvider功能
const ethers = require('ethers');

console.log('Ethers版本:', ethers.version);
console.log('BrowserProvider是否存在:', typeof ethers.BrowserProvider);

// 模拟window.ethereum对象
const mockEthereum = {
  request: async (args) => {
    if (args.method === 'eth_requestAccounts') {
      return ['0x742d35Cc6634C0532925a3b80152609BCd365714'];
    }
    return [];
  },
  on: () => {},
  removeListener: () => {}
};

// 测试BrowserProvider
async function testBrowserProvider() {
  try {
    const provider = new ethers.BrowserProvider(mockEthereum);
    console.log('BrowserProvider创建成功');
    
    const signer = await provider.getSigner();
    console.log('Signer获取成功');
    
    console.log('测试通过！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testBrowserProvider();
