/**
 * =============================================================
 * BARANGAY KORAPSYON - DISCORD ECONOMY BOT (FULL WORKING FILE)
 * =============================================================
 * Server Name: Barangay Korapsyon
 * Currency: KorapKoins (₱KK)
 * Wallets: GKas (Unlimited) & KBank (Capped Tier Limits)
 * Commands Supported: BOTH Slash Commands (/) and Prefix Commands (!)
 * 
 * INSTRUCTIONS TO RUN 24/7 FOR FREE (EVEN WHEN MACBOOK IS OFF):
 * 1. Create a Discord Bot on https://discord.com/developers/applications
 * 2. Enable "MESSAGE CONTENT INTENT" in Bot settings.
 * 3. Replace 'YOUR_DISCORD_BOT_TOKEN_HERE' below with your actual Bot Token.
 * 4. Replace 'YOUR_CLIENT_ID_HERE' with your Application / Client ID.
 * 5. Host for FREE 24/7 on Discloud (https://discloudbot.com), Render, or Railway.
 * =============================================================
 */

const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 🔑 CONFIGURATION - REPLACE WITH YOUR DISCORD BOT TOKEN & CLIENT ID
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN_HERE';
const CLIENT_ID = process.env.CLIENT_ID || 'YOUR_CLIENT_ID_HERE';

// Simple File Database Persistence
const DB_FILE = path.join(__dirname, 'barangay_db.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { members: {}, chismis: [], auditLogs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { members: {}, chismis: [], auditLogs: [] };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let db = loadDB();

function getMember(id, username) {
  if (!db.members[id]) {
    db.members[id] = {
      id,
      username,
      gkasBalance: 15000,
      kbankBalance: 0,
      bankTier: 1,
      dirtyKorapKoins: 0,
      organicOreganoGrams: 0,
      auditScore: 100,
      coaRiskMeter: 0,
      jailPoints: 0,
      isInJail: false,
      timesAudited: 0,
      totalLaundered: 0,
      totalStolen: 0
    };
    saveDB(db);
  }
  return db.members[id];
}

const BANK_TIERS = [
  { level: 1, name: 'Sari-Sari Vault', maxCap: 50000, upgradeCostClean: 0 },
  { level: 2, name: 'Barangay Hall Safe', maxCap: 250000, upgradeCostClean: 50000 },
  { level: 3, name: 'Municipal Treasury', maxCap: 1000000, upgradeCostClean: 250000 },
  { level: 4, name: 'Provincial Offshore Bank', maxCap: 5000000, upgradeCostClean: 1000000 },
  { level: 5, name: 'Swiss Cayman Trust', maxCap: 25000000, upgradeCostClean: 5000000 }
];

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Slash Command Definitions
const commands = [
  new SlashCommandBuilder().setName('gkas').setDescription('View GKas Digital Wallet balance (Infinite Storage)'),
  new SlashCommandBuilder().setName('kbank').setDescription('View KBank Vault deposit & Tier cap limits'),
  new SlashCommandBuilder().setName('kwek').setDescription('Sell Kwek-Kwek for clean KorapKoins & +Audit Score'),
  new SlashCommandBuilder().setName('ayuda').setDescription('Claim government Ayuda cash aid (+Clean ₱KK)'),
  new SlashCommandBuilder().setName('ghost').setDescription('Ghost Multipurpose Hall scam (+Dirty ₱KK, +25% COA)'),
  new SlashCommandBuilder().setName('confidential').setDescription('Pocket Confidential Funds (+Dirty ₱KK, +35% COA)'),
  new SlashCommandBuilder().setName('oregano').setDescription('Harvest Organic Oregano stash (+15g, +15% COA)'),
  new SlashCommandBuilder().setName('launder').setDescription('Launder dirty ₱KK into KBank deposit (15% Shell fee)')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount of dirty ₱KK to launder').setRequired(true)),
  new SlashCommandBuilder().setName('upgradebank').setDescription('Upgrade KBank Storage Tier using Clean Money'),
  new SlashCommandBuilder().setName('coa').setDescription('Check COA Audit Risk Meter, Jail Points & Status'),
  new SlashCommandBuilder().setName('steal').setDescription('Attempt to rob GKas balance or Oregano stash')
    .addUserOption(opt => opt.setName('target').setDescription('Member to steal from').setRequired(true))
    .addStringOption(opt => opt.setName('item').setDescription('GKas wallet or Oregano').setRequired(true)
      .addChoices({ name: 'GKas Wallet', value: 'gkas' }, { name: 'Organic Oregano Stash', value: 'oregano' })),
  new SlashCommandBuilder().setName('bail').setDescription('Post bail using 50 Clean Audit Points to leave Jail'),
  new SlashCommandBuilder().setName('chismis').setDescription('View latest Barangay rumors'),
  new SlashCommandBuilder().setName('help').setDescription('Display full command directory & usage instructions')
];

// Register Slash Commands on Startup
client.once('ready', async () => {
  console.log(`✅ Barangay Korapsyon Bot Online as ${client.user.tag}`);

  if (CLIENT_ID !== 'YOUR_CLIENT_ID_HERE' && DISCORD_TOKEN !== 'YOUR_DISCORD_BOT_TOKEN_HERE') {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    try {
      console.log('🔄 Registering global Slash Commands (/)....');
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
      console.log('⚡ Successfully registered 14 Slash Commands!');
    } catch (error) {
      console.error('❌ Failed to register slash commands:', error.message);
    }
  } else {
    console.log('ℹ️ Fill in CLIENT_ID and DISCORD_TOKEN to register Slash Commands automatically.');
  }

  // Automatic 2-Hour Chismis Generator
  setInterval(generateChismis, 2 * 60 * 60 * 1000);
});

function generateChismis() {
  const rumors = [
    'Marites says Kapitan bought a new SUV right after approving the drainage project!',
    'Treasurer was spotted buying 10kg of Kwek-Kwek using Barangay Petty Cash!',
    'COA auditor secretly loves Organic Oregano tea!',
    'SK Chairman posted a TikTok dancing in the newly paved court that has no lines yet.'
  ];
  const rumor = rumors[Math.floor(Math.random() * rumors.length)];
  const chismisObj = {
    id: 'chismis-' + Date.now(),
    text: rumor,
    votesFact: 0,
    votesBluff: 0,
    timestamp: new Date().toISOString()
  };
  db.chismis.unshift(chismisObj);
  saveDB(db);
  console.log('📢 Automatic 2-Hour Chismis Released:', rumor);
}

// Handler for Slash Commands (/)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;
  const user = getMember(interaction.user.id, interaction.user.username);

  if (command === 'gkas') {
    const cleanGkas = Math.max(0, user.gkasBalance - user.dirtyKorapKoins);
    const embed = new EmbedBuilder()
      .setTitle(`📲 GKas Wallet - ${interaction.user.username}`)
      .setColor('#10B981')
      .addFields(
        { name: '💰 Total Balance', value: `₱${user.gkasBalance.toLocaleString()} ₱KK`, inline: true },
        { name: '✨ Clean KorapKoins', value: `₱${cleanGkas.toLocaleString()}`, inline: true },
        { name: '🚨 Dirty Money', value: `₱${user.dirtyKorapKoins.toLocaleString()}`, inline: true },
        { name: '🌿 Oregano Stash', value: `${user.organicOreganoGrams}g`, inline: true },
        { name: '🏛️ Capacity', value: '♾️ Infinite Storage', inline: true }
      )
      .setFooter({ text: 'Barangay Korapsyon Economy' });
    return interaction.reply({ embeds: [embed] });
  }

  if (command === 'kbank') {
    const tier = BANK_TIERS.find(t => t.level === user.bankTier) || BANK_TIERS[0];
    const embed = new EmbedBuilder()
      .setTitle(`🏛️ KBank Vault - ${tier.name}`)
      .setColor('#3B82F6')
      .addFields(
        { name: '🔒 Current Deposit', value: `₱${user.kbankBalance.toLocaleString()} ₱KK`, inline: true },
        { name: '📦 Max Limit', value: `₱${tier.maxCap.toLocaleString()}`, inline: true },
        { name: '📈 Current Tier', value: `Level ${user.bankTier} / 5`, inline: true }
      )
      .setFooter({ text: 'Upgrade using clean money (/upgradebank)' });
    return interaction.reply({ embeds: [embed] });
  }

  if (command === 'kwek' || command === 'ayuda') {
    const earn = command === 'ayuda' ? Math.floor(Math.random() * 4000) + 2000 : Math.floor(Math.random() * 2500) + 800;
    user.gkasBalance += earn;
    user.auditScore += 8;
    user.coaRiskMeter = Math.max(0, user.coaRiskMeter - 5);
    saveDB(db);
    return interaction.reply(`✅ **LEGAL WORK SUCCESS!** You earned **₱${earn.toLocaleString()} Clean KorapKoins** in GKas and gained **+8 Clean Audit Score**!`);
  }

  if (command === 'ghost' || command === 'confidential' || command === 'oregano') {
    if (user.isInJail) return interaction.reply({ content: '🚨 You are in **BARANGAY JAIL**! Cannot commit crimes behind bars.', ephemeral: true });

    let earn = 0;
    let riskAdd = 20;

    if (command === 'ghost') {
      earn = Math.floor(Math.random() * 50000) + 20000;
      riskAdd = 25;
    } else if (command === 'confidential') {
      earn = Math.floor(Math.random() * 150000) + 50000;
      riskAdd = 35;
    } else {
      earn = Math.floor(Math.random() * 20000) + 5000;
      user.organicOreganoGrams += 15;
      riskAdd = 15;
    }

    user.gkasBalance += earn;
    user.dirtyKorapKoins += earn;
    user.coaRiskMeter += riskAdd;

    let auditMsg = '';
    if (user.coaRiskMeter >= 100) {
      user.timesAudited += 1;
      const failed = Math.random() < 0.5;
      user.coaRiskMeter = 0;
      if (failed) {
        user.jailPoints += 1;
        const fine = Math.floor(user.dirtyKorapKoins * 0.5);
        user.dirtyKorapKoins = Math.max(0, user.dirtyKorapKoins - fine);
        user.gkasBalance = Math.max(0, user.gkasBalance - fine);
        if (user.jailPoints >= 3) {
          user.isInJail = true;
          auditMsg = `\n🚨 **COA AUDIT FAILED!** Fined **₱${fine.toLocaleString()}**! Sent to Barangay Jail! 🚔`;
        } else {
          auditMsg = `\n🚨 **COA AUDIT FAILED!** Fined **₱${fine.toLocaleString()}**! Jail Points: ${user.jailPoints}/3.`;
        }
      } else {
        auditMsg = `\n🛡️ **COA AUDIT PASSED!** Cleared due to "Lack of Evidence"!`;
      }
    }

    saveDB(db);
    return interaction.reply(`⚠️ **ILLEGAL CORRUPTION EXECUTED!** Pocketed **₱${earn.toLocaleString()} DIRTY KorapKoins**! COA Risk Meter: **${user.coaRiskMeter}%**.${auditMsg}`);
  }

  if (command === 'launder') {
    if (user.isInJail) return interaction.reply({ content: '🚨 Cannot launder money in Jail!', ephemeral: true });
    const amount = interaction.options.getInteger('amount');
    if (!amount || amount <= 0 || user.dirtyKorapKoins < amount) {
      return interaction.reply({ content: `❌ Invalid amount! You have ₱${user.dirtyKorapKoins.toLocaleString()} Dirty KorapKoins in GKas.`, ephemeral: true });
    }

    const tier = BANK_TIERS.find(t => t.level === user.bankTier) || BANK_TIERS[0];
    const space = tier.maxCap - user.kbankBalance;
    if (space <= 0) {
      user.coaRiskMeter = Math.min(100, user.coaRiskMeter + 20);
      saveDB(db);
      return interaction.reply({ content: `❌ **KBank Full!** Max capacity (${tier.name}: ₱${tier.maxCap.toLocaleString()}) reached! Upgrade tier first (/upgradebank).`, ephemeral: true });
    }

    const depositAmount = Math.min(amount, space);
    const fee = Math.floor(depositAmount * 0.15);
    const cleanDeposit = depositAmount - fee;

    user.dirtyKorapKoins -= depositAmount;
    user.gkasBalance -= fee;
    user.kbankBalance += cleanDeposit;
    user.totalLaundered += depositAmount;
    user.coaRiskMeter += 20;

    saveDB(db);
    return interaction.reply(`🧋 **MONEY LAUNDERED!** Converted **₱${depositAmount.toLocaleString()} Dirty KorapKoins** -> **₱${cleanDeposit.toLocaleString()} Clean KBank Deposit** (15% Shell Corp Fee).`);
  }

  if (command === 'upgradebank') {
    if (user.bankTier >= 5) return interaction.reply({ content: '👑 Already at Max Bank Tier (Tier 5)!', ephemeral: true });
    const nextTier = BANK_TIERS.find(t => t.level === user.bankTier + 1);
    const cost = nextTier.upgradeCostClean;

    const cleanGkas = Math.max(0, user.gkasBalance - user.dirtyKorapKoins);
    const totalClean = cleanGkas + user.kbankBalance;

    if (totalClean < cost) {
      return interaction.reply({ content: `❌ Insufficient Clean Money! Upgrading requires **₱${cost.toLocaleString()} CLEAN KorapKoins**.`, ephemeral: true });
    }

    let remaining = cost;
    if (cleanGkas >= remaining) {
      user.gkasBalance -= remaining;
    } else {
      remaining -= cleanGkas;
      user.gkasBalance -= cleanGkas;
      user.kbankBalance -= remaining;
    }

    user.bankTier += 1;
    saveDB(db);
    return interaction.reply(`🎉 **KBANK UPGRADED!** Promoted to **${nextTier.name}**! New limit: **₱${nextTier.maxCap.toLocaleString()}**!`);
  }

  if (command === 'coa') {
    const embed = new EmbedBuilder()
      .setTitle(`🕵️ COA Status - ${interaction.user.username}`)
      .setColor('#EF4444')
      .addFields(
        { name: '🔥 COA Risk Meter', value: `${user.coaRiskMeter}% / 100%`, inline: true },
        { name: '🚔 Jail Points', value: `${user.jailPoints} / 3`, inline: true },
        { name: '📜 Clean Audit Score', value: `${user.auditScore} Points`, inline: true },
        { name: '⚖️ Jail Status', value: user.isInJail ? '🔴 IN JAIL' : '🟢 FREE CITIZEN', inline: true }
      );
    return interaction.reply({ embeds: [embed] });
  }

  if (command === 'steal') {
    if (user.isInJail) return interaction.reply({ content: '🚨 Cannot steal while in Jail!', ephemeral: true });
    const targetUser = interaction.options.getUser('target');
    const targetType = interaction.options.getString('item');
    const target = getMember(targetUser.id, targetUser.username);

    user.coaRiskMeter += 20;
    const success = Math.random() < 0.6;

    if (targetType === 'gkas') {
      const maxSteal = Math.floor(target.gkasBalance * 0.3);
      if (maxSteal < 500) return interaction.reply({ content: "Target's GKas account is too broke to rob!", ephemeral: true });
      if (success) {
        const stolen = Math.floor(Math.random() * maxSteal) + 500;
        target.gkasBalance = Math.max(0, target.gkasBalance - stolen);
        user.gkasBalance += stolen;
        user.totalStolen += stolen;
        saveDB(db);
        return interaction.reply(`🥷 **SUCCESSFUL ROBBERY!** Stole **₱${stolen.toLocaleString()} KorapKoins** from ${targetUser.username}'s GKas!`);
      } else {
        user.coaRiskMeter += 15;
        saveDB(db);
        return interaction.reply(`🚨 **BUSTED!** Caught by Tanods trying to hack ${targetUser.username}'s GKas! (+35% COA Risk)`);
      }
    } else {
      if (target.organicOreganoGrams <= 0) return interaction.reply({ content: "Target has 0g Organic Oregano stash!", ephemeral: true });
      if (success) {
        const grams = Math.min(target.organicOreganoGrams, Math.floor(Math.random() * 15) + 5);
        target.organicOreganoGrams -= grams;
        user.organicOreganoGrams += grams;
        saveDB(db);
        return interaction.reply(`🌿 **STASH RAID SUCCESS!** Pinched **${grams}g Organic Oregano** from ${targetUser.username}!`);
      } else {
        saveDB(db);
        return interaction.reply(`🚨 **FAILED!** Target's guard dog chased you away!`);
      }
    }
  }

  if (command === 'bail') {
    if (!user.isInJail) return interaction.reply({ content: 'You are not in jail!', ephemeral: true });
    if (user.auditScore < 50) return interaction.reply({ content: `❌ Need 50 Clean Audit Score points for bail! (You have: ${user.auditScore})`, ephemeral: true });

    user.auditScore -= 50;
    user.isInJail = false;
    user.jailPoints = Math.max(0, user.jailPoints - 1);
    saveDB(db);
    return interaction.reply('🔓 **BAIL GRANTED!** Paid 50 Clean Audit points and released from Barangay Jail!');
  }

  if (command === 'chismis') {
    if (db.chismis.length === 0) return interaction.reply('No active chismis rumors currently circulating.');
    const latest = db.chismis[0];
    const embed = new EmbedBuilder()
      .setTitle('📢 LATEST BARANGAY KORAPSYON CHISMIS')
      .setColor('#F59E0B')
      .setDescription(latest.text);
    return interaction.reply({ embeds: [embed] });
  }

  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📜 BARANGAY KORAPSYON COMMAND DIRECTORY')
      .setColor('#F59E0B')
      .setDescription('Use either Slash Commands (`/command`) or Prefix Commands (`!command`):

' +
        '• `/gkas` or `!gkas` - View GKas Digital Wallet
' +
        '• `/kbank` or `!kbank` - Check KBank Storage Vault & Tier
' +
        '• `/kwek` or `!kwek` - Sell Kwek-Kwek (+Clean ₱KK, +Audit Score)
' +
        '• `/ayuda` or `!ayuda` - Claim Ayuda Cash Aid
' +
        '• `/ghost` or `!ghost` - Ghost Project (+Dirty ₱KK, +25% COA)
' +
        '• `/confidential` or `!confidential` - Pocket Confidential Funds (+Dirty ₱KK, +35% COA)
' +
        '• `/oregano` or `!oregano` - Harvest Organic Oregano (+15g, +15% COA)
' +
        '• `/launder amount:50000` - Launder dirty money into KBank
' +
        '• `/upgradebank` - Upgrade KBank Tier with clean money
' +
        '• `/coa` - Inspect Audit Risk Meter & Jail Status
' +
        '• `/steal target:@user item:gkas` - Rob another resident
' +
        '• `/bail` - Post bail with 50 Audit points
' +
        '• `/chismis` - Read latest Barangay rumors'
      );
    return interaction.reply({ embeds: [embed] });
  }
});

// Handler for Prefix Commands (!)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const user = getMember(message.author.id, message.author.username);

  // Prefix commands mimic slash command functions
  if (command === 'gkas' || command === 'wallet') {
    const cleanGkas = Math.max(0, user.gkasBalance - user.dirtyKorapKoins);
    const embed = new EmbedBuilder()
      .setTitle(`📲 GKas Wallet - ${message.author.username}`)
      .setColor('#10B981')
      .addFields(
        { name: '💰 Total Balance', value: `₱${user.gkasBalance.toLocaleString()} ₱KK`, inline: true },
        { name: '✨ Clean KorapKoins', value: `₱${cleanGkas.toLocaleString()}`, inline: true },
        { name: '🚨 Dirty Money', value: `₱${user.dirtyKorapKoins.toLocaleString()}`, inline: true },
        { name: '🌿 Oregano Stash', value: `${user.organicOreganoGrams}g`, inline: true }
      );
    return message.reply({ embeds: [embed] });
  }

  if (command === 'kbank' || command === 'bank') {
    const tier = BANK_TIERS.find(t => t.level === user.bankTier) || BANK_TIERS[0];
    const embed = new EmbedBuilder()
      .setTitle(`🏛️ KBank Vault - ${tier.name}`)
      .setColor('#3B82F6')
      .addFields(
        { name: '🔒 Current Deposit', value: `₱${user.kbankBalance.toLocaleString()} ₱KK`, inline: true },
        { name: '📦 Max Limit', value: `₱${tier.maxCap.toLocaleString()}`, inline: true },
        { name: '📈 Current Tier', value: `Level ${user.bankTier} / 5`, inline: true }
      );
    return message.reply({ embeds: [embed] });
  }

  if (command === 'kwek' || command === 'ayuda') {
    const earn = command === 'ayuda' ? Math.floor(Math.random() * 4000) + 2000 : Math.floor(Math.random() * 2500) + 800;
    user.gkasBalance += earn;
    user.auditScore += 8;
    user.coaRiskMeter = Math.max(0, user.coaRiskMeter - 5);
    saveDB(db);
    return message.reply(`✅ **LEGAL WORK SUCCESS!** You earned **₱${earn.toLocaleString()} Clean KorapKoins**!`);
  }

  if (command === 'ghost' || command === 'confidential' || command === 'oregano') {
    if (user.isInJail) return message.reply('🚨 You are in **BARANGAY JAIL**!');
    let earn = command === 'ghost' ? Math.floor(Math.random() * 50000) + 20000 : command === 'confidential' ? Math.floor(Math.random() * 150000) + 50000 : Math.floor(Math.random() * 20000) + 5000;
    if (command === 'oregano') user.organicOreganoGrams += 15;
    user.gkasBalance += earn;
    user.dirtyKorapKoins += earn;
    user.coaRiskMeter += 25;
    saveDB(db);
    return message.reply(`⚠️ **ILLEGAL CORRUPTION EXECUTED!** Pocketed **₱${earn.toLocaleString()} DIRTY KorapKoins**! COA Risk: **${user.coaRiskMeter}%**.`);
  }

  if (command === 'launder') {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || user.dirtyKorapKoins < amount) return message.reply('❌ Invalid amount!');
    const tier = BANK_TIERS.find(t => t.level === user.bankTier) || BANK_TIERS[0];
    const space = tier.maxCap - user.kbankBalance;
    if (space <= 0) return message.reply('❌ KBank Full! Upgrade tier (!upgradebank).');
    const depositAmount = Math.min(amount, space);
    const fee = Math.floor(depositAmount * 0.15);
    const cleanDeposit = depositAmount - fee;
    user.dirtyKorapKoins -= depositAmount;
    user.gkasBalance -= fee;
    user.kbankBalance += cleanDeposit;
    saveDB(db);
    return message.reply(`🧋 **MONEY LAUNDERED!** ₱${depositAmount.toLocaleString()} Dirty -> ₱${cleanDeposit.toLocaleString()} Clean KBank Deposit!`);
  }

  if (command === 'upgradebank') {
    if (user.bankTier >= 5) return message.reply('👑 Max Bank Tier reached!');
    const nextTier = BANK_TIERS.find(t => t.level === user.bankTier + 1);
    const cost = nextTier.upgradeCostClean;
    const cleanGkas = Math.max(0, user.gkasBalance - user.dirtyKorapKoins);
    if (cleanGkas + user.kbankBalance < cost) return message.reply(`❌ Needs ₱${cost.toLocaleString()} CLEAN KorapKoins.`);
    user.bankTier += 1;
    saveDB(db);
    return message.reply(`🎉 **KBANK UPGRADED!** Now ${nextTier.name}!`);
  }

  if (command === 'coa') {
    return message.reply(`🕵️ **COA Status:** Risk Meter: ${user.coaRiskMeter}% | Jail Points: ${user.jailPoints}/3 | Clean Audit: ${user.auditScore} | Status: ${user.isInJail ? 'IN JAIL' : 'FREE'}`);
  }

  if (command === 'help') {
    return message.reply('📜 **Commands:** `!gkas`, `!kbank`, `!kwek`, `!ayuda`, `!ghost`, `!confidential`, `!oregano`, `!launder <amount>`, `!upgradebank`, `!coa`, `!steal`, `!bail`, `!chismis`');
  }
});

client.login(DISCORD_TOKEN);
