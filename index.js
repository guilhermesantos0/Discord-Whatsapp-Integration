const qrcode = require('qrcode-terminal');
const fs = require('fs');
const wweb = require('whatsapp-web.js');
const Discord = require('discord.js');
const config = require('./config.json');
let channels = require('./channels.json');
let messages = require('./messages.json');

let discordConfig = {};

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

    let contact = await message.getContact()
    let chat = await message.getChat()

    if(chat.isMuted || message.isStatus) return

    if(chat.isGroup){

        let groupChannel = channels.groups[chat.id._serialized]
        if(groupChannel){

            const embed = new Discord.EmbedBuilder()
            .setTitle(contact.name ? contact.name : contact.pushname)
            .setDescription(message.body ? message.body : (message.caption ? message.caption : "MENSAGEM SEM TEXTO"))
            .setColor(config.embedColor)

            const btn = new Discord.ButtonBuilder()
            .setCustomId(`ans`)
            .setLabel("Responder")
            .setEmoji('994087537230479380')
            .setStyle(Discord.ButtonStyle.Primary)

            const row = new Discord.ActionRowBuilder()
            .setComponents(btn)

            
            groupChannel.send({ embeds: [embed], components: [row] }).then(msg => {
                let msgData = {
                    sender: contact,
                    chat: chat,
                    id: message.id._serialized
                }

                messages[msg.id] = msgData
            })
        }else{

            discordConfig.guild.channels.create({
                name: `${Object.keys(channels.groups).length + 1}`,
                type: Discord.ChannelType.GuildText,
                parent: discordConfig.groupParent,
                description: chat.name
            }).then(c => {

                const embed = new Discord.EmbedBuilder()
                .setTitle(contact.name ? contact.name : contact.pushname)
                .setDescription(message.body ? message.body : (message.caption ? message.caption : "MENSAGEM SEM TEXTO"))
                .setColor(config.embedColor)

                const btn = new Discord.ButtonBuilder()
                .setCustomId(`ans`)
                .setLabel("Responder")
                .setEmoji('994087537230479380')
                .setStyle(Discord.ButtonStyle.Primary)

                const row = new Discord.ActionRowBuilder()
                .setComponents(btn)

                c.send({ embeds: [embed], components: [row] }).then(msg => {
                    messages[msg.id] = {
                        sender: contact,
                        chat: chat,
                        id: message.id._serialized
                    }
                })

                channels.groups[chat.id._serialized] = c
            })

        }
        // chat.id.user

    }else{

        let cttChannel = channels.pv[message.from]
        if(cttChannel){

            const embed = new Discord.EmbedBuilder()
            .setTitle(contact.name ? contact.name : contact.pushname)
            .setDescription(message.body ? message.body : (message.caption ? message.caption : "MENSAGEM SEM TEXTO"))
            .setColor(config.embedColor)

            const btn = new Discord.ButtonBuilder()
            .setCustomId(`ans`)
            .setLabel("Responder")
            .setEmoji('994087537230479380')
            .setStyle(Discord.ButtonStyle.Primary)

            const row = new Discord.ActionRowBuilder()
            .setComponents(btn)

            cttChannel.send({ embeds: [embed], components: [row] }).then(msg => {
                messages[msg.id] = {
                    sender: contact,
                    chat: chat,
                    id: message.id._serialized
                }
            })

        }else{

            discordConfig.guild.channels.create({
                name: `${Object.keys(channels.pv).length + 1}`,
                type: Discord.ChannelType.GuildText,
                parent: discordConfig.pvParent,
                description: contact.name ? contact.name : `${contact.number} - ${contact.pushname}`
            }).then(c => {

                const embed = new Discord.EmbedBuilder()
                .setTitle(contact.name ? contact.name : contact.pushname)
                .setDescription(message.body ? message.body : (message.caption ? message.caption : "MENSAGEM SEM TEXTO"))
                .setColor(config.embedColor)

                const btn = new Discord.ButtonBuilder()
                .setCustomId(`ans`)
                .setLabel("Responder")
                .setEmoji('994087537230479380')
                .setStyle(Discord.ButtonStyle.Primary)

                const row = new Discord.ActionRowBuilder()
                .setComponents(btn)

                c.send({ embeds: [embed], components: [row] }).then(msg => {
                    let msgData = {
                        sender: contact,
                        chat: chat,
                        id: message.id._serialized
                    }
    
                    messages[msg.id] = msgData
                })

                channels.pv[message.from] = c
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

wClient.on('ready',() => {

    const embed = new Discord.EmbedBuilder()
    .setTitle('Bot Online!')
    .setDescription('<a:check2:771703412022312970> Bot do Whatsapp online!')
    .setColor(config.embedColor)

    discordConfig.channel.send({ embeds: [embed] })

    console.log('Bot Zap Online!')
})

dClient.on('messageCreate', async (message) => {

    if(!message.content) return

    if(message.content.startsWith('!set')){

        message.channel.bulkDelete(3)
        let msgContentArr = message.content.split(' ')

        if(msgContentArr.length < 3) return message.channel.send('tu q desenvolveu o bot e nao sabe usar?')

        discordConfig.pvParent = msgContentArr[1]
        discordConfig.groupParent = msgContentArr[2]
        discordConfig.guild = message.guild
        discordConfig.channel = message.channel

        wClient.initialize();
        wClient.on('qr', (qr) => {
            qrcode.generate(qr, { small: true })
        })

        let pvParent = message.guild.channels.cache.get(msgContentArr[1])
        let groupParent = message.guild.channels.cache.get(msgContentArr[2])

        const embed = new Discord.EmbedBuilder()
        .setTitle('Tudo certo')
        .setDescription(`> Categoria do PV:\n${pvParent.name}\n\n> Categoria de Grupos:\n${groupParent.name}\n\n*Iniciando bot do Whatsapp*\n**Comando:** \`${message.content}\``)
        .setColor(config.embedColor)

        message.channel.send({ embeds: [embed] })

        console.log('tudo certo! iniciando bot!')

        return
    }else if(message.content.startsWith('!add')){
        let msgContentArr = message.content.split(' ')
        
        if(msgContentArr.length < 3) return message.channel.send('tu q desenvolveu o bot e nao sabe usar?')

        let type = msgContentArr[1]
        let id = msgContentArr[2]

        message.channel.edit({
            name: `${Object.keys(channels[type]).length + 1}`
        })

        channels[type][`55${id}@c.us`] = message.channel

        let ctt = await wClient.getContactById(`55${id}@c.us`)

        const embed = new Discord.EmbedBuilder()
        .setTitle('Canal adicionado!')
        .setDescription(`Contato:\n> ${ctt.name}\n\nNúmero:\n> ${id}`)
        .setColor(config.embedColor)

        message.delete().catch(err => {})
        return message.channel.send({ embeds: [embed] })
    }

    let channel = await getPVChannel(message.channel.id)
    if(!channel) {
        let channel = await getGroupChannel(message.channel.id)
        if(channel){

            wClient.sendMessage(channel, message.contact)
        }
    }else{
        if(message.content.startsWith('!add')) {
            return
        }
        wClient.sendMessage(`${channel}`, message.content)
    }
})

dClient.on('interactionCreate',async(interaction) => {
    interaction.deferUpdate()
    if(interaction.customId == 'ans'){

        let msgData = messages[interaction.message.id]

        let chatId = getPVChannel(msgData.chat.id._serialized)
        if(!chatId){
            chatId = getGroupChannel(msgData.chat.id._serialized)
            if(!chatId) return

            let chatMessages = await msgData.chat.fetchMessages()
            let ansMsg = chatMessages.find(i => i.id == msgData.id)

            if(ansMsg){

                let sentContact = ansMsg.getContact()

                const embed = new Discord.EmbedBuilder()
                .setTitle(`Respondendo a ${contact.name} | ${chat.name}`)
                .setDescription(`> ${ansMsg.body}`)
                .setColor(config.embedColor)

                interaction.channel.send({ embeds: [embed] }).then(msg => {
                    const msgFilter = i => i.author.id == interaction.user.id && i.content
                    let collector = interaction.channel.createMessageCollector({ msgFilter, time: 60000 })
                    collector.on('collect', c => {

                        if(!c.content) return

                        let ans = c.content

                        ansMsg.reply(ans)

                        embed.setTitle('Resposta enviada!')
                        embed.setDescription(`Você respondeu a ${sentContact.name} em ${chat.name}\n\n**Mensagem:**\n>${ansMsg.body}\n\n**Resposta:**\n>${ans}`)

                        msg.edit({ embeds: [embed] }).then(m => {
                            m.delete().catch(e => {return})
                        })
                    })
                })
            }
        }else{

            let chatMessages = await msgData.chat.fetchMessages()
            let ansMsg = chatMessages.find(i => i.id == msgData.id)

            if(ansMsg){

                let sentContact = ansMsg.getContact()

                const embed = new Discord.EmbedBuilder()
                .setTitle(`Respondendo a ${sentContact.name}`)
                .setDescription(`> ${ansMsg.body}`)
                .setColor(config.embedColor)

                interaction.channel.send({ embeds: [embed] }).then(msg => {
                    const msgFilter = i => i.author.id == interaction.user.id && i.content
                    let collector = interaction.channel.createMessageCollector({ msgFilter, time: 60000 })
                    collector.on('collect', c => {
                        
                        if(!c.content) return

                        let ans = c.content

                        ansMsg.reply(ans)

                        embed.setTitle(`Resposta enviada!`)
                        embed.setDescription(`Você respondeu a ${contact.name}\n\n**Mensagem:**\n>${ansMsg.body}\n\n**Resposta:**\n> ${ans}`)

                        msg.edit({ embeds: [embed] }).then(m => {
                            m.delete().catch(e => {return})
                        })
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
    console.log('salvou aqui')
},300000)

getPVChannel = (channelId) => {
    if(channels?.pv?.length == 0) return
    for(let [k,v] of Object.entries(channels.pv)){
        if(v.id == channelId) return k
    }
}

getGroupChannel = (channelId) => {
    if(channels?.pv?.length == 0) return
    for(let [k,v] of Object.entries(channels.groups)){
        if(v.id == channelId) return k
    }
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
})

dClient.login(config.token)