import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 不再模拟window.ethereum对象，让应用直接连接到Hardhat本地网络
// 用户需要确保在浏览器中安装了MetaMask等钱包扩展，并连接到本地网络

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)