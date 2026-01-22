const express = require('express')
const { Bot, InputFile } = require('grammy')
const { autoRetry } = require("@grammyjs/auto-retry");
const { hydrateFiles } = require('@grammyjs/files')
const axios = require('axios').default
const cheerio = require('cheerio')
require('dotenv').config()
const mongoose = require('mongoose')
const qs = require('qs')
const fs = require('fs')
const path = require('path')
const https = require('https');
const { millify } = require('millify')
const TiktokersModel = require('./database/bongo-tiktokers')

const sortArray = require('sort-array')
const nyumbuModel = require('./database/chats')
const dayoModel = require('./database/dayo-users')
const pipyModel = require('./database/pipy-users')
const {mtproAPI} = require('./fns/proxies')

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express()

//functions
const { uploadingDramastore, uploadingVideos } = require('./fns/upload')

//delaying
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

//configure port for public files
app.use(express.static(__dirname + '/public'))

const bot = new Bot(process.env.BOT_TOKEN, {
    client: { apiRoot: process.env.API_ROOT }
})

mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log('Connected to the database')
    }).catch((err) => {
        console.log(err)
        bot.api.sendMessage(741815228, err.message)
    })

const imp = {
    replyDb: -1001608248942,
    pzone: -1001352114412,
    prem_channel: -1001470139866,
    local_domain: 't.me/rss_shemdoe_bot?start=',
    prod_domain: 't.me/ohmychannelV2bot?start=',
    shemdoe: 741815228,
    halot: 1473393723,
    bberry: 1101685785,
    sh1xbet: 5755271222,
    xzone: -1001740624527,
    ohmyDB: -1001586042518,
    xbongo: -1001263624837,
    mikekaDB: -1001696592315,
    mylove: -1001748858805
}

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`(Dayo): ${err.message}`, err);
});

//use auto-retry
bot.api.config.use(autoRetry());
bot.api.config.use(hydrateFiles(bot.token));

//bot.api.deleteWebhook({ drop_pending_updates: true })

var bulk_txts = ``

bot.command('start', async (ctx) => {
    try {
        await ctx.reply('starting')
    } catch (error) {
        console.log(err.message)
    }
})

const reqEpisodeAxios = async (Origin, referer, formData) => {
    const response = await axios.post(referer, qs.stringify(formData), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Origin': Origin,
            'Connection': 'keep-alive',
            'Referer': referer,
            'Cookie': 'affiliate=TTTu2kT2yL1E6ULf0GXE2X0lrVgMXMnLVo2PF9IcW8D%2B0JYa9CoJrekdktMXc1Pxx5QN5Rhs5nSyQl0dIG2Xy9O15w5F8%2F7E2dwag%3D%3D; lang=english',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Save-Data': 'on',
            'Priority': 'u=0, i'
        },
        //if axios failed recognize ssl cert ignore
        httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
        }),
        maxRedirects: 0,  // This will prevent axios from following redirects
        validateStatus: function (status) {
            return status >= 200 && status < 400;  // Resolve only if the status code is less than 400
        }
    });
    return response.headers.location
}

bot.command('axios', async (ctx) => {
    try {
        let url = ctx.match.trim()
        // let html = await axios.get(url)
        // let $ = cheerio.load(html.data)
        let id = url.split('.com/')[1].split('/')[0].trim()
        let Origin = url.split('.com/')[0] + '.com'

        const formData = {
            op: 'download2',
            id,
            rand: '',
            referer: '',
            method_free: '',
            method_premium: ''
        };

        let res = await reqEpisodeAxios(Origin, url, formData)

        let drama = url.split('/').pop() //remove last item and return it
        drama = drama.replace('.(NKIRI.COM)', 'SHEMDOE').replace('_(NKIRI.COM)', 'SHEMDOE').replace('.(DRAMAKEY.COM)', 'SHEMDOE').replace('_(DRAMAKEY.COM)', 'SHEMDOE').split('SHEMDOE')[0]
        let epno = drama.split('.').pop()
        drama = drama.replace(`.${epno}`, '')
        let n2 = `${epno}.${drama}`.substring(0, 30)
        let txt = `[dramastore.net] ${n2}.540p.NK.mkv | ${res}\n`
        await ctx.reply(txt)
    } catch (error) {
        console.log(error.message)
    }
})

bot.command('clear_disk', async ctx => {
    try {
        let disk = path.join(__dirname, 'public')
        fs.readdir(disk, async (err, files) => {
            if (err) { await ctx.reply('failed to read directory') }

            for (let file of files) {
                if (['.mkv', '.mp4'].includes(path.extname(file))) {
                    let this_file_path = path.join(disk, file)
                    fs.unlink(this_file_path, async (e) => {
                        if (e) {
                            await ctx.reply(`Failed to delete ${this_file_path}`)
                        } else {
                            await ctx.reply(`✅ File deleted: ${this_file_path}`)
                            await delay(1000)
                        }
                    })
                }
            }
        })
    } catch (error) {
        console.log(error.message)
    }
})

bot.command('check_disk', async ctx => {
    try {
        let disk = path.join(__dirname, 'public')
        let text = `<b>File in your disk:</b>\n\n`
        let pub_files = await fs.promises.readdir(disk)
        for (let [index, file] of pub_files.entries()) {
            let stats = await fs.promises.stat(path.join(disk, file))
            let size = Number(stats.size / (1024 * 1024)).toFixed(2)
            text = text + `${index + 1}. ${file} - ${size} MB\n\n`
        }
        await ctx.reply(text, { parse_mode: 'HTML' })

        //delay 2 seconds
        await delay(2000)

        //read telegram documents
        let tg_doc_disk = `/root/telegram-bot-api/bin/${process.env.BOT_TOKEN}/documents`
        let tg_docs_text = `<b>Documents in your Telegram bin:</b>\n\n`
        let tg_docs = await fs.promises.readdir(tg_doc_disk)
        for (let [i, file] of tg_docs.entries()) {
            let stats = await fs.promises.stat(path.join(tg_doc_disk, file))
            let size = Number(stats.size / (1024 * 1024)).toFixed(2)
            tg_docs_text = tg_docs_text + `${i + 1}. ${file} - ${size} MB\n\n`
        }
        await ctx.reply(tg_docs_text, { parse_mode: 'HTML' })
    } catch (error) {
        console.log(error.message)
    }
})

const getTikStats = async (uniq_id) => {
    const options = {
        method: 'GET',
        url: 'https://tiktok-scraper7.p.rapidapi.com/user/info',
        params: {
            unique_id: uniq_id
        },
        headers: {
            'x-rapidapi-key': process.env.RAPID_API_KEY,
            'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
        }
    };
    const response = await axios.request(options);
    let videoCount = response.data.data.stats.videoCount
    let heartCount = response.data.data.stats.heartCount
    let followingCount = response.data.data.stats.followingCount
    let followerCount = response.data.data.stats.followerCount


    return {
        followers: millify(Number(followerCount)),
        following: millify(Number(followingCount)),
        likes: millify(Number(heartCount)),
        videos: Number(videoCount).toLocaleString('en-US')
    }
}

bot.command('tik', async ctx => {
    try {
        let uniq_id = ctx.match.trim()
        const options = {
            method: 'GET',
            url: 'https://tiktok-scraper7.p.rapidapi.com/user/posts',
            params: {
                unique_id: uniq_id,
                count: '30',
                cursor: '0'
            },
            headers: {
                'x-rapidapi-key': process.env.RAPID_API_KEY,
                'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
            }
        };
        const response = await axios.request(options);
        let stats = await getTikStats(uniq_id)
        if (response.data.msg === "success") {
            let tikuser = `https://www.tiktok.com/@${uniq_id}`

            let check_user = await TiktokersModel.findOne({ uniq_id })
            if (!check_user) {
                await TiktokersModel.create({ uniq_id, videos_id: [] })
            }

            let videos = response.data.data.videos
            let length = response.data.data.videos.length
            for (let i = length - 1; i > 0; i--) {
                let nickname = videos[i].author.nickname
                let duration = Number(videos[i].duration)
                let caption = `<b>New TikTok from ${nickname} 🔥\n\n👤 TikTok: <a href="${tikuser}">@${uniq_id}</a>\n👩‍👩‍👦‍👦 Followers: ${stats.followers}\n👨‍👧‍👦 Following: ${stats.following}\n📺 Total Videos: ${stats.videos}\n❤️ Total Likes: ${stats.likes}</b>`
                let video_id = videos[i].video_id
                let video_play = videos[i].play
                let vid_size = Number(videos[i].size) / (1024 * 1024)
                if (duration > 2 && video_play.startsWith('https://')) {
                    //if video is less then 20MB send direct
                    if (vid_size <= 19.9) {
                        await ctx.api.sendVideo(-1002208162022, video_play, {
                            parse_mode: 'HTML',
                            caption
                        })
                    } else {
                        //upload using multipart
                        let vidpath = ''
                    }
                }
                await TiktokersModel.findOneAndUpdate({ uniq_id }, { $push: { videos_id: video_id } })
            }
        } else {
            await ctx.reply('Axios error: ' + response.data.msg)
        }
    } catch (error) {
        await ctx.reply(error.message)
    }
})

bot.command('movie', async ctx => {
    try {
        if (ctx.match && ctx.match.endsWith('.mkv') || ctx.match.endsWith('.mp4')) {
            let durl = ctx.match
            let fname = ctx.match.split('/').pop()
                .replace('.(NKIRI.COM)', '').replace('NKIRI.COM', 'MUVIKA')

            await uploadingDramastore(ctx, durl, fname, InputFile, 'thumb-movie')
        }
    } catch (error) {
        await ctx.reply(error.message)
    }
})

bot.command('kazi', async ctx => {
    try {
        let all = await pipyModel.find().select('chatid username').limit(10000)
        await ctx.reply(`Unbanning ${all.length} users from X Bongo Channel`)

        all.forEach((u, i) => {
            setTimeout(() => {
                bot.api.unbanChatMember(imp.xbongo, u.chatid, { only_if_banned: true })
                    .then(() => console.log(`✅ ${u?.username} unbanned (${i+1})`))
                    .catch(e => console.log(e?.message))
            }, i * 40) //unbanning 25 people per second!
        })
    } catch (error) {
        console.log(error?.message)
    }
})

bot.on('message::url', async (ctx, next) => {
    try {
        if (ctx.message?.text && !ctx.message?.reply_to_message) {
            let txt = ctx.message.text
            let nkiris = ['.mkv', ' | ', 'dramastore.net']
            let rand = `${Math.trunc((Math.random() * 9999999))}`

            //check if nkiris
            if (nkiris.every(nk => txt.includes(nk))) {
                let [durl, fname] = txt.split(' | ')
                //check if durl is in last, make it first
                if (!durl.includes('https://')) {
                    durl = txt.split(' | ')[1].trim()
                    fname = txt.split(' | ')[0].trim()
                }
                await uploadingDramastore(ctx, durl.trim(), fname.trim(), InputFile, 'thumb')
            }

            //check if others
            if (!txt.includes('dramastore.net') && txt.includes(' | ')) {
                await ctx.reply('Other than dramastore detected')
            }

            //if videos i.e doesnt includes ' | '
            if (!txt.includes(' | ')) {
                let fname = `${rand}.mp4`
                //bzzs trailers
                if (txt.includes('prog-public')) {
                    fname = `${rand}.mkv`
                }
                await uploadingVideos(ctx, txt, fname, InputFile)
            }
        } else {
            next()
        }
    } catch (error) {
        await ctx.reply(error.message)
        console.error(error)
    }
})

bot.on('message:text', async ctx => {
    try {
        if (ctx.message?.reply_to_message && ctx.message.reply_to_message?.document) {
            let fname = ctx.message.text
            if (!fname.includes('.mkv') && !fname.includes('.mp4')) {
                if (fname.toLowerCase() == "link") {
                    //downloading the file
                    let dwding = await ctx.reply('Downloading... ⏳', { reply_parameters: { message_id: ctx.message.reply_to_message.message_id } })
                    let file = await ctx.api.getFile(ctx.message.reply_to_message.document.file_id)

                    //copy the file to our bot disk
                    let fname = ctx.message.reply_to_message.document?.file_name
                    let encd_fname = encodeURIComponent(fname)
                    let fpath = path.join(__dirname, 'public', fname)
                    await file.download(fpath)
                    let lnk = `Download Link:\nhttp://188.166.85.43:3000/download/${encd_fname}`
                    await ctx.api.editMessageText(ctx.chat.id, dwding.message_id, lnk)
                    await ctx.deleteMessage()
                } else { await ctx.reply('Not correct file name') }
            } else {
                //download the file
                let dwnd = await ctx.reply('Downloading the file... ⏳', {
                    reply_parameters: { message_id: ctx.message.reply_to_message.message_id }
                })
                let file = await ctx.api.getFile(ctx.message.reply_to_message.document.file_id)

                //path to save the file
                let fpath = path.join(__dirname, 'public', fname)

                //thumbnail path
                let thumb_path = path.join(__dirname, 'public', "thumb.jpeg")

                //download the file (move file from telegram bin to our bot with new file name)
                await file.download(fpath)

                //upload the file to telegram
                let upld = "✅ Finished download. Now uploading... ⏳"
                await ctx.api.editMessageText(ctx.chat.id, dwnd.message_id, upld)
                await ctx.replyWithDocument(new InputFile(fpath), {
                    thumbnail: new InputFile(thumb_path),
                    caption: "Uploaded by @shemdoe"
                })

                //delete the file from disk
                await ctx.deleteMessage()
                await ctx.api.deleteMessage(ctx.chat.id, dwnd.message_id)
                await fs.promises.unlink(fpath)
            }
        }
    } catch (error) {
        await ctx.reply(error.message)
        console.log(error)
    }
})

bot.on('business_message', async ctx => {
    try {
        let bizcon = await ctx.getBusinessConnection()
        console.log(ctx.businessMessage.chat.id)
    } catch (error) {
        console.error(error)
    }
})


bot.start()

app.get('/', (req, res) => {
    res.json({ ok: true, port: 3000 })
})

app.get('/pp/proxy', async (req, res)=> {
    let apis = await mtproAPI(bot)
    res.send(apis)
})

app.get('/download/:fname', async (req, res) => {
    try {
        let fname = decodeURIComponent(req.params.fname)
        let fpath = path.join(__dirname, 'public', fname)
        res.download(fpath, fname)
    } catch (error) {
        await bot.api.sendMessage(imp.shemdoe, error.message)
        console.error(error)
    }
})

setInterval(() => { 
    //
}, 60000 * 60 * 3) //every 3 hours


process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

process.on('unhandledRejection', (reason, promise) => {
    bot.api.sendMessage(imp.shemdoe, reason + ' It is an unhandled rejection.')
    console.log(reason)
    //on production here process will change from crash to start cools
})

//caught any exception
process.on('uncaughtException', (err) => {
    console.log(err)
    bot.api.sendMessage(741815228, err.message + ' - It is ana uncaught exception.')
        .catch((err) => {
            console.log(err.message + ' while sending you')
            process.exit()
        })
})

app.listen(process.env.PORT || 3000, () => console.log('connected to port 3000'))