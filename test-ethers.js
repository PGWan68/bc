// 测试ethers库是否正确导入
const ethers = require('ethers');

console.log('Ethers版本:', ethers.version);
console.log('Web3Provider是否存在:', typeof ethers.Web3Provider);
console.log('providers命名空间是否存在:', typeof ethers.providers);
