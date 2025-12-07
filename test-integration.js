// 完整的集成测试脚本
const { expect } = require("chai");

describe("SimpleDEX 完整集成测试", function () {
  let token1, token2, token3, dex;
  let owner, user;
  let token1Address, token2Address, token3Address, dexAddress;
  const decimals = 18;

  beforeEach(async function () {
    // 部署合约
    console.log("部署合约...");
    
    const [ownerSigner, userSigner] = await hre.ethers.getSigners();
    owner = ownerSigner;
    user = userSigner;

    // 部署测试代币
    const TestToken = await hre.ethers.getContractFactory("TestToken");
    token1 = await TestToken.deploy("ETH Token", "ETH", hre.ethers.parseUnits('1000000', decimals));
    token2 = await TestToken.deploy("USDT Token", "USDT", hre.ethers.parseUnits('100000000', decimals));
    token3 = await TestToken.deploy("DAI Token", "DAI", hre.ethers.parseUnits('100000000', decimals));

    await token1.waitForDeployment();
    await token2.waitForDeployment();
    await token3.waitForDeployment();

    // 获取代币地址
    token1Address = await token1.getAddress();
    token2Address = await token2.getAddress();
    token3Address = await token3.getAddress();

    // 部署DEX合约
    const SimpleDEX = await hre.ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy();
    await dex.waitForDeployment();
    dexAddress = await dex.getAddress();

    console.log(`ETH Token (ETH): ${token1Address}`);
    console.log(`USDT Token (USDT): ${token2Address}`);
    console.log(`DAI Token (DAI): ${token3Address}`);
    console.log(`SimpleDEX: ${dexAddress}`);
  });

  describe("流动性池初始化", function () {
    it("应该成功创建并初始化流动性池", async function () {
      // 创建流动性池
      await dex.createPool(token1, token2);
      await dex.createPool(token1, token3);
      await dex.createPool(token2, token3);

      console.log("✓ 创建了所有流动性池");

      // 添加流动性
      const liquidityEth = hre.ethers.parseUnits('1000', decimals);
      const liquidityUsdt = hre.ethers.parseUnits('200000', decimals);
      const liquidityDai = hre.ethers.parseUnits('200000', decimals);

      // ETH-USDT池
      await token1.mint(owner.address, liquidityEth);
      await token2.mint(owner.address, liquidityUsdt);
      await token1.approve(dexAddress, liquidityEth);
      await token2.approve(dexAddress, liquidityUsdt);
      await dex.addLiquidity(token1, token2, liquidityEth, liquidityUsdt);

      // ETH-DAI池
      await token1.mint(owner.address, liquidityEth);
      await token3.mint(owner.address, liquidityDai);
      await token1.approve(dexAddress, liquidityEth);
      await token3.approve(dexAddress, liquidityDai);
      await dex.addLiquidity(token1, token3, liquidityEth, liquidityDai);

      // USDT-DAI池
      await token2.mint(owner.address, liquidityUsdt);
      await token3.mint(owner.address, liquidityDai);
      await token2.approve(dexAddress, liquidityUsdt);
      await token3.approve(dexAddress, liquidityDai);
      await dex.addLiquidity(token2, token3, liquidityUsdt, liquidityDai);

      console.log("✓ 添加了所有流动性池的初始流动性");

      // 检查流动性是否正确添加
      const ethUsdtPool = await dex.getPool(token1Address, token2Address);
      const ethDaiPool = await dex.getPool(token1Address, token3Address);
      const usdtDaiPool = await dex.getPool(token2Address, token3Address);

      expect(ethUsdtPool.token1Balance).to.equal(liquidityEth);
      expect(ethUsdtPool.token2Balance).to.equal(liquidityUsdt);
      expect(ethDaiPool.token1Balance).to.equal(liquidityEth);
      expect(ethDaiPool.token2Balance).to.equal(liquidityDai);
      expect(usdtDaiPool.token1Balance).to.equal(liquidityUsdt);
      expect(usdtDaiPool.token2Balance).to.equal(liquidityDai);

      console.log("✓ 验证了所有流动性池的初始流动性");
    });
  });

  describe("代币交换功能", function () {
    beforeEach(async function () {
      // 初始化流动性池
      await dex.createPool(token1, token2);
      await dex.createPool(token1, token3);

      // 添加流动性
      const liquidityEth = hre.ethers.parseUnits('1000', decimals);
      const liquidityUsdt = hre.ethers.parseUnits('200000', decimals);
      const liquidityDai = hre.ethers.parseUnits('200000', decimals);

      // ETH-USDT池
      await token1.mint(owner.address, liquidityEth);
      await token2.mint(owner.address, liquidityUsdt);
      await token1.approve(dexAddress, liquidityEth);
      await token2.approve(dexAddress, liquidityUsdt);
      await dex.addLiquidity(token1, token2, liquidityEth, liquidityUsdt);

      // ETH-DAI池
      await token1.mint(owner.address, liquidityEth);
      await token3.mint(owner.address, liquidityDai);
      await token1.approve(dexAddress, liquidityEth);
      await token3.approve(dexAddress, liquidityDai);
      await dex.addLiquidity(token1, token3, liquidityEth, liquidityDai);

      // 给测试账户添加测试代币
      const testEth = hre.ethers.parseUnits('100', decimals);
      const testUsdt = hre.ethers.parseUnits('10000', decimals);
      const testDai = hre.ethers.parseUnits('10000', decimals);

      await token1.mint(user.address, testEth);
      await token2.mint(user.address, testUsdt);
      await token3.mint(user.address, testDai);
    });

    it("应该成功交换ETH到USDT", async function () {
      const amountIn = hre.ethers.parseUnits('10', decimals);
      const expectedAmountOut = hre.ethers.parseUnits('1960', decimals); // 预期大约1960 USDT (1:200)

      // 批准并交换
      await token1.connect(user).approve(dexAddress, amountIn);
      const tx = await dex.connect(user).swap(token1, token2, amountIn, expectedAmountOut);
      await tx.wait();

      // 检查余额变化
      const userEthBalance = await token1.balanceOf(user.address);
      const userUsdtBalance = await token2.balanceOf(user.address);

      console.log(`✓ 用户ETH余额: ${hre.ethers.formatUnits(userEthBalance, decimals)} ETH`);
      console.log(`✓ 用户USDT余额: ${hre.ethers.formatUnits(userUsdtBalance, decimals)} USDT`);

      // 验证余额减少和增加
      expect(userEthBalance).to.be.lessThan(hre.ethers.parseUnits('100', decimals));
      expect(userUsdtBalance).to.be.greaterThan(hre.ethers.parseUnits('10000', decimals));
    });

    it("应该成功交换USDT到ETH", async function () {
      const amountIn = hre.ethers.parseUnits('2000', decimals);
      const expectedAmountOut = hre.ethers.parseUnits('9.8', decimals); // 预期大约9.8 ETH (1:200)

      // 批准并交换
      await token2.connect(user).approve(dexAddress, amountIn);
      const tx = await dex.connect(user).swap(token2, token1, amountIn, expectedAmountOut);
      await tx.wait();

      // 检查余额变化
      const userUsdtBalance = await token2.balanceOf(user.address);
      const userEthBalance = await token1.balanceOf(user.address);

      console.log(`✓ 用户USDT余额: ${hre.ethers.formatUnits(userUsdtBalance, decimals)} USDT`);
      console.log(`✓ 用户ETH余额: ${hre.ethers.formatUnits(userEthBalance, decimals)} ETH`);

      // 验证余额减少和增加
      expect(userUsdtBalance).to.be.lessThan(hre.ethers.parseUnits('10000', decimals));
      expect(userEthBalance).to.be.greaterThan(hre.ethers.parseUnits('100', decimals));
    });
  });

  describe("价格获取功能", function () {
    beforeEach(async function () {
      // 初始化流动性池并添加流动性
      await dex.createPool(token1, token2);

      const liquidityEth = hre.ethers.parseUnits('1000', decimals);
      const liquidityUsdt = hre.ethers.parseUnits('200000', decimals);

      await token1.mint(owner.address, liquidityEth);
      await token2.mint(owner.address, liquidityUsdt);
      await token1.approve(dexAddress, liquidityEth);
      await token2.approve(dexAddress, liquidityUsdt);
      await dex.addLiquidity(token1, token2, liquidityEth, liquidityUsdt);
    });

    it("应该正确获取ETH-USDT价格", async function () {
      const price = await dex.getPrice(token1, token2);
      const formattedPrice = hre.ethers.formatUnits(price, decimals);
      
      console.log(`✓ 当前ETH-USDT价格: ${formattedPrice} USDT/ETH`);
      
      // 验证价格在合理范围内
      expect(parseFloat(formattedPrice)).to.be.within(190, 210); // 应该在190-210之间
    });

    it("应该正确获取USDT-ETH价格", async function () {
      const price = await dex.getPrice(token2, token1);
      const formattedPrice = hre.ethers.formatUnits(price, decimals);
      
      console.log(`✓ 当前USDT-ETH价格: ${formattedPrice} ETH/USDT`);
      
      // 验证价格在合理范围内
      expect(parseFloat(formattedPrice)).to.be.within(0.0045, 0.0055); // 应该在0.0045-0.0055之间
    });
  });
});
