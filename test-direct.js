// SPDX-License-Identifier: MIT

// 简单的直接测试脚本，不依赖外部地址
const hre = require('hardhat');

async function main() {
  console.log('部署合约并测试...');
  
  // 部署代币合约
  const TestToken = await hre.ethers.getContractFactory('TestToken');
  
  // 部署多种测试代币
  const token1 = await TestToken.deploy('ETH Token', 'ETH', 1000000);
  await token1.waitForDeployment();
  
  const token2 = await TestToken.deploy('USDT Token', 'USDT', 1000000);
  await token2.waitForDeployment();
  
  // 部署DEX合约
  const SimpleDEX = await hre.ethers.getContractFactory('SimpleDEX');
  const dex = await SimpleDEX.deploy();
  await dex.waitForDeployment();

  console.log('\n=== 合约部署信息 ===');
  console.log('ETH Token (ETH):', await token1.getAddress());
  console.log('USDT Token (USDT):', await token2.getAddress());
  console.log('SimpleDEX:', await dex.getAddress());

  // 初始化流动性池
  console.log('\n=== 初始化流动性池 ===');
  
  // 为ETH-USDT创建流动性池
  await dex.createPool(
    await token1.getAddress(),
    await token2.getAddress()
  );
  console.log('Created ETH-USDT pool');

  // 获取签名者
  const [owner, user] = await hre.ethers.getSigners();
  
  // 为每个池添加初始流动性（考虑18位小数）
  const decimals = 18;
  const liquidityEth = hre.ethers.parseUnits('1000', decimals);
  const liquidityUsdt = hre.ethers.parseUnits('200000', decimals);

  // 给DEX合约账户铸造代币
  await token1.mint(owner.address, liquidityEth);
  await token2.mint(owner.address, liquidityUsdt);
  
  // 批准DEX合约使用代币
  await token1.approve(await dex.getAddress(), liquidityEth);
  await token2.approve(await dex.getAddress(), liquidityUsdt);
  
  // 使用addLiquidity函数添加流动性
  await dex.addLiquidity(token1, token2, liquidityEth, liquidityUsdt);
  console.log('Added liquidity to ETH-USDT pool');

  // 给默认账户发送一些代币用于测试
  const testEth = hre.ethers.parseUnits('100', decimals);
  const testUsdt = hre.ethers.parseUnits('10000', decimals);

  await token1.mint(owner.address, testEth);
  await token2.mint(owner.address, testUsdt);

  console.log('\n=== 开始测试 ===');
  
  // 检查余额
  const ownerEthBalance = await token1.balanceOf(owner.address);
  const ownerUsdtBalance = await token2.balanceOf(owner.address);
  
  console.log('1. 初始余额:');
  console.log(`   所有者ETH余额: ${hre.ethers.formatUnits(ownerEthBalance, 18)} ETH`);
  console.log(`   所有者USDT余额: ${hre.ethers.formatUnits(ownerUsdtBalance, 18)} USDT`);
  
  // 测试兑换功能
  console.log('\n2. 测试代币兑换:');
  const swapAmount = hre.ethers.parseUnits('10', decimals);
  
  // 获取代币地址
  const token1Address = await token1.getAddress();
  const token2Address = await token2.getAddress();
  const dexAddress = await dex.getAddress();
  
  // 批准DEX使用代币
  await token1.approve(dexAddress, swapAmount);
  
  // 交换ETH到USDT
  console.log(`   交换 ${hre.ethers.formatUnits(swapAmount, 18)} ETH 到 USDT...`);
  const swapTx = await dex.swap(token1Address, token2Address, swapAmount);
  await swapTx.wait();
  
  // 检查交换后的余额
  const afterSwapEth = await token1.balanceOf(owner.address);
  const afterSwapUsdt = await token2.balanceOf(owner.address);
  
  console.log('   交换后余额:');
  console.log(`   ETH余额: ${hre.ethers.formatUnits(afterSwapEth, 18)} ETH`);
  console.log(`   USDT余额: ${hre.ethers.formatUnits(afterSwapUsdt, 18)} USDT`);
  
  // 获取当前价格
  const price = await dex.getPrice(token1Address, token2Address);
  console.log(`\n3. 当前ETH-USDT价格: ${hre.ethers.formatUnits(price, 18)} USDT/ETH`);
  
  console.log('\n🎉 测试完成！');
}

main().catch((error) => {
  console.error('测试失败:', error);
  process.exitCode = 1;
});
