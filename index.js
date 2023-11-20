const qrcode = require('qrcode-terminal');
const fs = require('fs');
const wweb = require('whatsapp-web.js');
const Discord = require('discord.js');
require("dotenv").config();

const config = require('./config.json');
let channels = require('./channels.json');
let messages = require('./messages.json');

let discordConfig = {};
let answeringMessage = false
const defaultProfilePicture = "https://media.discordapp.net/attachments/825417861311758336/1174465066217775124/profile.png?ex=6567b0d4&is=65553bd4&hm=06624d83e7877671737ef262cc34a28d0031d1f56a5855be9d3d4e232aa8c3c8&="
let clientProfilePicture;

const dClient = new Discord.Client({ 
    intents: [
        Discord.GatewayIntentBits.Guilds, 
        Discord.GatewayIntentBits.GuildMembers, 
        Discord.GatewayIntentBits.DirectMessages, 
        Discord.GatewayIntentBits.GuildMessages, 
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildVoiceStates
    ], 
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.Message,
        Discord.Partials.User
    ]
})

const wClient = new wweb.Client({
    authStrategy: new wweb.LocalAuth({
        clientId: 'guilherme-bot'
    })
})

typeof(channels) == 'string' ? channels = JSON.parse(channels) : channels = channels
typeof(messages) == 'string' ? messages = JSON.parse(messages) : messages = messages

wClient.on('message', async(message) => {

    // if(message.hasMedia){
    //     const media = await message.downloadMedia()
    
    //     if(!media.mimetype.startsWith("image")) return;
    //     const embed = new Discord.EmbedBuilder()
        
    //     fs.writeFileSync(
    //         `./${message.id.id}.${media.mimetype.split("/")[1]}`,
    //         Buffer.from(media.data, 'base64'),
    //         function(err) { if(err) console.log(err) }
    //     )

    //     const attachment = new Discord.AttachmentBuilder()
    //     .setFile(`${message.id.id}.${media.mimetype.split("/")[1]}`)

    //     embed.setImage(`attachment://${message.id.id}.${media.mimetype.split("/")[1]}`)
        
    //     await discordConfig.channel.send({ embeds: [embed], files: [attachment] })
    // }

    
    let contact = await message.getContact()
    let chat = await message.getChat()

    if(chat.isMuted || message.isStatus) return
    
    let contactPicture;

    wClient.getProfilePicUrl(contact.id)
    .then(pic => {
        contactPicture = pic
    })
    .catch((err) => {
        if(err) contactPicture = defaultProfilePicture
    })

    let attachment = undefined;
    let media = undefined;

    if(chat.isGroup){

        let groupChannelId = channels.groups[chat.id._serialized]
        let guildChannels = await discordConfig.guild.channels.fetch()

        let groupChannel = guildChannels.find(i => i.id == groupChannelId)

        if(groupChannel){


            const embed = new Discord.EmbedBuilder()
            .setTitle(contact.name ? contact.name : (contact.pushname ? `~${contact.pushname}` : contact.number))
            .setColor(config.embedColor)
            .setThumbnail(contactPicture)

            if(message.body || message.caption){
                embed.setDescription(message.body ? message.body : message.caption)
            }
            if(message.media){
                media = await message.downloadMedia()

                fs.writeFileSync(
                    `./${message.id.id}.${media.mimetype.split("/")[1]}`,
                    Buffer.from(media.data, 'base64'),
                    function(err) { if(err) console.log(err) }
                )
        
                attachment = new Discord.AttachmentBuilder()
                .setFile(`${message.id.id}.${media.mimetype.split("/")[1]}`)
        
                embed.setImage(`attachment://${message.id.id}.${media.mimetype.split("/")[1]}`)
            }

            const btn = new Discord.ButtonBuilder()
            .setCustomId(`ans`)
            .setLabel("Responder")
            .setEmoji('994087537230479380')
            .setStyle(Discord.ButtonStyle.Primary)

            const row = new Discord.ActionRowBuilder()
            .setComponents(btn)
            
            setTimeout(async () => {
                await groupChannel.send({ embeds: [embed], components: [row], files: attachment ? [attachment]: [] }).then(msg => {

                    if(media){
                        fs.unlinkSync(
                            `./${message.id.id}.${media.mimetype.split("/")[1]}`,
                            function (err) {if(err) console.log(err)}
                        )
                    }

                    messages[msg.id] = {
                        chat: chat,
                        chatId: chat.id._serialized,
                        message: message.body ? message.body : "*Mensagem sem texto*",
                        contact: contact.name ? contact.name : (contact.pushname ? `~${contact.pushname}` : contact.number),
                        id: message.id._serialized
                    }
                })
            },500)
        }else{

            discordConfig.guild.channels.create({
                name: `${chat.name}`,
                type: Discord.ChannelType.GuildText,
                parent: discordConfig.groupParent,
                description: chat.name
            }).then( async c => {

                const embed = new Discord.EmbedBuilder()
                .setTitle(contact.name ? contact.name : (contact.pushname ? `~${contact.pushname}` : contact.number))
                .setColor(config.embedColor)
                .setThumbnail(contactPicture)

                if(message.body || message.caption){
                    embed.setDescription(message.body ? message.body : message.caption)
                }
                if(message.media){
                    media = await message.downloadMedia()
    
                    fs.writeFileSync(
                        `./${message.id.id}.${media.mimetype.split("/")[1]}`,
                        Buffer.from(media.data, 'base64'),
                        function(err) { if(err) console.log(err) }
                    )
            
                    attachment = new Discord.AttachmentBuilder()
                    .setFile(`${message.id.id}.${media.mimetype.split("/")[1]}`)
            
                    embed.setImage(`attachment://${message.id.id}.${media.mimetype.split("/")[1]}`)
                }

                const btn = new Discord.ButtonBuilder()
                .setCustomId(`ans`)
                .setLabel("Responder")
                .setEmoji('994087537230479380')
                .setStyle(Discord.ButtonStyle.Primary)

                const row = new Discord.ActionRowBuilder()
                .setComponents(btn)

                setTimeout(async () => {
                    await c.send({ embeds: [embed], components: [row], files: attachment ? [attachment]: [] }).then(msg => {

                        if(media){
                            fs.unlinkSync(
                                `./${message.id.id}.${media.mimetype.split("/")[1]}`,
                                function (err) {if(err) console.log(err)}
                            )
                        }

                        messages[msg.id] = {
                            chat: chat,
                            chatId: chat.id._serialized,
                            message: message.body ? message.body : "*Mensagem sem texto*",
                            contact: contact.name ? contact.name : (contact.pushname ? `~${contact.pushname}` : contact.number),
                            id: message.id._serialized
                        }
                    })
                },500)

                channels.groups[chat.id._serialized] = c.id
            })

        }

    }else{
        
        let cttChannelId = channels.pv[message.from]
        let guildChannels = await discordConfig.guild.channels.fetch()
        let cttChannel = guildChannels.find(i => i.id == cttChannelId)

        if(cttChannel){

            const embed = new Discord.EmbedBuilder()
            .setTitle(contact.name ? contact.name : (contact.pushname ? `~${contact.pushname}` : contact.number))
            .setColor(config.embedColor)
            .setThumbnail(contactPicture)

            if(message.body || message.caption){
                embed.setDescription(message.body ? message.body : message.caption)
            }

            if(message.hasMedia){
                let media = await message.downloadMedia()

                fs.writeFileSync(
                    `./${message.id.id}.${media.mimetype.split("/")[1]}`,
                    Buffer.from(media.data, 'base64'),
                    function(err) { if(err) console.log(err) }
                )
        
                attachment = new Discord.AttachmentBuilder()
                .setFile(`${message.id.id}.${media.mimetype.split("/")[1]}`)
        
                embed.setImage(`attachment://${message.id.id}.${media.mimetype.split("/")[1]}`)
            }

            const btn = new Discord.ButtonBuilder()
            .setCustomId(`ans`)
            .setLabel("Responder")
            .setEmoji('994087537230479380')
            .setStyle(Discord.ButtonStyle.Primary)

            const row = new Discord.ActionRowBuilder()
            .setComponents(btn)

            setTimeout(async () => {
                await cttChannel.send({ embeds: [embed], components: [row], files: attachment ? [attachment]: [] }).then(msg => {
    
                    if(media){
                        fs.unlinkSync(
                            `./${message.id.id}.${media.mimetype.split("/")[1]}`,
                            function (err) {if(err) console.log(err)}
                        )
                    }
    
                    messages[msg.id] = {
                        chat: chat,
                        message: message.body ? message.body : "*Mensagem sem texto*",
                        sender: message.from,
                        contact: contact.name ? contact.name : (contact.pushname ? `~${contact.pushname}` : contact.number),
                        id: message.id._serialized
                    }
                })
            },500)

        }else{

            discordConfig.guild.channels.create({
                name: `${chat.name}`,
                type: Discord.ChannelType.GuildText,
                parent: discordConfig.pvParent,
                description: contact.name ? contact.name : `${contact.number} - ${contact.pushname}`
            }).then(async c => {

                const embed = new Discord.EmbedBuilder()
                .setTitle(contact.name ? contact.name : (contact.pushname ? `~${contact.pushname}` : contact.number))
                .setColor(config.embedColor)
                .setThumbnail(contactPicture)

                if(message.body || message.caption){
                    embed.setDescription(message.body ? message.body : message.caption)
                }
                if(message.media){
                    media = await message.downloadMedia()
    
                    if(!media.mimetype.startsWith("image")) return

                    fs.writeFileSync(
                        `./${message.id.id}.${media.mimetype.split("/")[1]}`,
                        Buffer.from(media.data, 'base64'),
                        function(err) { if(err) console.log(err) }
                    )
            
                    attachment = new Discord.AttachmentBuilder()
                    .setFile(`${message.id.id}.${media.mimetype.split("/")[1]}`)
            
                    embed.setImage(`attachment://${message.id.id}.${media.mimetype.split("/")[1]}`)
                }

                const btn = new Discord.ButtonBuilder()
                .setCustomId(`ans`)
                .setLabel("Responder")
                .setEmoji('994087537230479380')
                .setStyle(Discord.ButtonStyle.Primary)

                const row = new Discord.ActionRowBuilder()
                .setComponents(btn)

                setTimeout(async () => {
                    await c.send({ embeds: [embed], components: [row], files: attachment ? [attachment]: [] }).then(msg => {

                        if(media){
                            fs.unlinkSync(
                                `./${message.id.id}.${media.mimetype.split("/")[1]}`,
                                function (err) {if(err) console.log(err)}
                            )
                        }

                        messages[msg.id] = {
                            chat: chat,
                            message: message.body ? message.body : "*Mensagem sem texto*",
                            sender: message.from,
                            contact: contact.name ? contact.name : (contact.pushname ? `~${contact.pushname}` : contact.number),
                            id: message.id._serialized
                        }
                    })
                },500)

                channels.pv[message.from] = c.id
            })
        }
    }
})

// wClient.on('message', async (message) => {

//     console.log(message)

//     let contact = await message.getContact()
//     let chat = await message.getChat()
//     let msgMentions = await message.getMentions()

//     if(msgMentions?.length > 0){
//         msgMentions.forEach(i => {
//             console.log(i)
//         })
//     }

//     if(!message.type == 'chat' || !message.type == "image") return

//     const embed = new Discord.EmbedBuilder()

//     if(chat.isGroup){

//         embed.setTitle(`${contact.name} - ${chat.name}`)
//         embed.setColor(config.embedColor)
        
//         if(message.body){
//             embed.setDescription(message.body)
//         }else if(message.hasMedia()){
//             embed.setDescription(message.caption ? message.caption : " ")
            
//             let media = await message.downloadMedia()
//             console.log(media)
//         }

//         const ansBtn = new Discord.ButtonBuilder()
//         .setCustomId('ans')
//         .setLabel('RESPONDER')
//         .setEmoji('994087537230479380')
//         .setStyle(Discord.ButtonStyle.Primary)

//         const row = new Discord.ActionRowBuilder()
//         .setComponents(ansBtn)

//         channel.send({ embeds: [embed], components: [row] }).then(msg => {

//             let filter = i => i.isButton() && i.user.id == '673369105121804338'

//             let collector = msg.createMessageComponentCollector({ filter, time: 60000 })
//             collector.on('collect', i => {
//                 if(i.customId == 'ans'){

//                     embed.setTitle(`Responder à ${contact.name}`)
//                     embed.setDescription(`> ${message.body}`)

//                     const msgFilter = m => m.author.id == i.user.id

//                     msg.edit({ embeds: [embed], components: [] }).then(_msg => {
//                         let _collector = _msg.channel.createMessageCollector({ msgFilter, time: 60000, max: 1 })
//                         _collector.on('collect', m => {

//                             message.reply(m.content)

//                             embed.setTitle(`Mensagem respondida!`)
//                             embed.setDescription(`Você respondeu \à mensagem de ${contact.name} em ${chat.name}\n\nMensagem:\n> ${message.body}\n\nResposta:\n> ${m.content}`)

//                             _msg.edit({ embeds: [embed] })
//                         })
//                     })
//                 }
//             })
//         })
//     }else {
        
//         embed.setTitle(`${contact.name}`)
//         embed.setColor(config.embedColor)
        
//         if(message.body){
//             embed.setDescription(message.body)
//         }else if(message.hasMedia){
//             embed.setDescription(message.caption ? message.caption : " ")
            
//             let media = await message.downloadMedia()
//             console.log(media)
//         }

//         const ansBtn = new Discord.ButtonBuilder()
//         .setCustomId('ans')
//         .setLabel('RESPONDER')
//         .setEmoji('994087537230479380')
//         .setStyle(Discord.ButtonStyle.Primary)

//         const row = new Discord.ActionRowBuilder()
//         .setComponents(ansBtn)

//         channel.send({ embeds: [embed], components: [row] }).then(msg => {

//             let filter = i => i.isButton() && i.user.id == '673369105121804338'

//             let collector = msg.createMessageComponentCollector({ filter, time: 60000 })
//             collector.on('collect', i => {
//                 if(i.customId == 'ans'){

//                     embed.setTitle(`Responder à ${contact.name}`)
//                     embed.setDescription(`> ${message.body}`)

//                     const msgFilter = m => m.author.id == i.user.id

//                     msg.edit({ embeds: [embed], components: [] }).then(_msg => {
//                         let _collector = _msg.channel.createMessageCollector({ msgFilter, time: 60000, max: 1 })
//                         _collector.on('collect', m => {

//                             message.reply(m.content)

//                             embed.setTitle(`Mensagem respondida!`)
//                             embed.setDescription(`Você respondeu \à mensagem de ${contact.name}\n\nMensagem:\n> ${message.body}\n\nResposta:\n> ${m.content}`)

//                             _msg.edit({ embeds: [embed] })
//                         })
//                     })
//                 }
//             })

//         })
//     }
// })

dClient.on('ready', () => {
    console.log("Bot Discord Online!")
})

wClient.on('ready',async () => {

    const embed = new Discord.EmbedBuilder()
    .setTitle('Bot Online!')
    .setDescription('<a:check2:771703412022312970> Bot do Whatsapp online!')
    .setColor(config.embedColor)

    discordConfig.channel.send({ embeds: [embed] })

    console.log('Bot Zap Online!')

    let contacts = await wClient.getContacts()
    contacts.forEach(async i => {
        if(i.isMe){
            let profilePic = await i.getProfilePicUrl()
            clientProfilePicture = profilePic
        }
    })
})

dClient.on('messageCreate', async (message) => {

    if(message.author.bot) return

    if(message.content.startsWith('!set')){

        await message.channel.bulkDelete(3).catch(e => {})
        let msgContentArr = message.content.split(' ')

        if(msgContentArr.length < 3) return message.channel.send('tu q desenvolveu o bot e nao sabe usar?')

        discordConfig.pvParent = msgContentArr[1]
        discordConfig.groupParent = msgContentArr[2]
        discordConfig.guild = message.guild
        discordConfig.channel = message.channel

        wClient.initialize();
        wClient.on('qr', (qr) => {

            qrcode.generate(qr, { small: true },function(str){

                const embed = new Discord.EmbedBuilder()
                .setTitle("A autenticacao falhou, escaneie este código!")
                .setDescription("```" + str + "```")
                .setColor(config.embedColor)

                message.channel.send({ embeds: [embed] })

            })
        })

        wClient.on('authenticated', function(){
            console.log("Autenticado!")
        })

        let pvParent = message.guild.channels.cache.get(msgContentArr[1])
        let groupParent = message.guild.channels.cache.get(msgContentArr[2])

        const embed = new Discord.EmbedBuilder()
        .setTitle('Tudo certo')
        .setDescription(`> Categoria do PV:\n${pvParent.name}\n\n> Categoria de Grupos:\n${groupParent.name}\n\n*Iniciando bot do Whatsapp*\n**Comando:** \`${message.content}\``)
        .setColor(config.embedColor)

        await message.channel.send({ embeds: [embed] })

        console.log('tudo certo! iniciando bot!')

        return
    }else if(message.content.startsWith('!add')){

        let _contacts = await wClient.getContacts()
        let contacts = []
    
        message.delete().catch(err => {})

        let pagesAmount = 1
        let currentPage = 1

        _contacts.forEach(contact => {
            if(contact.isUser && contact.isMyContact){
                contacts.push(
                    {
                        name: contact.name,
                        id: contact.id._serialized
                    }
                )
            }
        })

        function descriptionText(__contacts, currentPage){
            let description = "> **Contatos nesta página**\n\n"
            for(let i = (currentPage - 1) * 10; (i < (currentPage - 1) * 10 + 10) && (i < __contacts.length); i++){
                description += `${__contacts[i].name}\n`
            }
            return description
        }

        function menuOptions(contacts, currentPage){
            let options = []
            for(let i = (currentPage - 1) * 10; (i < (currentPage - 1) * 10 + 10) && (i < contacts.length); i++){
                let option = {
                    label: contacts[i].name,
                    value: contacts[i].id
                }

                options.push(option)
            }

            return options
        }

        if(contacts.length > 10){
            pagesAmount = Math.ceil(contacts.length / 10)

            const embed = new Discord.EmbedBuilder()
            .setTitle("Escolha um contato")
            .setDescription(descriptionText(contacts, currentPage))
            .setFooter({ text: `Página ${currentPage}/${pagesAmount}` })
            .setColor(config.embedColor)

            const forwardButton = new Discord.ButtonBuilder()
            .setCustomId("forward")
            .setLabel("+")
            .setStyle(Discord.ButtonStyle.Primary)

            const backButton = new Discord.ButtonBuilder()
            .setCustomId("back")
            .setLabel("-")
            .setStyle(Discord.ButtonStyle.Primary)

            const cancelButton = new Discord.ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("X")
            .setStyle(Discord.ButtonStyle.Danger)

            const buttonsRow = new Discord.ActionRowBuilder()
            .setComponents(backButton, forwardButton, cancelButton)

            const selectMenu = new Discord.StringSelectMenuBuilder()
            .setCustomId("addingcontact")
            .setPlaceholder("Selecione um contato!")
            .addOptions(menuOptions(contacts, currentPage))

            const selectMenuRow = new Discord.ActionRowBuilder()
            .setComponents(selectMenu)

            message.channel.send({embeds: [embed], components: [buttonsRow,selectMenuRow]})
            .then(msg => {
                let collector = msg.createMessageComponentCollector({ time: 60000 })
                let selectedContact;
                collector.on('collect', async c => {
    
                    if(c.customId == "forward" && currentPage < pagesAmount){
                        currentPage ++;
                        embed.setDescription(descriptionText(contacts, currentPage))
                        embed.setFooter({ text: `Página ${currentPage}/${pagesAmount}`})
    
                        selectMenu.setOptions(menuOptions(contacts, currentPage))
                        selectMenuRow.setComponents(selectMenu)
                        msg.edit({ embeds: [embed], components: [buttonsRow, selectMenuRow]})
                    }else if(c.customId == "back" && currentPage > 1){
                        currentPage --;
                        embed.setDescription(descriptionText(contacts, currentPage))
                        embed.setFooter({ text: `Página ${currentPage}/${pagesAmount}`})
    
                        selectMenu.setOptions(menuOptions(contacts, currentPage))
                        selectMenuRow.setComponents(selectMenu)
                        msg.edit({ embeds: [embed], components: [buttonsRow, selectMenuRow]})
                    }else if(c.customId == "addingcontact"){
    
                        const contact = await wClient.getContactById(c.values[0])
                        let contactAvatarUrl = defaultProfilePicture;

                        wClient.getProfilePicUrl(c.values[0])
                        .then(contactAvatar => {
                            contactAvatarUrl = contactAvatar
                        })
                        .catch(() => {
                            contactAvatarUrl = defaultProfilePicture
                        })
                        
                        selectedContact = {
                            name: contact.name,
                            id: c.values[0]
                        }

                        const nEmbed = new Discord.EmbedBuilder()
                        .setTitle("Contato selecionado")
                        .setDescription(`Nome: ${contact.name}`)
                        .setThumbnail(contactAvatarUrl)

                        const confirm = new Discord.ButtonBuilder()
                        .setCustomId("confirm")
                        .setLabel("CONFIRMAR")
                        .setStyle(Discord.ButtonStyle.Success)

                        const cancelcontacat = new Discord.ButtonBuilder()
                        .setCustomId("cancelcontact")
                        .setLabel("CANCELAR")
                        .setStyle(Discord.ButtonStyle.Danger)

                        const finalRow = new Discord.ActionRowBuilder()
                        .setComponents(confirm, cancelcontacat)
                        
                        msg.edit({ embeds: [nEmbed], components: [finalRow] })
                    }else if(c.customId == "confirm"){
                        
                        let contactAvatarUrl = defaultProfilePicture;
                        
                        wClient.getProfilePicUrl(selectedContact.id)
                        .then(contactAvatar => {
                            contactAvatarUrl = contactAvatar
                        })
                        .catch(() => {
                            contactAvatarUrl = defaultProfilePicture
                        })

                        const finalEmbed = new Discord.EmbedBuilder()
                        .setTitle('Canal adicionado!')
                        .setDescription(`Contato:\n> ${selectedContact.name}\n\nNúmero:\n> ${selectedContact.id.replace("@c.us","")}`)
                        .setColor(config.embedColor)
                        .setThumbnail(contactAvatarUrl)

                        message.channel.edit({
                            name: `${selectedContact.name}`
                        })
                
                        channels.pv[selectedContact.id] = message.channel.id

                        msg.edit({ embeds: [finalEmbed], components: [] })
                    }else if(c.customId == "cancelcontact"){
                        msg.edit({ embeds: [embed], components: [buttonsRow, selectMenuRow]})
                    }else if(c.customId == "cancel"){
                        msg.delete().catch(err => {})
                    }
                })
                collector.on('end', c => {
                    
                    let isContactSelected = false
                    c.forEach(i => {
                        if(i.isStringSelectMenu()) isContactSelected = true
                    })
                    
                    if(!isContactSelected){
                        const finalEmbed = new Discord.EmbedBuilder()
                        .setTitle("Nenhum contato selecionado!")
                        .setDescription("Nenhum contato foi selecionado, a escolha foi encerrada, caso queira tentar de novo, utilize novamente o comando!")
                        .setColor("FF0000")

                        msg.edit({ embeds: [finalEmbed], components: [] }).then(msg => {
                            setTimeout(() => {
                                msg.delete().catch(err => {})
                            },5000)
                        }).catch(err => {})
                    }

                })
            })
            .catch(err => {
                console.log(err)
            })

        }

    return
    }else if(message.content.startsWith("!clear")){

        let parent = message.channel.parent
        let guildChannels = await message.channel.guild.channels.fetch()
        guildChannels.forEach(i => {
            if(i.parentId == parent.id){
                i.delete()
            }
        })
    }else if(message.content.startsWith("!teste")){

        const attachment = new Discord.AttachmentBuilder()
        .setFile("profile.png")

        const embed = new Discord.EmbedBuilder()
        .setImage("attachment://profile.png")

        message.channel.send({ embeds: [embed], files: [attachment]})
    }

    if(answeringMessage || message.content.startsWith("!teste")) return

    const embed = new Discord.EmbedBuilder()
    .setTitle(`${wClient.info.pushname} (Você)`)
    .setColor(config.embedColor)
    .setThumbnail(clientProfilePicture ? clientProfilePicture : defaultProfilePicture)

    if(message.content){
        embed.setDescription(message.content)
    }
    if(message.attachments){
        message.attachments.forEach(i => {
            if(i.contentType.startsWith("image")){
                embed.setImage(i.url)
            }
        })
    }

    const btn = new Discord.ButtonBuilder()
    .setCustomId(`ans`)
    .setLabel("Responder")
    .setEmoji('994087537230479380')
    .setStyle(Discord.ButtonStyle.Primary)

    const row = new Discord.ActionRowBuilder()
    .setComponents(btn)


    await message.delete().catch(err => {})
    let msg = await message.channel.send({ embeds: [embed], components: [row] })

    let channel = await getPVChannel(message.channel.id)
    if(!channel) {
        let channel = await getGroupChannel(message.channel.id)
        
        if(channel){
            if(message.attachments.size > 0){
                message.attachments.forEach(async i => {
                    let media = await wweb.MessageMedia.fromUrl(i.url)
                    
                    if(message.content){
                        wClient.sendMessage(channel, media, {caption: message.content}).then(m => {
                            messages[msg.id] = {
                                chat: {
                                    id: {
                                        _serialized: channel
                                    }
                                },
                                message: message.content ? message.content : "*Mensagem sem texto*",
                                contact: wClient.info.pushname,
                                id: m.id._serialized
                            }
                        })
                    }else{
                        wClient.sendMessage(channel, media).then(m => {
                            messages[msg.id] = {
                                chat: {
                                    id: {
                                        _serialized: channel
                                    }
                                },
                                message: message.content ? message.content : "*Mensagem sem texto*",
                                contact: wClient.info.pushname,
                                id: m.id._serialized
                            }
                        })
                    }
                })
            }else{
                wClient.sendMessage(channel, message.content).then(m => {
                    messages[msg.id] = {
                        chat: {
                            id: {
                                _serialized: channel
                            }
                        },
                        message: message.content ? message.content : "*Mensagem sem texto*",
                        contact: wClient.info.pushname,
                        id: m.id._serialized
                    }
                })
            }

        }

    }else{

        if(message.attachments.size > 0){
            message.attachments.forEach(async i => {
                let media = await wweb.MessageMedia.fromUrl(i.url)

                if(message.content){
                    wClient.sendMessage(channel, media, {caption: message.content}).then(m => {
                        messages[msg.id] = {
                            chat: {
                                id: {
                                    _serialized: channel
                                }
                            },
                            message: message.content ? message.content : "*Mensagem sem texto*",
                            sender: channel,
                            contact: wClient.info.pushname,
                            id: m.id._serialized
                        }
                    })
                }else{
                    wClient.sendMessage(channel, media).then(m => {
                        messages[msg.id] = {
                            chat: {
                                id: {
                                    _serialized: channel
                                }
                            },
                            message: message.content ? message.content : "*Mensagem sem texto*",
                            sender: channel,
                            contact: wClient.info.pushname,
                            id: m.id._serialized
                        }
                    })
                }
            })
        }else{
            wClient.sendMessage(channel, message.content).then(m => {
                messages[msg.id] = {
                    chat: {
                        id: {
                            _serialized: channel
                        }
                    },
                    message: message.content ? message.content : "*Mensagem sem texto*",
                    sender: channel,
                    contact: wClient.info.pushname,
                    id: m.id._serialized
                }
            })
        }
    }
})

dClient.on('interactionCreate',async(interaction) => {
    interaction.deferUpdate()
    if(interaction.customId == 'ans'){

        let msgData = messages[interaction.message.id]

        const filter = i => i.user.id == interaction.user.id

        let chatId = await getPVChannelByChat(msgData.chat.id._serialized)
        if(!chatId){
            chatId = await getGroupChannelByChat(msgData.chat.id._serialized)
            if(!chatId) {
                console.log("Não encontrado!")
                return
            }


            if(msgData){

                answeringMessage = true

                const embed = new Discord.EmbedBuilder()
                .setTitle(`Respondendo a ${msgData.contact} • ${msgData.chat.name}`)
                .setDescription(`> ${msgData.message}`)
                .setColor(config.embedColor)

                interaction.channel.send({ embeds: [embed] }).then(msg => {
                    const msgFilter = i => i.author.id == interaction.user.id && i.content
                    let collector = interaction.channel.createMessageCollector({ msgFilter, max: 1 })
                    collector.on('collect', async c => {

                        if(!c.content) return

                        let ans = c.content

                        const embed = new Discord.EmbedBuilder()
                        .setTitle(`${wClient.info.pushname} (Você)`)
                        .setDescription(`> **${msgData.contact}**\n> ${msgData.message}\n\n${ans}`)
                        .setColor(config.embedColor)
                        .setThumbnail(clientProfilePicture ? clientProfilePicture : defaultProfilePicture)

                        await c.delete()
                        let msg = await interaction.channel.send({ embeds: [embed]})

                        wClient.sendMessage(msgData.chatId, ans, { quotedMessageId: msgData.id }).then(m => {
                            messages[msg.id] = {
                                chat: {
                                    id: {
                                        _serialized: msgData.chatId
                                    }
                                },
                                message: c.content ? c.content : "*Mensagem sem texto*",
                                sender: msgData.chatId,
                                contact: wClient.info.pushname,
                                id: m.id._serialized
                            }
                        })
                        answeringMessage = false

                        msg.delete().catch(e => {})
                    })
                })
            }
        }else{

            // quotedMessageId: this.id._serialized

            if(msgData){

                answeringMessage = true

                // let sentContact = ansMsg.getContact()

                const embed = new Discord.EmbedBuilder()
                .setTitle(`Respondendo a ${msgData.contact}`)
                .setDescription(`> ${msgData.message}`)
                .setColor(config.embedColor)

                interaction.channel.send({ embeds: [embed] }).then(msg => {
                    const msgFilter = i => i.author.id == interaction.user.id && i.content
                    let collector = interaction.channel.createMessageCollector({ msgFilter, max: 1 })
                    collector.on('collect', async c => {
                        
                        if(!c.content) return

                        let ans = c.content

                        const embed = new Discord.EmbedBuilder()
                        .setTitle(`${wClient.info.pushname} (Você)`)
                        .setDescription(`> **${msgData.contact}**\n> ${msgData.message}\n\n${ans}`)
                        .setColor(config.embedColor)
                        .setThumbnail(clientProfilePicture ? clientProfilePicture : defaultProfilePicture)

                        await c.delete()
                        await interaction.channel.send({ embeds: [embed] })

                        wClient.sendMessage(msgData.sender, ans, { quotedMessageId: msgData.id })
                        answeringMessage = false

                        msg.delete().catch(e => {})
                    })
                })

            }
        }
    }
})

setInterval(() => {
    fs.writeFile(
        'channels.json',
        JSON.stringify(channels), 
        function(err) {if(err) console.log(err)}
    )
    fs.writeFile(
        'messages.json',
        JSON.stringify(messages),
        function(err) {if(err) console.log(err)}
    )
},5000)

getPVChannel = (channelId) => {
    if(channels?.pv?.length == 0) return
    for(let [k,v] of Object.entries(channels.pv)){
        if(v == channelId) return k
    }
}

getGroupChannel = (channelId) => {
    if(channels?.pv?.length == 0) return
    for(let [k,v] of Object.entries(channels.groups)){
        if(v == channelId) return k
    }
}

getPVChannelByChat = (chatId) => {
    if(channels?.pv?.length == 0) return
    return channels.pv[chatId] ? channels.pv[chatId] : undefined
}

getGroupChannelByChat = (chatId) => {
    if(channels?.pv?.length == 0) return
    return channels.groups[chatId] ? channels.groups[chatId] : undefined
}

Object.prototype.getChatId = (channelId) => {
    for(let [k,v] of Object.entries(this)){
        if(v.id == channelId) return k
    }
    return null
}

dClient.on('error', error => {
    fs.writeFile(
        'channels.json',
        JSON.stringify(channels), 
        function(err) {if(err) console.log(err)}
    )
    fs.writeFile(
        'messages.json',
        JSON.stringify(messages),
        function(err) {if(err) console.log(err)}
    )
    console.log(`Houve um erro, tudo foi salvo.\nErro: ${error.name}\n\n${error.message}`)
    console.log(error)
})

dClient.login(process.env.TOKEN)