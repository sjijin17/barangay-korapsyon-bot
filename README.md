# 🚀 How to Run "Barangay Korapsyon" Bot 24/7 For FREE

Follow these simple steps to run your Discord Bot 24/7 in the cloud **even when your Macbook / PC is turned off**!

---

## 🛠️ Prerequisite: Discord Bot Token Setup
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and name it **Barangay Korapsyon Bot**.
3. In the left menu, click **Bot** -> Enable **MESSAGE CONTENT INTENT**.
4. Click **Reset Token** and copy your **Bot Token**.
5. Go to **OAuth2 -> URL Generator**, check 'bot' and 'applications.commands', select Administrator or Send Messages permissions, and copy the URL to invite the bot to your Discord server.

---

## 🌐 Option 1: Render.com (Free GitHub Deployment)
*Best if you use GitHub and want automatic deployments whenever code updates.*

1. Push your 'index.js' and 'package.json' to a repository on **GitHub**.
2. Sign up at [Render.com](https://render.com).
3. Click **New +** -> **Web Service** (or **Background Worker**).
4. Connect your GitHub repository.
5. Set Build Command: 'npm install' and Start Command: 'node index.js'.
6. Under **Environment Variables**, add:
   - 'DISCORD_TOKEN' = your copied bot token
   - 'CLIENT_ID' = your bot client application ID
7. Click **Deploy**! Render will keep your bot running 24/7.

---

## 🚂 Option 2: Railway.app (Instant 1-Click Deploy)
*Best for fast setup with real-time logs.*

1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo** (or upload code).
3. Under **Variables**, add 'DISCORD_TOKEN' and 'CLIENT_ID'.
4. Railway automatically detects 'package.json' and launches 'node index.js'.

---

## ☁️ Option 3: Discloud (Zip Upload, No GitHub Needed)
*Best for quick zip file uploads directly from this web app.*

1. Go to [Discloud Host](https://discloudbot.com/) and log in with Discord.
2. Download 'index.js', 'package.json', and 'discloud.config' from this tab.
3. Zip all 3 files into a single 'bot.zip' archive.
4. Upload 'bot.zip' to Discloud and set your 'DISCORD_TOKEN' & 'CLIENT_ID'.
5. Click **Start App**!

---

## 🟩 Option 4: SquareCloud (Dedicated Discord Bot Host)
*Designed specifically for Discord bots.*

1. Create a free account on [SquareCloud.app](https://squarecloud.app).
2. Upload a zip containing 'index.js' and 'package.json'.
3. Set your Environment Variables ('DISCORD_TOKEN' & 'CLIENT_ID').

---

## 🐧 Option 5: Oracle Cloud Always Free VPS (Linux VM)
*100% Free Forever with full Linux terminal access.*

1. Create a free account at [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Create a free Ubuntu VM instance.
3. SSH into your VM and install Node.js & PM2:
   ```bash
   sudo apt update && sudo apt install nodejs npm -y
   sudo npm install -g pm2
   ```
4. Upload your 'index.js' and 'package.json'.
5. Run using PM2 (runs forever in background):
   ```bash
   pm2 start index.js --name "barangay-korapsyon-bot"
   pm2 save
   pm2 startup
   ```
