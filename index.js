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

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, StringSelectMenuBuilder, PermissionFlagsBits, ChannelType } = require('discord.js'); 
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
const COUNTER_FILE = './ticket_counter.json'; // ملف حفظ أرقام التكتات الترتيبية

// دالة جلب بيانات النقاط والتحذيرات
function getPointsData() {
    if (!fs.existsSync(POINTS_FILE)) fs.writeFileSync(POINTS_FILE, JSON.stringify({ points: {}, warnings: {} }));
    let data;
    try { data = JSON.parse(fs.readFileSync(POINTS_FILE, 'utf-8')); } catch (e) { data = {}; }
    if (!data.points) data.points = {};
    if (!data.warnings) data.warnings = {};
    return data;
}

function savePointsData(data) {
    fs.writeFileSync(POINTS_FILE, JSON.stringify(data, null, 4));
}

// دالة جلب وزيادة رقم التكت الترتيبي
function getNextTicketNumber() {
    if (!fs.existsSync(COUNTER_FILE)) fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: 0 }));
    let data;
    try { data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf-8')); } catch (e) { data = { count: 0 }; }
    data.count += 1;
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 4));
    // إرجاع الرقم منسق بـ 4 خانات مثل 0001
    return String(data.count).padStart(4, '0');
}

// ================= [ 👮 إعدادات الرتب ورومات اللوق بالـ ID 👮 ] =================

const ROLE_WARN_1 = '1515781909060522114'; 
const ROLE_WARN_2 = '1515781910155231454'; 
const ROLE_WARN_3 = '1515781911535157349'; 

const CHANNEL_WELCOME_LOG = '1518793447862042757'; 
const CHANNEL_APPLY_LOG = '1518794178966978682'; 

// 🎫 إعدادات نظام التكت (تعديل حسب سيرفرك)
const TICKET_CATEGORY_ID = '1515782000219525260'; // ID الكاتيجوري اللي تفتح فيه التكتات[cite: 1]
const TICKET_LOG_CHANNEL = '1515782525618753606'; // روم لوغ التكتات[cite: 1]

// 🖼️ روابط صور لوحات التحكم
const URL_APPLY_PANEL_IMAGE = 'https://media.discordapp.net/attachments/1515782065025449994/1518694046531457095/cc4917ae23da92ad815a259a26a974c8_1.png'; 
const URL_TICKET_IMAGE      = 'https://media.discordapp.net/attachments/1515782065025449994/1518694046531457095/cc4917ae23da92ad815a259a26a974c8_1.png'; 
const URL_ADMIN_PANEL_IMAGE = 'https://media.discordapp.net/attachments/1515782065025449994/1518694046531457095/cc4917ae23da92ad815a259a26a974c8_1.png'; 
const URL_RULES_IMAGE       = 'https://media.discordapp.net/attachments/1515782065025449994/1518694046531457095/cc4917ae23da92ad815a259a26a974c8_1.png'; 

// 📂 رومات اللوغات المنفصلة بالكامل:
const LOG_APPLY_DECISION = '1518795837017161798'; 
const LOG_PROMOTION = '1515782209150255255';  
const LOG_DEMOTE = '1518795310803976272';    
const LOG_WARN = '1515782216066797679';      
const LOG_FIRE = '1515782222412517590';          
const LOG_POINTS = '1515782206394732614';    

const ROLE_ACCEPT_1 = '1515781932217274509'; 
const ROLE_ACCEPT_2 = '1515781826575204645'; 

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

const ALL_LSPD_ROLE_IDS = LSPD_ROLES.map(r => r.value);

// ==========================================================================================

client.on('ready', () => {
    console.log(`✅ البوت جاهز، ومفعل نظام الترحيب، التكت، والقوانين المنسدلة الكاملة: ${client.user.tag}`);
});

const activeActions = new Map();

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

    if (command === 'setup-ticket') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ للادارة العليا فقط.');

        const embed = new EmbedBuilder()
            .setTitle('✉️ مركز الدعم والتواصل لقطاع الـ LSPD ✉️')
            .setDescription('إذا كان لديك استفسار، شكوى، أو ترغب في التواصل مع مسؤولي وموجّهي القطاع، يرجى الضغط على الزر أدناه لفتح تكت خاص بك.')
            .setColor('#1a237e')
            .setFooter({ text: 'قنوات التواصل الرسمية لشرطة لوس سانتوس' });

        if (URL_TICKET_IMAGE && URL_TICKET_IMAGE.startsWith('http')) {
            embed.setImage(URL_TICKET_IMAGE);
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('lspd_open_ticket').setLabel('فتح تكت تواصل ✉️').setStyle(ButtonStyle.Success)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete();
    }

    if (command === 'setup-rules') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ للادارة العليا فقط.');

        const embed = new EmbedBuilder()
            .setTitle('Police Department')
            .setDescription('جميع القوانين التابعة لـ شرطة لوس سانتوس.\nنرجو من الجميع الالتزام بالقوانين الموضحة أدناه.')
            .setColor('#e74c3c'); 

        if (URL_RULES_IMAGE && URL_RULES_IMAGE.startsWith('http')) {
            embed.setImage(URL_RULES_IMAGE);
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('lspd_rules_menu')
            .setPlaceholder('اضغط هنا لقراءة القوانين')
            .addOptions([
                { label: 'قوانين الشرطة', value: 'rule_police', description: 'القوانين والبروتوكولات العامة العسكرية', emoji: '👮' },
                { label: 'قوانين الصاعق الكهربائي', value: 'rule_taser', description: 'شروط وضوابط استخدام التايزر الصاعق', emoji: '⚡' },
                { label: 'قوانين الراديو', value: 'rule_radio', description: 'آداب الالتزام بالموجات والتشفير الصوتي', emoji: '📻' },
                { label: 'قوانين طلق النار', value: 'rule_shooting', description: 'حالات استخدام السلاح الحي وقواعد الاشتباك', emoji: '🔫' },
                { label: 'عدد السرقات', value: 'rule_robberies', description: 'التعامل مع البلاغات والسرقات الكبرى والصغرى', emoji: '💰' },
                { label: 'الية استخدام الـ Spike', value: 'rule_spike', description: 'شروط فرش شريط المسامير لتعطيل الكفرات', emoji: '🛑' },
                { label: 'قوانين المطاردات', value: 'rule_pursuits', description: 'بروتوكول ملاحقة المركبات وتصنيف السرعات', emoji: '🏎️' },
                { label: 'قوانين البانك', value: 'rule_bank', description: 'آلية واستخدام الـ Panic بمختلف أنواعه', emoji: '🏦' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await message.channel.send({ content: '@everyone', embeds: [embed], components: [row] });
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
    // 🎫 التفاعل لفتح التكت بنظام الرقم التسلسلي المحدث
    if (interaction.isButton() && interaction.customId === 'lspd_open_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const nextNum = getNextTicketNumber(); // جلب الرقم الترتيبي مثل 0001
        const ticketName = `ticket-${nextNum}`;
        
        const ticketChannel = await interaction.guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: TICKET_CATEGORY_ID || null,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }, 
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }, 
                { id: interaction.guild.roles.cache.find(r => r.permissions.has(PermissionFlagsBits.ManageRoles))?.id || interaction.guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] } 
            ]
        }).catch(() => null);

        if (!ticketChannel) {
            return await interaction.editReply({ content: '❌ حدث خطأ أثناء إنشاء التكت، يرجى التأكد من صلاحيات البوت ووجود الكاتيجوري.' });
        }

        const welcomeTicketEmbed = new EmbedBuilder()
            .setTitle(`🔓 تكت دعم جديد | رقم التكت #${nextNum}`)
            .setDescription(`مرحباً بك عسكري/ضابط ${interaction.user}\nلقد قمت بفتح تكت للتواصل مع مسؤولي الـ LSPD، يرجى كتابة استفسارك أو مشكلتك بوضوح وانتظار الرد الإداري.`)
            .setColor('#2ecc71')
            .setTimestamp();

        // 🛠️ الأزرار المقسمة على سطرين بحسب صورة image_9d9ea0.png
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام 🙋‍♂️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('add_user').setLabel('اضافة شخص ➕').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('rename_ticket').setLabel('تغيير الاسم ✏️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('move_ticket').setLabel('نقل 🔄').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('remind_user').setLabel('تذكير 🔔').setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق التكت 🔒').setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ content: `${interaction.user} | طاقم الإدارة`, embeds: [welcomeTicketEmbed], components: [row1, row2] });
        await interaction.editReply({ content: `✅ تم فتح التكت الخاص بك بنجاح! توجه إلى هنا: ${ticketChannel}` });

        const logChannel = interaction.guild.channels.cache.get(TICKET_LOG_CHANNEL);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('📥 إنشاء تكت جديد')
                .addFields(
                    { name: '👤 العضو:', value: `${interaction.user}`, inline: true },
                    { name: '📺 الروم الجديد:', value: `${ticketChannel}`, inline: true }
                ).setColor('#2ecc71').setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }
    }

    // 🔒 التحكم بحماية الأزرار والمنع الأمني للأعضاء بدون رتب إدارة
    if (interaction.isButton() && ['claim_ticket', 'rename_ticket', 'move_ticket', 'remind_user'].includes(interaction.customId)) {
        // التحقق مما إذا كان العضو يمتلك صلاحية ManageRoles الخاصة بالإدارة
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({ content: '❌ عذراً، هذه الخاصية مخصصة لإدارة ومسؤولي قطاع الـ LSPD فقط ولا يمكنك استخدامها.', ephemeral: true });
        }

        // تنفيذ الأوامر الإدارية في حال كان يمتلك الصلاحية
        if (interaction.customId === 'claim_ticket') {
            await interaction.reply({ content: `🙋‍♂️ تم استلام التكت بواسطة: ${interaction.user}` });
        } else {
            await interaction.reply({ content: `⚙️ هذا الزر جاهز ومحمي إدارياً، وبانتظار ربطه بالوظيفة الكاملة لاحقاً.`, ephemeral: true });
        }
    }

    // زر إضافة شخص (متاح للجميع كما طلبت)
    if (interaction.isButton() && interaction.customId === 'add_user') {
        await interaction.reply({ content: `⚙️ زر إضافة شخص متاح للجميع حالياً وجاهز للربط بالوظيفة الكاملة.`, ephemeral: true });
    }

    // 🔒 التحكم بأزرار التكت وحل مشكلة التعليق بشكل نهائي (متاح للجميع)
    if (interaction.isButton() && (interaction.customId === 'close_ticket' || interaction.customId === 'delete_ticket')) {
        if (interaction.customId === 'close_ticket') {
            await interaction.deferReply(); 

            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { SendMessages: false }).catch(() => null);
            
            const embeds = interaction.message.embeds;
            if (embeds.length > 0) {
                const description = embeds[0].description;
                const mentionMatch = description.match(/<@!?(\d+?)>/);
                if (mentionMatch) {
                    const userId = mentionMatch[1];
                    await interaction.channel.permissionOverwrites.edit(userId, { SendMessages: false }).catch(() => null);
                }
            }

            // إضافة زر الحذف النهائي بعد الإغلاق
            const deleteRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('delete_ticket').setLabel('حذف نهائي 🗑️').setStyle(ButtonStyle.Secondary)
            );

            await interaction.editReply({ content: '🔒 تم إغلاق التكت بنجاح ومنع إرسال الرسائل.', components: [deleteRow] });

        } else if (interaction.customId === 'delete_ticket') {
            // حماية اختيارية لزر الحذف النهائي (تجعله للإدارة فقط لحماية ريكوردات التكت)
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.reply({ content: '❌ حذف التكت نهائياً متاح للإدارة فقط.', ephemeral: true });
            }
            await interaction.reply({ content: '🗑️ سيتم حذف التكت نهائياً خلال 5 ثوانٍ...' });
            setTimeout(async () => {
                await interaction.channel.delete().catch(() => null);
            }, 5000);
        }
    }

    // 📑 التفاعل مع القائمة المنسدلة لعرض القوانين المحددة
    if (interaction.isStringSelectMenu() && interaction.customId === 'lspd_rules_menu') {
        const selectedValue = interaction.values[0];
        let ruleTitle = "";
        let ruleContent = "";

        if (selectedValue === 'rule_police') {
            ruleTitle = "👮 قوانين وتعليمات الشرطة العامة";
            ruleContent = "1- الالتزام بالقوانين والتعاميم الصادرة من رئاسة الشرطة متمثلة بكافة قطاعاتها الشرطة.\n" +
                          "2- الجدية في العمل التعامل مع دورك كشرطي بجدية.\n" +
                          "3- الاحترام المتبادل و تجنب التسلط على المواطنين أو الرتب الأقل منك من زملائك.\n" +
                          "4- يحظر بيع أو إعطاء معدات الشرطة للمواطنين أو المسعفين (باند نهائي).\n" +
                          "5- الالتزام بالمعدات الخاصة برتبتك سواء الملابس, المركبات, والأسلحة الخاصة لرتبتك فقط.\n" +
                          "6- يُمنع استخدام سيارات غير حكومية أثناء الدوام لأي سبب كان. في حال الحاجة لمركبة، استخدم الراديو لطلب وحدة نقل من زملائك.\n" +
                          "7- يمنع رفع السلاح الناري في المستشفى او المباني الحكومية، ويُكتفى باستخدام التيزر فقط.\n" +
                          "8- لا يُسمح أثناء المخالفات المرورية بتقييد المخالف إلا إذا كان غير متعاون أو كان مطلوب لدى الشرطة بجريمة جنائية.\n" +
                          "9- التعامل مع الخاطفين: تلبية المطالب غير التعجيزية دون المساس بهيبة الشرطة، وعدم اتخاذ أي إجراء دون استشارة المسؤول.\n" +
                          "10- تجنب المشكلات الشخصية، والتحلي بضبط النفس، والامتناع عن التلفظ بألفاظ غير لائقة أثناء العمل الميداني.\n" +
                          "11- يمنع تفتيش المجرمين الا في الزنزانات. لا يحق لك تفتيش الشرطي الا وقت الاصطفاف للتاكد من العتاد.\n" +
                          "12- يُستحق التقاعد بدءًا من رتبة سينيور ليد أوفيسر وما فوق، أما ما دون ذلك فلا يُسمح إلا بتقديم الاستقالة.\n" +
                          "13- يُمنع على أي شرطي تجاوز التسلسل القيادي والتوجه مباشرة إلى قيادة الشرطة. يجب الالتزام بالسلم القيادي الكامل حسب اختصاص المشكلة. أي تجاوز لهذا النظام يؤدي إلى الفصل المباشر، حتى في الحالات الواضحة.\n\n" +
                          "🔹 __التعامل مع المسقطين والمسعفين:__\n" +
                          "1- احترام الطاقم الطبي وعدم الاستهزاء بهم.\n" +
                          "2- عدم تحريك الجثه من موقعها حتى وصول المسعفين.\n" +
                          "3- تصوير الجثه في موقعها لجمع الادلة.";
        } else if (selectedValue === 'rule_taser') {
            ruleTitle = "⚡ قوانين الصاعق الكهربائي";
            ruleContent = "1- في حال كان الشخص يحمل بيده سلاحاً أبيض.\n" +
                          "2- في حال اقترابه من ركوب مركبة أو اقترب من ركوب دراجة نارية.\n" +
                          "3- في حال عدم انصياع المواطن لأوامر الشرطة بشكل واضح.\n" +
                          "4- في حال مرور 15 ثانية من المطاردة هروباً على الأقدام ويجب عليك تحذير المطارد بثلاث تحذيرات كل 5 ثواني بعد ذلك يتم إستخدام الصاعق الكهربائي (Taser).\n" +
                          "5- الفاصل الزمني بين الطلقة والأخرى 5 ثواني.\n" +
                          "6- عند استخدام الـ (Taser)، يجب إبلاغ زميلك بالمطاردة (كالذكر في الراديو: ضاعت الطلقه).\n" +
                          "7- في حال كان الشخص متجهًا نحو البحر أو تأكد أنه ينوي التوجه للبحر.";
        } else if (selectedValue === 'rule_radio') {
            ruleTitle = "📻 قوانين آداب واستخدام الراديو";
            ruleContent = "1- التحدث بوضوح وببطء.\n" +
                          "2- التزام الأسبقية.\n" +
                          "3- عدم استخدام أسماء الأشخاص.\n" +
                          "4- الاختصار في البلاغات.\n" +
                          "5- بين كل بلاغ وبلاغ 5 ثواني.";
        } else if (selectedValue === 'rule_shooting') {
            ruleTitle = "🔫 قوانين إطلاق النار وقواعد الاشتباك";
            ruleContent = "1- يمنع منعاً باتاً محاولة افتعال الفايت.\n" +
                          "2- يمنع طلق النار عن طريق المركبة إلا إذا الشخص بادل طلق النار.\n\n" +
                          "🔹 __الحالات المسموحة لطلق النار:__\n" +
                          "1- في حال الشخص صوب السلاح بشكل مباشر يتم إطلاق النار.\n" +
                          "2- في حال الشخص تواجد في موقع إطلاق النار ولم ينسحب بعد التحذير (الطلق على الأطراف).\n" +
                          "3- في حال الشخص كان يهرب على الأقدام وقام بإخراج السلاح يتم (الطلق على الأطراف).\n" +
                          "4- في حال الشخص دهس شرطي عن طريق المركبة بشكل متعمد يتم (طلق النار على الكفرات).";
        } else if (selectedValue === 'rule_robberies') {
            ruleTitle = "💰 العدد المسموح في الحالات والسرقات";
            ruleContent = "• Store Robbery ( 1 - 4 ) | Police ( 1 - 5 ).\n" +
                          "• ATM Robbery ( 2 - 5 ) | Police ( 2 - 6 ).\n" +
                          "• House Robbery ( 3 - 6 ) | Police ( 3 - 7 ).\n" +
                          "• Cash Exchange Robbery ( 4 - 7 ) | Police ( 4 - 8 ).\n" +
                          "• Laundromat Robbery ( 5 - 8 ) | Police ( 5 - 9 ).\n\n" +
                          "⚠️ __السرقات الموضحة بالأسفل إلزامي وجود رهائن:__\n" +
                          "• Jewelry Robbery ( 6 - 9 ) | Police ( 8 - 10).\n" +
                          "• Fleeca Bank Robbery ( 8 - 11 ) | Police ( 9 - 12).\n" +
                          "• Blaine County Robbery ( 9 - 12 ) | Police ( 10 - 13).\n\n" +
                          "🚨 __الحالات المفتوحة:__\n" +
                          "• For Players: 18 MAX\n" +
                          "• Police: 20 MAX";
        } else if (selectedValue === 'rule_spike') {
            ruleTitle = "🛑 آلية استخدام الـ Spike (شريط المسامير)";
            ruleContent = "ممنوع استخدام السبايك إلا لهذه الحالات:\n" +
                          "1- في حال المركبة استغرقت دقيقتين على الطرق السريعة.\n" +
                          "2- أخذ الإذن من مسؤول الحالة.";
        } else if (selectedValue === 'rule_pursuits') {
            ruleTitle = "🏎️ قوانين وآلية المطاردات";
            ruleContent = "🔹 __آلية مطاردة المركبة:__\n" +
                          "1- إبلاغ مركز العمليات بالحالة (ذكر موقع الحالة - ذكر تفاصيل المركبة - ذكر المخالفة وملامح الشخص).\n" +
                          "2- إبقاء مسافة آمنة بين الشخص.\n" +
                          "3- عدم الصدم بشكل عشوائي.\n" +
                          "4- في حال عدم التزام الشخص بقوانين الصدم الاحترافي.\n" +
                          "5- التعامل مع الدراجات النارية وفق قوانين استخدام الـ (Spike).\n\n" +
                          "🔹 __آلية الصدم الاحترافي:__\n" +
                          "1- في حال فشل الهروب الآمن (في الحالات).\n" +
                          "2- يجب وجود مركبة أخرى (إذا وجد).\n" +
                          "3- بدء الصدم بعد مرور 3 دقائق من الحالة.\n" +
                          "4- بين كل صدمة والأخرى 30 ثانية.";
        } else if (selectedValue === 'rule_bank') {
            ruleTitle = "🏦 قوانين وبروتوكول البانك";
            ruleContent = "1- ممنوع تكرار البانك.\n" +
                          "2- يجب الالتزام بآلية البانك.\n" +
                          "3- يمنع استخدام البانك كتوضيح لموقعك ويجب طلب (PickUp).\n\n" +
                          "🔹 __آلية استخدام البانك:__\n" +
                          "1- Panic A: يستخدم البانك لغرض الإسقاط الطبيعي مثل الجوع والوقوع من المركبة وإلى آخره.\n" +
                          "2- Panic B: يستخدم في حال إسقاطك من قبل شخص سواء عن طريق طلق نار أو سلاح أبيض وإلى آخره.\n" +
                          "3- Panic C: يستخدم في حال تم اختطافك.\n" +
                          "💡 __توضيح للبانك C:__ في حال تم ترفيعك بالسلاح أو محاولة اختطافك يتم طلب البانك فقط.";
        }

        const ruleResponseEmbed = new EmbedBuilder()
            .setTitle(ruleTitle)
            .setDescription(ruleContent)
            .setColor('#1a237e')
            .setFooter({ text: 'بوابة القوانين والأنظمة الرسمية لـ LSPD' })
            .setTimestamp();

        await interaction.reply({ embeds: [ruleResponseEmbed], ephemeral: true });
    }

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

        const rolesToRemove = ALL_LSPD_ROLE_IDS.filter(id => id !== selectedRoleId);
        await targetMember.roles.remove(rolesToRemove).catch(() => null);
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
            
            const allRolesToStrip = [
                ROLE_ACCEPT_1, ROLE_ACCEPT_2, 
                ROLE_WARN_1, ROLE_WARN_2, ROLE_WARN_3,
                ...ALL_LSPD_ROLE_IDS
            ].filter(id => id && id.length > 5);
            
            await targetMember.roles.remove(allRolesToStrip).catch((err) => console.log("خطأ في سحب رتب الفصل، يرجى مراجعة صلاحيات البوت: ", err));
            
            allData.warnings[targetId] = 0;
            allData.points[targetId] = 0; 
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
