const hre = require('hardhat');

async function main() {
  // 部署代币合约
  const TestToken = await hre.ethers.getContractFactory('TestToken');
  
  // 部署多种测试代币
  const token1 = await TestToken.deploy('ETH Token', 'ETH', 1000000);
  await token1.waitForDeployment();
  
  const token2 = await TestToken.deploy('USDT Token', 'USDT', 1000000);
  await token2.waitForDeployment();
  
  const token3 = await TestToken.deploy('DAI Token', 'DAI', 1000000);
  await token3.waitForDeployment();

  // 部署DEX合约
  const SimpleDEX = await hre.ethers.getContractFactory('SimpleDEX');
  const dex = await SimpleDEX.deploy();
  await dex.waitForDeployment();

  console.log('\n=== 合约部署信息 ===');
  console.log('ETH Token (ETH):', await token1.getAddress());
  console.log('USDT Token (USDT):', await token2.getAddress());
  console.log('DAI Token (DAI):', await token3.getAddress());
  console.log('SimpleDEX:', await dex.getAddress());

  // 初始化流动性池
  console.log('\n=== 初始化流动性池 ===');
  
  // 为ETH-USDT创建流动性池
  await dex.createPool(
    await token1.getAddress(),
    await token2.getAddress()
  );
  console.log('Created ETH-USDT pool');
  
  // 为ETH-DAI创建流动性池
  await dex.createPool(
    await token1.getAddress(),
    await token3.getAddress()
  );
  console.log('Created ETH-DAI pool');

  // 为USDT-DAI创建流动性池
  await dex.createPool(
    await token2.getAddress(),
    await token3.getAddress()
  );
  console.log('Created USDT-DAI pool');

  // 获取签名者
  const [owner] = await hre.ethers.getSigners();
  
  // 为每个池添加初始流动性（考虑18位小数）
  const decimals = 18;
  const liquidityEth = hre.ethers.parseUnits('1000', decimals);
  const liquidityUsdt = hre.ethers.parseUnits('200000', decimals);
  const liquidityDai = hre.ethers.parseUnits('200000', decimals);

  // ETH-USDT池
  await token1.mint(owner.address, liquidityEth);
  await token2.mint(owner.address, liquidityUsdt);
  await token1.approve(await dex.getAddress(), liquidityEth);
  await token2.approve(await dex.getAddress(), liquidityUsdt);
  await dex.addLiquidity(token1, token2, liquidityEth, liquidityUsdt);
  console.log('Added liquidity to ETH-USDT pool');

  // ETH-DAI池
  await token1.mint(owner.address, liquidityEth);
  await token3.mint(owner.address, liquidityDai);
  await token1.approve(await dex.getAddress(), liquidityEth);
  await token3.approve(await dex.getAddress(), liquidityDai);
  await dex.addLiquidity(token1, token3, liquidityEth, liquidityDai);
  console.log('Added liquidity to ETH-DAI pool');

  // USDT-DAI池
  await token2.mint(owner.address, liquidityUsdt);
  await token3.mint(owner.address, liquidityDai);
  await token2.approve(await dex.getAddress(), liquidityUsdt);
  await token3.approve(await dex.getAddress(), liquidityDai);
  await dex.addLiquidity(token2, token3, liquidityUsdt, liquidityDai);
  console.log('Added liquidity to USDT-DAI pool');

  // 给默认账户发送一些代币用于测试
  const accounts = await hre.ethers.getSigners();
  const testEth = hre.ethers.parseUnits('100', decimals);
  const testUsdt = hre.ethers.parseUnits('10000', decimals);
  const testDai = hre.ethers.parseUnits('10000', decimals);

  await token1.mint(accounts[0].address, testEth);
  await token2.mint(accounts[0].address, testUsdt);
  await token3.mint(accounts[0].address, testDai);

  console.log('\n=== 部署完成 ===');
  console.log('使用以下命令启动前端:');
  console.log('npm run dev');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
