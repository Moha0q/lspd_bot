// ================= [ 🌐 سيرفر وهمي مصحح لمنع الـ Timeout في Render 🌐 ] =================
const http = require('http');
http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write("LSPD Bot is Online!"); 
    res.end(); 
}).listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log("🌐 Web server is running perfectly for Render port binding.");
});
// ===================================================================================

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js'); 
const fs = require('fs'); 
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

const PREFIX = '!';
const POINTS_FILE = './points.json';

// دالة جلب البيانات المحدثة لدعم النقاط والتحذيرات التراكمية
function getPointsData() {
    if (!fs.existsSync(POINTS_FILE)) fs.writeFileSync(POINTS_FILE, JSON.stringify({ points: {}, warnings: {} }));
    let data;
    try {
        data = JSON.parse(fs.readFileSync(POINTS_FILE, 'utf-8'));
    } catch (e) {
        data = {};
    }
    if (!data.points) data.points = {};
    if (!data.warnings) data.warnings = {};
    return data;
}

function savePointsData(data) {
    fs.writeFileSync(POINTS_FILE, JSON.stringify(data, null, 4));
}

// ================= [ 👮 إعدادات الرتب ورومات اللوق بالـ ID 👮 ] =================

// 🆕 ⚠️ حط هنا IDs رتب التحذيرات حقت سيرفرك:
const ROLE_WARN_1 = '1515781909060522114'; 
const ROLE_WARN_2 = '1515781910155231454'; 
const ROLE_WARN_3 = '1515781911535157349'; 

// 🆕 حط ID روم الترحيب هنا
const CHANNEL_WELCOME_LOG = '1518793447862042757'; 

const CHANNEL_APPLY_LOG = '1518794178966978682'; 

// 🖼️ روابط صور لوحات التحكم (قم بتغييرها لروابط صور تخص الـ LSPD)
const URL_APPLY_PANEL_IMAGE = 'https://media.discordapp.net/attachments/1515782065025449994/1518694046531457095/cc4917ae23da92ad815a259a26a974c8_1.png?ex=6a3ad98c&is=6a39880c&hm=b86b981c4ca28fafab01ebe7b36028ac98a48ab5611d418d6c2c32e0b7bb328d&=&format=webp&quality=lossless'; 
const URL_TICKET_IMAGE      = 'https://media.discordapp.net/attachments/1515782065025449994/1518694046531457095/cc4917ae23da92ad815a259a26a974c8_1.png?ex=6a3ad98c&is=6a39880c&hm=b86b981c4ca28fafab01ebe7b36028ac98a48ab5611d418d6c2c32e0b7bb328d&=&format=webp&quality=lossless'; 
const URL_ADMIN_PANEL_IMAGE = 'https://media.discordapp.net/attachments/1515782065025449994/1518694046531457095/cc4917ae23da92ad815a259a26a974c8_1.png?ex=6a3ad98c&is=6a39880c&hm=b86b981c4ca28fafab01ebe7b36028ac98a48ab5611d418d6c2c32e0b7bb328d&=&format=webp&quality=lossless'; 

// 📂 رومات اللوغات المنفصلة بالكامل:
const LOG_APPLY_DECISION = '1518795837017161798'; 
const LOG_PROMOTION = '1515782209150255255';  
const LOG_DEMOTE = '1518795310803976272';    
const LOG_WARN = '1515782216066797679';      
const LOG_FIRE = '1515782222412517590';          
const LOG_POINTS = '1515782206394732614';    

const ROLE_ACCEPT_1 = '1515781932217274509'; 
const ROLE_ACCEPT_2 = '1515781826575204645'; 

// 📑 قائمة رتب الـ LSPD المحدثة بالكامل بناءً على طلبك
const LSPD_ROLES = [
    { label: '⭐ Colonel', value: '1515781726205644810' },
    { label: '⭐ Major', value: '1515781727593824326' },
    { label: '🦅 Captain', value: '1515781772158435570' },
    { label: '🥇 First Lieutenant\'s', value: '1515781776776233080' },
    { label: '🥇 Lieutenant\'s', value: '1515781777879470241' },
    { label: '🎖️ Staff Sergeant\'s', value: '1515781807872934101' },
    { label: '🎖️ First Sergeant\'s', value: '1515781809559048284' },
    { label: '🎖️ Sergeant\'s', value: '1515781811052089506' },
    { label: '👮 Senior Officer\'s', value: '1515781817947521144' },
    { label: '👮 Officer lll', value: '1515781821629988978' }, 
    { label: '👮 Officer ll', value: '1515781823072960522' },
    { label: '👮 Officer l', value: '1515781824373198940' },
    { label: '🔰 Solo Cadet', value: '1515781825501331608' },
    { label: '🔰 Cadet', value: '1515781826575204645' }
];

// مصفوفة تجمع كل رتب السلك الأمني لتسهيل التطهير والسحب التلقائي
const ALL_LSPD_ROLE_IDS = LSPD_ROLES.map(r => r.value);

// ==========================================================================================

client.on('ready', () => {
    console.log(`✅ البوت جاهز، ومفعل نظام الترحيب الخاص بـ LSPD: ${client.user.tag}`);
});

const activeActions = new Map();

// حدث الترحيب التلقائي للقطاع
client.on('guildMemberAdd', async (member) => {
    const welcomeChannel = member.guild.channels.cache.get(CHANNEL_WELCOME_LOG);
    if (!welcomeChannel) return;

    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);

    const welcomeEmbed = new EmbedBuilder()
        .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
        .setTitle('Welcome to LSPD | Los Santos Police Department') 
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 })) 
        .addFields(
            { name: 'Officer :', value: `${member}`, inline: false }, 
            { name: 'Create Discord :', value: `<t:${createdTimestamp}:R>`, inline: false }, 
            { name: 'Total Members :', value: `**${member.guild.memberCount}**`, inline: false } 
        )
        .setColor('#1a237e') 
        .setFooter({ text: `By Moha` })
        .setTimestamp(); 

    await welcomeChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'points') {
        const targetId = args[0] || message.author.id;
        const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
        
        if (!targetMember) return message.reply('❌ تعذر العثور على العضو، يرجى كتابة الـ ID بشكل صحيح.');
        
        const allData = getPointsData();
        const userPoints = allData.points[targetId] || 0;

        const pointsEmbed = new EmbedBuilder()
            .setTitle('📊 السجل الرقمي لنقاط الضابط 📊')
            .setDescription(`الضابط المستعلم عنه: ${targetMember}`)
            .addFields({ name: '✨ رصيد النقاط الحالي المسجل:', value: `**${userPoints}** نقطة` })
            .setColor('#29b6f6')
            .setTimestamp();

        return message.reply({ embeds: [pointsEmbed] });
    }

    if (command === 'setup-apply') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ للادارة العليا فقط.');
        
        const embed = new EmbedBuilder()
            .setTitle('👮 التقديم على جهاز الشرطة (LSPD) 👮')
            .setDescription('مرحباً بك في بوابة التقديم للانتساب إلى سلك الشرطة والعمل على حماية المدينة.\nاضغط على الزر أدناه لتعبئة استمارة الالتحاق.')
            .setColor('#1a237e');

        if (URL_APPLY_PANEL_IMAGE && URL_APPLY_PANEL_IMAGE.startsWith('http')) {
            embed.setImage(URL_APPLY_PANEL_IMAGE);
        }

        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('lspd_apply_btn').setLabel('تقديم الآن 📝').setStyle(ButtonStyle.Primary));
        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete();
    }

    if (command === 'lspd-admin') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ ليس لديك صلاحية الوصول للوحة التحكم.');
        
        const embed = new EmbedBuilder()
            .setTitle('⚙️ لوحة تحكم إدارة قطاع الـ LSPD ⚙️')
            .setDescription('اختر الإجراء الإداري المطلوب لتنفيذه وتوثيقه فوراً:')
            .setColor('#0d1b2a')
            .setTimestamp();

        if (URL_ADMIN_PANEL_IMAGE && URL_ADMIN_PANEL_IMAGE.startsWith('http')) {
            embed.setImage(URL_ADMIN_PANEL_IMAGE);
        }

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('admin_promote').setLabel('ترقية ضابط 📈').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('admin_demote').setLabel('كسر رتبة 📉').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('admin_warn').setLabel('تحذير ضابط ⚠️').setStyle(ButtonStyle.Danger)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('admin_points_add').setLabel('إضافة نقاط ➕').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('admin_points_remove').setLabel('سحب نقاط ➖').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('admin_points_check').setLabel('استعلام عن نقاط 🔍').setStyle(ButtonStyle.Primary), 
            new ButtonBuilder().setCustomId('admin_fire').setLabel('فصل عسكري ❌').setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
        await message.delete();
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'lspd_apply_btn') {
        const modal = new ModalBuilder().setCustomId('lspd_apply_modal').setTitle('استمارة الانضمام إلى LSPD');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lspd_name').setLabel("الاسم الرباعي:").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lspd_age').setLabel("العمر:").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lspd_exp').setLabel("هل لديك خبرات في قطاعات عسكرية سابقة؟").setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lspd_hours').setLabel("كم ساعة تستطيع التواجد يومياً؟").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lspd_citizen').setLabel("رقم الهوية (Citizen ID):").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'lspd_apply_modal') {
        await interaction.deferReply({ ephemeral: true });

        const name = interaction.fields.getTextInputValue('lspd_name');
        const age = interaction.fields.getTextInputValue('lspd_age');
        const exp = interaction.fields.getTextInputValue('lspd_exp');
        const hours = interaction.fields.getTextInputValue('lspd_hours');
        const citizenId = interaction.fields.getTextInputValue('lspd_citizen');

        const reviewEmbed = new EmbedBuilder()
            .setTitle('📋 طلب إنضمام جديد (LSPD) 📋')
            .setDescription(`قدم بواسطة: ${interaction.user}`)
            .addFields(
                { name: '👤 الاسم:', value: name, inline: true },
                { name: '🎂 العمر:', value: age, inline: true },
                { name: '🆔 Citizen ID:', value: citizenId, inline: true },
                { name: '🛠️ الخبرات السابقة:', value: exp },
                { name: '⏰ ساعات التواجد:', value: hours }
            ).setColor('#0288d1');

        if (URL_TICKET_IMAGE && URL_TICKET_IMAGE.startsWith('http')) {
            reviewEmbed.setImage(URL_TICKET_IMAGE);
        }

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`lspd_accept_${interaction.user.id}`).setLabel('قبول وتعيين رتبة Cadet 🟢').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`lspd_reject_${interaction.user.id}`).setLabel('رفض الطلب 🔴').setStyle(ButtonStyle.Danger)
        );

        const adminLogChannel = interaction.guild.channels.cache.get(CHANNEL_APPLY_LOG);
        if (adminLogChannel) {
            await adminLogChannel.send({ embeds: [reviewEmbed], components: [actionRow] });
            await interaction.editReply({ content: '✅ تم إرسال استمارة تقديمك بنجاح إلى إدارة الـ LSPD للمراجعة!' });
        } else {
            await interaction.editReply({ content: '❌ خطأ: لم يتم العثور على روم استقبال التقديمات الحالية.' });
        }
    }

    if (interaction.isButton() && (interaction.customId.startsWith('lspd_accept_') || interaction.customId.startsWith('lspd_reject_'))) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.customId.split('_')[2];
        const isAccept = interaction.customId.includes('accept');
        const member = await interaction.guild.members.fetch(userId).catch(() => null);

        if (isAccept && member) {
            await member.roles.add([ROLE_ACCEPT_1, ROLE_ACCEPT_2]).catch(() => null);
        }

        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(isAccept ? '#2ecc71' : '#e74c3c')
            .setTitle(isAccept ? '🟢 تم قبول العسكري وصرف الرتب التأسيسية' : '🔴 تم رفض طلب الانضمام');

        await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

        const decisionEmbed = new EmbedBuilder()
            .setTitle(isAccept ? '🟢 قرار قبول طلب انتساب' : '🔴 قرار رفض طلب انتساب')
            .addFields(
                { name: '👮 المسؤول عن القرار:', value: `${interaction.user}`, inline: true },
                { name: '👤 مقدم الطلب:', value: member ? `${member}` : `مستخدم غادر السيرفر (${userId})`, inline: true }
            )
            .setColor(isAccept ? '#2ecc71' : '#e74c3c')
            .setTimestamp();

        const decisionChannel = interaction.guild.channels.cache.get(LOG_APPLY_DECISION);
        if (decisionChannel) await decisionChannel.send({ embeds: [decisionEmbed] });

        if (member) {
            await member.send(isAccept ? '🎉 تهانينا! تم قبولك في جهاز الشرطة (LSPD) وصُرفت لك الرتب التأسيسية. يرجى مراجعة مقر التدريب.' : '💔 للأسف، تم رفض طلبك للإنضمام إلى جهاز الشرطة (LSPD) حالياً.').catch(() => null);
        }

        await interaction.editReply({ content: `✅ تم معالجة الطلب بنجاح وتوثيق القرار في اللوغ!` });
    }

    if (interaction.isButton() && interaction.customId.startsWith('admin_')) {
        const actionType = interaction.customId.split('_')[1];
        
        if (actionType === 'promote' || actionType === 'demote') {
            const modal = new ModalBuilder().setCustomId(`modal_getid_${actionType}`).setTitle(actionType === 'promote' ? "📈 ترقية ضابط" : "📉 كسر رتبة عسكرية");
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('target_id').setLabel("ID الضابط المستهدف:").setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'admin_points_check') {
            const modal = new ModalBuilder().setCustomId('modal_points_check').setTitle('🔍 استعلام سريع عن ملف ضابط');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('target_id').setLabel("ادخل ID الضابط للمعاينة:").setStyle(TextInputStyle.Short).setRequired(true)));
            return await interaction.showModal(modal);
        }

        let title = ""; let label2 = "السبب الإداري:";
        if (actionType === 'warn') title = "⚠️ توجيه إنذار عسكري";
        else if (actionType === 'fire') title = "❌ قرار فصل وسحب الصلاحيات العسكرية";
        else if (actionType === 'points') { title = interaction.customId.includes('add') ? "➕ إضافة نقاط ميدانية" : "➖ سحب نقاط وعقوبة مجازاة"; label2 = "عدد النقاط (أرقام فقط):"; }

        const modal = new ModalBuilder().setCustomId(`modal_direct_${interaction.customId}`).setTitle(title);
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('target_id').setLabel("ID الضابط المستهدف:").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason_value').setLabel(label2).setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_points_check') {
        const targetId = interaction.fields.getTextInputValue('target_id');
        const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
        
        if (!targetMember) return interaction.reply({ content: '❌ تعذر العثور على هذا الشخص بالسيرفر، تأكد من الـ ID الصحيح.', ephemeral: true });

        const allData = getPointsData();
        const userPoints = allData.points[targetId] || 0;
        const userWarns = allData.warnings[targetId] || 0;

        const pointsEmbed = new EmbedBuilder()
            .setTitle('📊 تفاصيل سجل الضابط الإداري 📊')
            .setDescription(`الضابط المستعلم عنه: ${targetMember}`)
            .addFields(
                { name: '✨ إجمالي النقاط المسجلة حالياً:', value: `**${userPoints}** نقطة`, inline: true },
                { name: '⚠️ عدد المخالفات والإنذارات:', value: `**${userWarns}** إنذار`, inline: true }
            )
            .setColor('#0288d1')
            .setTimestamp();

        return interaction.reply({ embeds: [pointsEmbed], ephemeral: true });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_getid_')) {
        const actionType = interaction.customId.split('_')[2];
        const targetId = interaction.fields.getTextInputValue('target_id');
        
        const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
        if (!targetMember) return interaction.reply({ content: '❌ تعذر العثور على هذا الشخص بالسيرفر، تأكد من الـ ID الصحيح.', ephemeral: true });

        activeActions.set(interaction.user.id, { actionType, targetId });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('admin_role_select')
            .setPlaceholder('اختر الرتبة العسكرية الجديدة لتعيينها والبدء بالتطهير تلقائياً...')
            .addOptions(LSPD_ROLES);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ content: `🎯 المستهدف الحين: ${targetMember}\nالرجاء اختيار الرتبة المستهدفة من القائمة وسيتم تنظيف باقي رتب الـ LSPD تلقائياً:`, components: [row], ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'admin_role_select') {
        const session = activeActions.get(interaction.user.id);
        if (!session) return interaction.reply({ content: '❌ انتهت الجلسة الأمنية، أعد المحاولة.', ephemeral: true });

        const { actionType, targetId } = session;
        const selectedRoleId = interaction.values[0];
        const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
        const role = interaction.guild.roles.cache.get(selectedRoleId);

        if (!targetMember || !role) return interaction.reply({ content: '❌ خطأ: لم أجد العضو أو الرتبة في السيرفر.', ephemeral: true });

        // التحديث الذكي: تنظيف كافة رتب الـ LSPD السابقة أولاً لمنع تراكم الرتب القديمة عند الترقية أو الكسر
        const rolesToRemove = ALL_LSPD_ROLE_IDS.filter(id => id !== selectedRoleId);
        await targetMember.roles.remove(rolesToRemove).catch(() => null);

        // الآن نقوم بإعطاء الرتبة الجديدة المستهدفة (سواء كانت ترقية أو كسر) لكي تظهر رتبته الحالية فقط
        await targetMember.roles.add(selectedRoleId).catch(() => null);

        const logEmbed = new EmbedBuilder()
            .setTitle(actionType === 'promote' ? '📈 عملية ترقية عسكرية وتطهير رتب' : '📉 عملية كسر رتبة عسكرية وتطهير رتب')
            .addFields(
                { name: '👮 القيادة الإدارية:', value: `${interaction.user}`, inline: true },
                { name: '👮 الضابط المستهدف:', value: `${targetMember}`, inline: true },
                { name: '📝 الرتبة الرسمية الجديدة الحالية:', value: `${role.name}` }
            ).setColor(actionType === 'promote' ? '#2ecc71' : '#e67e22').setTimestamp();

        const currentLogId = actionType === 'promote' ? LOG_PROMOTION : LOG_DEMOTE;
        const logChannel = interaction.guild.channels.cache.get(currentLogId);
        if (logChannel) await logChannel.send({ embeds: [logEmbed] });

        await targetMember.send(`✉️ إشعار رسمي من قيادة LSPD: تم تحديث رتبتك وتصفية الملف العسكري لتصبح رتبتك الحالية: **${role.name}**.`).catch(() => null);
        await interaction.update({ content: `✅ تم تنفيذ الإجراء بنجاح وتصفية كافة الرتب القديمة والإبقاء على رتبة ${role.name} فقط!`, components: [], ephemeral: true });
        activeActions.delete(interaction.user.id);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_direct_')) {
        const actionFull = interaction.customId.replace('modal_direct_admin_', '');
        const targetId = interaction.fields.getTextInputValue('target_id');
        const reasonOrValue = interaction.fields.getTextInputValue('reason_value');
        
        const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
        if (!targetMember) return interaction.reply({ content: '❌ العضو غير موجود بالسيرفر.', ephemeral: true });

        let logChannelId = '';
        let color = '#ffffff'; let actionTitle = '';
        let pointsMessageDetail = '';

        const allData = getPointsData();

        if (actionFull === 'warn') { 
            logChannelId = LOG_WARN;
            color = '#f1c40f'; 
            
            const currentWarns = allData.warnings[targetId] || 0;
            const newWarns = currentWarns + 1;
            allData.warnings[targetId] = newWarns;
            savePointsData(allData);

            if (newWarns === 1) {
                if (ROLE_WARN_1 && ROLE_WARN_1.length > 5) await targetMember.roles.add(ROLE_WARN_1).catch(() => null);
            } else if (newWarns === 2) {
                if (ROLE_WARN_1 && ROLE_WARN_1.length > 5) await targetMember.roles.remove(ROLE_WARN_1).catch(() => null);
                if (ROLE_WARN_2 && ROLE_WARN_2.length > 5) await targetMember.roles.add(ROLE_WARN_2).catch(() => null);
            } else if (newWarns === 3) {
                if (ROLE_WARN_2 && ROLE_WARN_2.length > 5) await targetMember.roles.remove(ROLE_WARN_2).catch(() => null);
                if (ROLE_WARN_3 && ROLE_WARN_3.length > 5) await targetMember.roles.add(ROLE_WARN_3).catch(() => null);
            }

            let warnLevelName = `الإنذار ${newWarns}`;
            if (newWarns > 3) {
                warnLevelName = `متعدي الحد (الإنذار رقم ${newWarns})`;
            }

            actionTitle = `⚠️ توجيه عقوبة إنذار رسمي [${warnLevelName}]`; 
            pointsMessageDetail = `\n📊 السجل التراكمي للمخالفات: الضابط لديه الآن **${newWarns}** إنذارات وتم تحديث رتبته التحذيرية بالسيرفر.`;
        }
        else if (actionFull === 'fire') { 
            logChannelId = LOG_FIRE;
            color = '#c0392b'; 
            actionTitle = '❌ قرار طرد وفصل رسمي كامل من قطاع الـ LSPD'; 
            
            // سحب كل شيء يخص الـ LSPD (الرتب العسكرية، رتب القبول ورتب التحذيرات كاملة بدون ترك أي أثر للضابط المفصول)
            const allRolesToStrip = [
                ROLE_ACCEPT_1, ROLE_ACCEPT_2, 
                ROLE_WARN_1, ROLE_WARN_2, ROLE_WARN_3,
                ...ALL_LSPD_ROLE_IDS
            ].filter(id => id && id.length > 5);
            
            // سحب الرتب دفعة واحدة وتصفير البيانات
            await targetMember.roles.remove(allRolesToStrip).catch((err) => console.log("خطأ في سحب رتب الفصل، يرجى مراجعة صلاحيات البوت: ", err));
            
            allData.warnings[targetId] = 0;
            allData.points[targetId] = 0; // تصفير النقاط عند الطرد
            savePointsData(allData);
        }
        else if (actionFull.startsWith('points')) { 
            logChannelId = LOG_POINTS;
            color = '#3498db'; 
            const pointsAmount = parseInt(reasonOrValue);
            
            if (isNaN(pointsAmount) || pointsAmount <= 0) {
                return interaction.reply({ content: '❌ خطأ: الرجاء إدخل أرقام صحيحة وموجبة فقط في حقل النقاط.', ephemeral: true });
            }

            const currentPoints = allData.points[targetId] || 0;
            let newPoints = currentPoints;

            if (actionFull.includes('add')) {
                newPoints += pointsAmount;
                actionTitle = `➕ إضافة نقاط تميز ميداني (+${pointsAmount})`;
            } else {
                newPoints = Math.max(0, currentPoints - pointsAmount); 
                actionTitle = `➖ مجازاة بسحب نقاط وعقوبة مجازاة (-${pointsAmount})`;
            }

            allData.points[targetId] = newPoints;
            savePointsData(allData); 

            pointsMessageDetail = `\n📊 الرصيد الإجمالي الحالي للضابط: **${newPoints}** نقطة تميز مسجلة.`;
        }

        const logEmbed = new EmbedBuilder()
            .setTitle(actionTitle)
            .addFields(
                { name: '👮 القيادة المسؤولة:', value: `${interaction.user}`, inline: true },
                { name: '👮 الضابط المستهدف:', value: `${targetMember}`, inline: true },
                { name: '📝 البيان والتفاصيل:', value: actionFull.startsWith('points') ? `تعديل رصيد النقاط بقيمة ${reasonOrValue} نقطة.` : reasonOrValue }
            )
            .setDescription(pointsMessageDetail || null)
            .setColor(color).setTimestamp();

        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) await logChannel.send({ embeds: [logEmbed] });

        await targetMember.send(`✉️ إشعار عاجل من الإدارة العليا للـ LSPD:\nالإجراء العسكري المتخذ: **${actionTitle}**\n${pointsMessageDetail ? pointsMessageDetail : `السبب/التفاصيل: ${reasonOrValue}`}`).catch(() => null);
        await interaction.reply({ content: `✅ تم تنفيذ الإجراء الإداري بنجاح، وسحب/إضافة كافة الصلاحيات وتوثيقها باللوغ!`, ephemeral: true });
    }
});

client.on('error', console.error);

client.login(process.env.BOT_TOKEN);