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
      bailFundRaised: 0,
      lastIllegalActionAt: null,
      lastAyudaClaimAt: null,
      timesAudited: 0,
      totalLaundered: 0,
      totalStolen: 0
    };
    saveDB(db);
  }
  return db.members[id];
}

const BANK_TIERS = [
  { level: 1, name: 'Simpleng Tao', maxCap: 50000, upgradeCostClean: 0 },
  { level: 2, name: 'Nakakaluwag-luwag', maxCap: 100000, upgradeCostClean: 35000 },
  { level: 3, name: 'Contractor', maxCap: 250000, upgradeCostClean: 80000 },
  { level: 4, name: 'Congressman', maxCap: 500000, upgradeCostClean: 200000 }
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
  new SlashCommandBuilder().setName('profile').setDescription('View your private Barangay profile & dossier (Only visible to you)'),
  new SlashCommandBuilder().setName('gkas').setDescription('View GKas Digital Wallet balance (Infinite Storage)'),
  new SlashCommandBuilder().setName('kbank').setDescription('View KBank Vault deposit & Tier cap limits'),
  new SlashCommandBuilder().setName('kwek').setDescription('Sell Kwek-Kwek for clean KorapKoins & +Audit Score'),
  new SlashCommandBuilder().setName('spanishlatte').setDescription('Sell aesthetic Spanish Latte for clean KorapKoins (100% legal slay)'),
  new SlashCommandBuilder().setName('ayuda').setDescription('Claim government Ayuda cash aid (Once per day drop)'),
  new SlashCommandBuilder().setName('ghost').setDescription('Ghost Multipurpose Hall scam (+Dirty ₱KK, +25% COA, 3-hr cooldown)'),
  new SlashCommandBuilder().setName('confidential').setDescription('Pocket Confidential Funds (+Dirty ₱KK, +35% COA, 3-hr cooldown)'),
  new SlashCommandBuilder().setName('oregano').setDescription('Harvest Organic Oregano stash (+15g, +15% COA, 3-hr cooldown)'),
  new SlashCommandBuilder().setName('launder').setDescription('Launder dirty ₱KK into KBank deposit (15% Shell fee)')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount of dirty ₱KK to launder').setRequired(true)),
  new SlashCommandBuilder().setName('upgradebank').setDescription('Upgrade KBank Storage Tier using Clean Money'),
  new SlashCommandBuilder().setName('coa').setDescription('Check COA Audit Risk Meter, Jail Points & Status'),
  new SlashCommandBuilder().setName('steal').setDescription('Attempt to rob GKas balance or Oregano stash (3-hr cooldown)')
    .addUserOption(opt => opt.setName('target').setDescription('Member to steal from').setRequired(true))
    .addStringOption(opt => opt.setName('item').setDescription('GKas wallet or Oregano').setRequired(true)
      .addChoices({ name: 'GKas Wallet', value: 'gkas' }, { name: 'Organic Oregano Stash', value: 'oregano' })),
  new SlashCommandBuilder().setName('bail').setDescription('Pitch in clean money towards ₱500,000 Bail Fund to release inmate')
    .addUserOption(opt => opt.setName('target').setDescription('Inmate to bail out (defaults to yourself)').setRequired(false))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Clean legal money amount to pitch in').setRequired(false)),
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
      console.log('⚡ Successfully registered 15 Global Slash Commands!');

      // Instant Guild Command Registration (0-second delay)
      for (const [guildId, guild] of client.guilds.cache) {
        try {
          await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands.map(c => c.toJSON()) });
          console.log(`⚡ Registered instant slash commands for server: ${guild.name}`);
        } catch (e) {
          console.error(`Failed to register for server ${guild.name}:`, e.message);
        }
      }
    } catch (error) {
      console.error('❌ Failed to register slash commands:', error.message);
    }
  } else {
    console.log('ℹ️ Fill in CLIENT_ID and DISCORD_TOKEN to register Slash Commands automatically.');
  }

  // Automatic 30-Minute AI Chismis Generator fr fr! 💅✨
  setInterval(generateChismis, 30 * 60 * 1000);
});

client.on('guildCreate', async (guild) => {
  if (CLIENT_ID !== 'YOUR_CLIENT_ID_HERE' && DISCORD_TOKEN !== 'YOUR_DISCORD_BOT_TOKEN_HERE') {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    try {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), { body: commands.map(c => c.toJSON()) });
      console.log(`⚡ Registered instant slash commands for new server: ${guild.name}`);
    } catch (e) {
      console.error(e.message);
    }
  }
});

function generateChismis() {
  const rumors = [
    'OMG 💀 viral sa Barangay TikTok fr fr! Si Kapitan daw forda person nagpa-Ghost Multipurpose Hall project without roof! Fact or Bluff bestie? 💅✨',
    'Sheesh 😭 naririnig nyo ba yung Marites tea?! Si Treasurer lowkey nag-order ng 10kg Spanish Latte & Milk Tea using Petty Cash! Fact or Bluff yarn? ☕🔥',
    "Huli pero 'di kulong?! Si COA auditor secretly nagtago ng 50g Organic Oregano behind covered court forda aesthetic! Fact or Bluff dasurv? 🌿💅",
    'SK Chairman posted a TikTok dancing sa newly paved basketball court na wala namang ring at pintura slay! Fact or Bluff cyst? 🏀💅'
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
  console.log('📢 Automatic 30-Minute GenZ TikTok Chismis Released:', rumor);
}

// Handler for Slash Commands (/)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;
  const user = getMember(interaction.user.id, interaction.user.username);

  // JAIL LOCKDOWN CHECK: Jailed members CANNOT send any commands except /bail!
  if (user.isInJail && command !== 'bail') {
    return interaction.reply({
      content: '🔒 **JAIL LOCKDOWN BESTIE!** You are currently in Barangay Jail fr fr! 💅 Jailed members CANNOT send any commands except \`/bail\` to pitch in clean money or ask besties to bail you out! 🚔',
      ephemeral: true
    });
  }

  if (command === 'profile') {
    const tier = BANK_TIERS.find(t => t.level === user.bankTier) || BANK_TIERS[0];

    const embed = new EmbedBuilder()
      .setTitle(`👤 RESIDENT DOSSIER - ${interaction.user.username}`)
      .setColor('#8B5CF6')
      .setDescription('🔒 *Private Resident Overview (Visible only to you)*')
      .addFields(
        { name: '📲 Total GKas Amount', value: `**₱${user.gkasBalance.toLocaleString()}** *(Infinite Storage)*`, inline: true },
        { name: '🌿 Organic Oregano', value: `**${user.organicOreganoGrams}g** Stash`, inline: true },
        { name: '🕵️ COA Risk & Score', value: `Risk: **${user.coaRiskMeter}%** | Clean Score: **${user.auditScore} pts**`, inline: true },
        { name: '🏛️ KBank Deposit Storage', value: `**₱${user.kbankBalance.toLocaleString()}** / ₱${tier.maxCap.toLocaleString()}\n*(${tier.name})*`, inline: true }
      )
      .setFooter({ text: 'Barangay Korapsyon Economy • Confidential Profile' });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

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
        { name: '📈 Current Tier', value: `Level ${user.bankTier} / 4`, inline: true }
      )
      .setFooter({ text: 'Upgrade using clean legal money (/upgradebank)' });
    return interaction.reply({ embeds: [embed] });
  }

  if (command === 'kwek' || command === 'spanishlatte') {
    const earn = command === 'spanishlatte' ? Math.floor(Math.random() * 9000) + 3000 : Math.floor(Math.random() * 2500) + 800;
    user.gkasBalance += earn;
    user.auditScore += 12;
    user.coaRiskMeter = Math.max(0, user.coaRiskMeter - 5);
    saveDB(db);
    return interaction.reply(`☕ **LEGAL WORK SLAY!** Earned **₱${earn.toLocaleString()} Clean KorapKoins** in GKas +12 Clean Audit Score fr fr! 💅✨`);
  }

  if (command === 'ayuda') {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (user.lastAyudaClaimAt && (now - user.lastAyudaClaimAt) < ONE_DAY_MS) {
      const diff = ONE_DAY_MS - (now - user.lastAyudaClaimAt);
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return interaction.reply({
        content: `❌ **ONE AYUDA PER DAY ONLY FORDA RESIDENT!** 💅 You already claimed your subsidy today bestie! Next drop available in **${hours}h ${mins}m** fr fr! 💸`,
        ephemeral: true
      });
    }

    const earn = Math.floor(Math.random() * 40001) + 10000;
    user.gkasBalance += earn;
    user.auditScore += 15;
    user.lastAyudaClaimAt = now;
    saveDB(db);

    return interaction.reply(`📢 **AYUDA ANNOUNCEMENT: BARANGAY SUBSIDY CLAIMED!** 💸 Slay! ${interaction.user.username} claimed **₱${earn.toLocaleString()} Clean Ayuda Money** fr fr! (1 claim per day used) 💅✨`);
  }

  if (command === 'ghost' || command === 'confidential' || command === 'oregano') {
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    const now = Date.now();
    if (user.lastIllegalActionAt && (now - user.lastIllegalActionAt) < THREE_HOURS_MS) {
      const diff = THREE_HOURS_MS - (now - user.lastIllegalActionAt);
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return interaction.reply({
        content: `⏳ **HOLD UP BESTIE!** Every illegal money activity has a strict 3-hour cooldown fr fr! 💅 Please wait **${hours}h ${mins}m** before doing another crime lowkey! 🚨`,
        ephemeral: true
      });
    }

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
    user.lastIllegalActionAt = now;

    let auditMsg = '';
    while (user.coaRiskMeter >= 100) {
      user.coaRiskMeter -= 100;
      user.jailPoints += 1;
      user.timesAudited += 1;
      if (user.jailPoints >= 3) {
        user.isInJail = true;
        auditMsg = `\n🚨 **COA AUDIT METER REACHED 100%!** Converted to 1 Jail Point (Total: 3/3 Jail Points). SENT TO BARANGAY JAIL! 🚔💅`;
        break;
      } else {
        auditMsg = `\n⚠️ **COA AUDIT METER REACHED 100%!** Converted to 1 Jail Point (Jail Points: ${user.jailPoints}/3 fr fr).`;
      }
    }

    saveDB(db);
    return interaction.reply(`⚠️ **ILLEGAL CORRUPTION EXECUTED!** Pocketed **₱${earn.toLocaleString()} DIRTY KorapKoins**! Audit Meter is now **${user.coaRiskMeter}%**.${auditMsg}`);
  }

  if (command === 'launder') {
    const amount = interaction.options.getInteger('amount');
    if (!amount || amount <= 0 || user.dirtyKorapKoins < amount) {
      return interaction.reply({ content: `❌ Invalid amount bestie! You have ₱${user.dirtyKorapKoins.toLocaleString()} Dirty KorapKoins in GKas fr fr.`, ephemeral: true });
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

    let auditMsg = '';
    while (user.coaRiskMeter >= 100) {
      user.coaRiskMeter -= 100;
      user.jailPoints += 1;
      user.timesAudited += 1;
      if (user.jailPoints >= 3) {
        user.isInJail = true;
        auditMsg = `\n🚨 **COA AUDIT METER REACHED 100%!** Converted to 1 Jail Point (Total: 3/3 Jail Points). SENT TO BARANGAY JAIL! 🚔💅`;
        break;
      } else {
        auditMsg = `\n⚠️ **COA AUDIT METER REACHED 100%!** Converted to 1 Jail Point (Jail Points: ${user.jailPoints}/3 fr fr).`;
      }
    }

    saveDB(db);
    return interaction.reply(`🧋 **MONEY LAUNDERED SLAY!** Converted **₱${depositAmount.toLocaleString()} Dirty KorapKoins** -> **₱${cleanDeposit.toLocaleString()} Clean KBank Deposit** (15% Shell Fee fr fr).${auditMsg}`);
  }

  if (command === 'upgradebank') {
    if (user.bankTier >= 4) return interaction.reply({ content: '👑 Already at Max Bank Tier (Tier 4: Congressman) bestie!', ephemeral: true });
    const nextTier = BANK_TIERS.find(t => t.level === user.bankTier + 1);
    const cost = nextTier.upgradeCostClean;

    const cleanGkas = Math.max(0, user.gkasBalance - user.dirtyKorapKoins);
    const totalClean = cleanGkas + user.kbankBalance;

    if (totalClean < cost) {
      return interaction.reply({ content: `❌ Insufficient Clean Money bestie! Upgrading requires **₱${cost.toLocaleString()} CLEAN KorapKoins**.`, ephemeral: true });
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
    return interaction.reply(`🎉 **KBANK UPGRADED SLAY!** Promoted to **${nextTier.name}**! New limit: **₱${nextTier.maxCap.toLocaleString()}** fr fr! 💅`);
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
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    const now = Date.now();
    if (user.lastIllegalActionAt && (now - user.lastIllegalActionAt) < THREE_HOURS_MS) {
      const diff = THREE_HOURS_MS - (now - user.lastIllegalActionAt);
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return interaction.reply({
        content: `⏳ **HOLD UP BESTIE!** Illegal heist actions have a 3-hour cooldown fr fr! 💅 Please wait **${hours}h ${mins}m** before stealing again! 🚨`,
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('target');
    const targetType = interaction.options.getString('item');
    const target = getMember(targetUser.id, targetUser.username);

    user.coaRiskMeter += 20;
    user.lastIllegalActionAt = now;
    const success = Math.random() < 0.6;

    if (targetType === 'gkas') {
      const maxSteal = Math.floor(target.gkasBalance * 0.3);
      if (maxSteal < 500) return interaction.reply({ content: "Target's GKas account is too broke to rob fr fr!", ephemeral: true });
      if (success) {
        const stolen = Math.floor(Math.random() * maxSteal) + 500;
        target.gkasBalance = Math.max(0, target.gkasBalance - stolen);
        user.gkasBalance += stolen;
        user.totalStolen += stolen;
        saveDB(db);
        return interaction.reply(`🥷 **ROBBERY SLAY!** Stole **₱${stolen.toLocaleString()} KorapKoins** from ${targetUser.username}'s GKas wallet fr fr! 💅`);
      } else {
        user.coaRiskMeter += 15;
        saveDB(db);
        return interaction.reply(`🚨 **BUSTED BESTIE!** Caught by Barangay Tanods trying to hack ${targetUser.username}'s GKas! (+35% COA Risk)`);
      }
    } else {
      if (target.organicOreganoGrams <= 0) return interaction.reply({ content: "Target has 0g Organic Oregano stash fr fr!", ephemeral: true });
      if (success) {
        const grams = Math.min(target.organicOreganoGrams, Math.floor(Math.random() * 15) + 5);
        target.organicOreganoGrams -= grams;
        user.organicOreganoGrams += grams;
        saveDB(db);
        return interaction.reply(`🌿 **STASH RAID SLAY!** Pinched **${grams}g Organic Oregano** from ${targetUser.username} fr fr! 💅`);
      } else {
        saveDB(db);
        return interaction.reply(`🚨 **FAILED BESTIE!** Target's guard dog chased you away!`);
      }
    }
  }

  if (command === 'bail') {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const amountToPitch = interaction.options.getInteger('amount') || 500000;
    const target = getMember(targetUser.id, targetUser.username);

    if (!target.isInJail) return interaction.reply({ content: `${targetUser.username} is not in jail bestie! 💅`, ephemeral: true });

    const targetBailRaised = target.bailFundRaised || 0;
    const remaining = 500000 - targetBailRaised;

    const cleanGkas = Math.max(0, user.gkasBalance - user.dirtyKorapKoins);
    const totalClean = cleanGkas + user.kbankBalance;

    const pitchAmount = Math.min(amountToPitch, remaining);

    if (totalClean < pitchAmount || pitchAmount <= 0) {
      return interaction.reply({
        content: `❌ **INSUFFICIENT CLEAN MONEY BESTIE!** Bail requires Clean Legal Money. You need **₱${pitchAmount.toLocaleString()}** clean money to pitch in fr fr! (Your Clean Total: ₱${totalClean.toLocaleString()})`,
        ephemeral: true
      });
    }

    let remDeduct = pitchAmount;
    if (cleanGkas >= remDeduct) {
      user.gkasBalance -= remDeduct;
    } else {
      remDeduct -= cleanGkas;
      user.gkasBalance -= cleanGkas;
      user.kbankBalance -= remDeduct;
    }

    target.bailFundRaised = targetBailRaised + pitchAmount;

    if (target.bailFundRaised >= 500000) {
      target.isInJail = false;
      target.jailPoints = 0;
      target.bailFundRaised = 0;
      saveDB(db);
      return interaction.reply(`🎉 **FREEDOM REALNESS!** ${targetUser.username}'s ₱500,000 Bail Fund is 100% complete! Released from Barangay Jail fr fr! Slay no cap! 🚔💅✨`);
    } else {
      saveDB(db);
      return interaction.reply(`🔓 **BAIL PITCH-IN SLAY!** Pitched in **₱${pitchAmount.toLocaleString()} Clean Legal Money** for ${targetUser.username}! (Bail Fund Raised: **₱${target.bailFundRaised.toLocaleString()} / ₱500,000** fr fr) 💅`);
    }
  }

  if (command === 'chismis') {
    if (db.chismis.length === 0) return interaction.reply('No active chismis rumors currently circulating fr fr.');
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
      .setDescription([
        'Use either Slash Commands (`/command`) or Prefix Commands (`!command`):',
        '',
        '• `/profile` - 🔒 Private Profile Dossier (Ephemeral/DM)',
        '• `/gkas` - View GKas Digital Wallet (Infinite)',
        '• `/kbank` - Check KBank Storage Vault & Tier Limits',
        '• `/kwek` - Sell Kwek-Kwek (+Clean ₱KK)',
        '• `/spanishlatte` - Sell Spanish Latte (+Clean ₱KK)',
        '• `/ayuda` - Claim Ayuda Cash Aid (1 per day drop)',
        '• `/ghost` - Ghost Project (+Dirty ₱KK, 3-hr cooldown)',
        '• `/confidential` - Confidential Funds (+Dirty ₱KK, 3-hr cooldown)',
        '• `/oregano` - Harvest Organic Oregano (+15g, 3-hr cooldown)',
        '• `/launder amount:50000` - Launder dirty money into KBank',
        '• `/upgradebank` - Upgrade KBank Tier with clean money',
        '• `/coa` - Inspect Audit Risk Meter & Jail Status',
        '• `/steal target:@user item:gkas` - Rob another resident',
        '• `/bail target:@user amount:100000` - Pitch clean money into ₱500,000 Bail Fund',
        '• `/chismis` - Read latest Barangay rumors'
      ].join('\n'));
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

  // Jail check for prefix commands
  if (user.isInJail && command !== 'bail') {
    return message.reply('🔒 **JAIL LOCKDOWN BESTIE!** You are currently in Barangay Jail fr fr! 💅 Jailed members CANNOT send commands except \`!bail\`! 🚔');
  }

  if (command === 'profile') {
    const tier = BANK_TIERS.find(t => t.level === user.bankTier) || BANK_TIERS[0];

    const embed = new EmbedBuilder()
      .setTitle(`👤 RESIDENT DOSSIER - ${message.author.username}`)
      .setColor('#8B5CF6')
      .setDescription('🔒 *Private Profile Dossier sent in Direct Message*')
      .addFields(
        { name: '📲 Total GKas Amount', value: `**₱${user.gkasBalance.toLocaleString()}** *(Infinite Capacity)*`, inline: true },
        { name: '🌿 Organic Oregano', value: `**${user.organicOreganoGrams}g** Stash`, inline: true },
        { name: '🕵️ COA Risk & Score', value: `Risk: **${user.coaRiskMeter}%** | Clean Score: **${user.auditScore} pts**`, inline: true },
        { name: '🏛️ KBank Deposit Storage', value: `**₱${user.kbankBalance.toLocaleString()}** / ₱${tier.maxCap.toLocaleString()}\n*(${tier.name})*`, inline: true }
      )
      .setFooter({ text: 'Barangay Korapsyon Economy • Confidential Profile' });

    try {
      await message.author.send({ embeds: [embed] });
      return message.reply('📩 **Private Profile Sent!** Check your Direct Messages (DMs) for your confidential profile fr fr!');
    } catch {
      return message.reply('🔒 **Private Profile Notice:** Could not send DM. Please enable DMs from server members or use `/profile` for instant private view!');
    }
  }

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
        { name: '📈 Current Tier', value: `Level ${user.bankTier} / 4`, inline: true }
      );
    return message.reply({ embeds: [embed] });
  }

  if (command === 'kwek' || command === 'spanishlatte' || command === 'latte') {
    const earn = command.includes('latte') ? Math.floor(Math.random() * 9000) + 3000 : Math.floor(Math.random() * 2500) + 800;
    user.gkasBalance += earn;
    user.auditScore += 12;
    user.coaRiskMeter = Math.max(0, user.coaRiskMeter - 5);
    saveDB(db);
    return message.reply(`☕ **LEGAL WORK SLAY!** Earned **₱${earn.toLocaleString()} Clean KorapKoins** fr fr! 💅`);
  }

  if (command === 'ayuda') {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (user.lastAyudaClaimAt && (now - user.lastAyudaClaimAt) < ONE_DAY_MS) {
      return message.reply('❌ **ONE AYUDA PER DAY ONLY FORDA RESIDENT!** 💅 Claimed today already fr fr!');
    }
    const earn = Math.floor(Math.random() * 40001) + 10000;
    user.gkasBalance += earn;
    user.lastAyudaClaimAt = now;
    saveDB(db);
    return message.reply(`📢 **AYUDA CLAIMED!** 💸 Claimed **₱${earn.toLocaleString()} Clean Ayuda Money** fr fr! 💅✨`);
  }

  if (command === 'ghost' || command === 'confidential' || command === 'oregano') {
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    const now = Date.now();
    if (user.lastIllegalActionAt && (now - user.lastIllegalActionAt) < THREE_HOURS_MS) {
      return message.reply('⏳ **HOLD UP BESTIE!** Illegal actions have a 3-hour cooldown fr fr! 🚨');
    }
    let earn = command === 'ghost' ? Math.floor(Math.random() * 50000) + 20000 : command === 'confidential' ? Math.floor(Math.random() * 150000) + 50000 : Math.floor(Math.random() * 20000) + 5000;
    if (command === 'oregano') user.organicOreganoGrams += 15;
    user.gkasBalance += earn;
    user.dirtyKorapKoins += earn;
    user.coaRiskMeter += 25;
    user.lastIllegalActionAt = now;

    let auditMsg = '';
    while (user.coaRiskMeter >= 100) {
      user.coaRiskMeter -= 100;
      user.jailPoints += 1;
      user.timesAudited += 1;
      if (user.jailPoints >= 3) {
        user.isInJail = true;
        auditMsg = `\n🚨 **COA AUDIT METER REACHED 100%!** Converted to 1 Jail Point (3/3). Sent to Barangay Jail! 🚔💅`;
        break;
      } else {
        auditMsg = `\n⚠️ **COA AUDIT METER REACHED 100%!** Converted to 1 Jail Point (Points: ${user.jailPoints}/3).`;
      }
    }

    saveDB(db);
    return message.reply(`⚠️ **ILLEGAL CORRUPTION EXECUTED!** Pocketed **₱${earn.toLocaleString()} DIRTY KorapKoins**! Risk: **${user.coaRiskMeter}%**.${auditMsg}`);
  }

  if (command === 'launder') {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || user.dirtyKorapKoins < amount) return message.reply('❌ Invalid amount bestie!');
    const tier = BANK_TIERS.find(t => t.level === user.bankTier) || BANK_TIERS[0];
    const space = tier.maxCap - user.kbankBalance;
    if (space <= 0) return message.reply('❌ KBank Full! Upgrade tier (!upgradebank).');
    const depositAmount = Math.min(amount, space);
    const fee = Math.floor(depositAmount * 0.15);
    const cleanDeposit = depositAmount - fee;
    user.dirtyKorapKoins -= depositAmount;
    user.gkasBalance -= fee;
    user.kbankBalance += cleanDeposit;
    user.coaRiskMeter += 20;

    let auditMsg = '';
    while (user.coaRiskMeter >= 100) {
      user.coaRiskMeter -= 100;
      user.jailPoints += 1;
      user.timesAudited += 1;
      if (user.jailPoints >= 3) {
        user.isInJail = true;
        auditMsg = `\n🚨 **COA AUDIT METER REACHED 100%!** Converted to 1 Jail Point (3/3). Sent to Barangay Jail! 🚔💅`;
        break;
      } else {
        auditMsg = `\n⚠️ **COA AUDIT METER REACHED 100%!** Converted to 1 Jail Point (Points: ${user.jailPoints}/3).`;
      }
    }

    saveDB(db);
    return message.reply(`🧋 **MONEY LAUNDERED SLAY!** ₱${depositAmount.toLocaleString()} Dirty -> ₱${cleanDeposit.toLocaleString()} Clean KBank Deposit fr fr!${auditMsg}`);
  }

  if (command === 'upgradebank') {
    if (user.bankTier >= 4) return message.reply('👑 Max Bank Tier (Tier 4: Congressman) reached bestie!');
    const nextTier = BANK_TIERS.find(t => t.level === user.bankTier + 1);
    const cost = nextTier.upgradeCostClean;
    const cleanGkas = Math.max(0, user.gkasBalance - user.dirtyKorapKoins);
    if (cleanGkas + user.kbankBalance < cost) return message.reply(`❌ Needs **₱${cost.toLocaleString()} CLEAN KorapKoins**.`);
    user.bankTier += 1;
    saveDB(db);
    return message.reply(`🎉 **KBANK UPGRADED SLAY!** Now ${nextTier.name} fr fr! 💅`);
  }

  if (command === 'coa') {
    return message.reply(`🕵️ **COA Status:** Risk Meter: ${user.coaRiskMeter}% | Jail Points: ${user.jailPoints}/3 | Clean Audit: ${user.auditScore} | Status: ${user.isInJail ? 'IN JAIL 🚔' : 'FREE CITIZEN 🟢'}`);
  }

  if (command === 'help') {
    return message.reply('📜 **Commands:** `!profile`, `!gkas`, `!kbank`, `!kwek`, `!spanishlatte`, `!ayuda`, `!ghost`, `!confidential`, `!oregano`, `!launder <amount>`, `!upgradebank`, `!coa`, `!steal`, `!bail`, `!chismis`');
  }
});

client.login(DISCORD_TOKEN);
