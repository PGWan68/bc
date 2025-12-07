// SPDX-License-Identifier: MIT

// 使用Hardhat Runtime Environment编写的DEX测试脚本
async function main() {
  const hre = require('hardhat');
  
  // 获取部署的合约地址
  const contractAddresses = {
    ethToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    usdtToken: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    daiToken: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    dexContract: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
  };
  
  // 获取签名者
  const [owner, user] = await hre.ethers.getSigners();
  console.log(`测试账户: ${owner.address}`);
  console.log(`用户账户: ${user.address}`);
  
  // 获取合约实例
  const TestToken = await hre.ethers.getContractFactory('TestToken');
  const SimpleDEX = await hre.ethers.getContractFactory('SimpleDEX');
  
  console.log('\n连接到合约:');
  console.log(`   ETH Token地址: ${contractAddresses.ethToken}`);
  console.log(`   USDT Token地址: ${contractAddresses.usdtToken}`);
  console.log(`   DAI Token地址: ${contractAddresses.daiToken}`);
  console.log(`   DEX地址: ${contractAddresses.dexContract}`);
  
  const ethToken = await TestToken.attach(contractAddresses.ethToken);
  const usdtToken = await TestToken.attach(contractAddresses.usdtToken);
  const daiToken = await TestToken.attach(contractAddresses.daiToken);
  const dex = await SimpleDEX.attach(contractAddresses.dexContract);
  
  console.log('\n1. 检查初始代币余额:');
  try {
    // 首先检查合约是否存在
    const ethCode = await hre.ethers.provider.getCode(contractAddresses.ethToken);
    console.log(`   ETH合约代码存在: ${ethCode.length > 2}`);
    
    const ownerEthBalance = await ethToken.balanceOf(owner.address);
    console.log(`   所有者ETH余额: ${hre.ethers.formatUnits(ownerEthBalance, 18)} ETH`);
    
    const ownerUsdtBalance = await usdtToken.balanceOf(owner.address);
    console.log(`   所有者USDT余额: ${hre.ethers.formatUnits(ownerUsdtBalance, 18)} USDT`);
    
    const ownerDaiBalance = await daiToken.balanceOf(owner.address);
    console.log(`   所有者DAI余额: ${hre.ethers.formatUnits(ownerDaiBalance, 18)} DAI`);
  } catch (error) {
    console.error('   获取余额失败:', error);
    console.log('   尝试直接调用合约...');
    // 尝试直接调用合约的name方法
    const ethName = await ethToken.name();
    console.log(`   ETH代币名称: ${ethName}`);
  }
  
  // 给用户账户转账
  console.log('\n2. 给用户账户转账测试代币:');
  const transferAmount = hre.ethers.parseUnits('100', 18);
  
  await ethToken.transfer(user.address, transferAmount);
  await usdtToken.transfer(user.address, transferAmount);
  await daiToken.transfer(user.address, transferAmount);
  
  const userEthBalance = await ethToken.balanceOf(user.address);
  const userUsdtBalance = await usdtToken.balanceOf(user.address);
  const userDaiBalance = await daiToken.balanceOf(user.address);
  
  console.log(`   用户ETH余额: ${hre.ethers.formatUnits(userEthBalance, 18)} ETH`);
  console.log(`   用户USDT余额: ${hre.ethers.formatUnits(userUsdtBalance, 18)} USDT`);
  console.log(`   用户DAI余额: ${hre.ethers.formatUnits(userDaiBalance, 18)} DAI`);
  
  // 测试交易
  console.log('\n3. 测试代币兑换功能:');
  const swapAmount = hre.ethers.parseUnits('10', 18);
  
  // 用户批准DEX使用代币
  const userEth = ethToken.connect(user);
  const userUsdt = usdtToken.connect(user);
  const userDex = dex.connect(user);
  
  await userEth.approve(dex.address, swapAmount);
  
  // 交换ETH到USDT
  console.log(`   交换 ${hre.ethers.formatUnits(swapAmount, 18)} ETH 到 USDT...`);
  const swapTx = await userDex.swap(ethToken.address, usdtToken.address, swapAmount);
  await swapTx.wait();
  
  const afterSwapEth = await userEth.balanceOf(user.address);
  const afterSwapUsdt = await userUsdt.balanceOf(user.address);
  
  console.log(`   交换后ETH余额: ${hre.ethers.formatUnits(afterSwapEth, 18)} ETH`);
  console.log(`   交换后USDT余额: ${hre.ethers.formatUnits(afterSwapUsdt, 18)} USDT`);
  
  // 获取当前价格
  console.log('\n4. 获取当前交易对价格:');
  const ethUsdtPrice = await dex.getPrice(ethToken.address, usdtToken.address);
  console.log(`   ETH-USDT价格: ${hre.ethers.formatUnits(ethUsdtPrice, 18)} USDT/ETH`);
  
  const usdtDaiPrice = await dex.getPrice(usdtToken.address, daiToken.address);
  console.log(`   USDT-DAI价格: ${hre.ethers.formatUnits(usdtDaiPrice, 18)} DAI/USDT`);
  
  console.log('\n🎉 所有测试完成！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
