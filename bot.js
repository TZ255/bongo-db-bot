const { Bot } = require('grammy')
const { autoRetry } = require("@grammyjs/auto-retry");
const axios = require('axios').default
const cheerio = require('cheerio')
require('dotenv').config()
const mongoose = require('mongoose')
const puppeteer = require('puppeteer')

const bot = new Bot(process.env.BOT_TOKEN)

mongoose.connect(`mongodb://${process.env.USER}:${process.env.PASS}@nodetuts-shard-00-00.ngo9k.mongodb.net:27017,nodetuts-shard-00-01.ngo9k.mongodb.net:27017,nodetuts-shard-00-02.ngo9k.mongodb.net:27017/ohmyNew?ssl=true&replicaSet=atlas-pyxyme-shard-0&authSource=admin&retryWrites=true&w=majority`)
    .then(() => {
        console.log('Connected to database')
    }).catch((err) => {
        console.log(err)
        bot.telegram.sendMessage(741815228, err.message)
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

bot.api.deleteWebhook({ drop_pending_updates: true })

var bulk_txts = ``

bot.command('start', async (ctx) => {
    try {
        await ctx.reply('starting')
    } catch (error) {
        console.log(err.message)
    }
})

const runPupp = async (browser, ctx, link) => {
    try {
        //open page
        const page = await browser.newPage();

        // Delete all cookies to start afresh
        const cookies = await page.cookies();
        await page.deleteCookie(...cookies);

        // Enable request interception to prevent file download
        await page.setRequestInterception(true);

        // Listen to all network requests
        page.on('request', async (request) => {
            if (request.url().endsWith(".mkv") && request.url().includes("/d/")) {
                //get dname frm lnk eg https://dl.com/dkd/The.Auditors.E04.(NKIRI.COM).mkv.html
                let drama = link.split('/').pop() //remove last item and return it
                drama = drama.replace('.(NKIRI.COM)', 'SHEMDOE').replace('_(NKIRI.COM)', 'SHEMDOE').split('SHEMDOE')[0]
                let epno = drama.split('.').pop()
                drama = drama.replace(`.${epno}`, '')
                let n2 = `${epno}.${drama}`.substring(0, 30)
                let txt = `[dramastore.net] ${n2}.540p.NK.mkv | ${request.url()}\n`
                bulk_txts = bulk_txts + txt
                console.log(`${n2} found ✅`)
                //ctx.reply(txt).catch(e => console.log(e.message))
                request.abort(); // Abort the request to prevent the file from downloading
            } else {
                request.continue(); // Continue all other requests
            }
        });

        // Go to the link
        await page.goto(link, { waitUntil: 'domcontentloaded' });

        // Click the "Create download link" button
        let btn = await page.waitForSelector('#commonId #downloadbtn');
        await btn.click();

        //Wait for the specific request
        await Promise.all([
            page.waitForRequest(req =>
                req.url().endsWith(".mkv") && req.url().includes("/d/"),
                { timeout: 160000 }
            )
        ]);
    } catch (error) {
        console.log(error.message)
    }
}

bot.command('nkiri', async ctx => {
    //empty bulktexts
    bulk_txts = ''
    try {
        if (ctx.match && [imp.shemdoe, imp.halot, imp.bberry, imp.airt].includes(ctx.chat.id)) {
            let url = ctx.match.trim()

            //go to drama page
            let html = (await axios.get(url)).data
            let $ = cheerio.load(html)
            let links = $(`.elementor-button-wrapper a`)

            let linksArr = []
            let nkiserv = 'starting\n\n'
            links.each((i, a) => {
                let href = $(a).attr('href')
                if (href && href.includes('https://downloadwella.com/') || href.includes('https://wetafiles.com/')) {
                    linksArr.push(href);
                    console.log(href)
                } else if (href && href.includes('.nkiserv.com')) {
                    let dname = href.split('/TV/')[1].split('.(NKIRI.COM)')[0]
                    let eps = dname.split('.').pop()
                    let drama = dname.replace(`.${eps}`, '').replace('.Owner.of.the.Mask', '')
                    let final = `[dramastore.net] ${eps}.${drama}.540p.NK.mkv | ${href}\n\n`
                    nkiserv = nkiserv + final
                }
            })
            await ctx.reply(nkiserv)

            if (linksArr.length > 0) {
                //open browser
                const browser = await puppeteer.launch()
                for (let [index, link] of linksArr.entries()) {
                    await runPupp(browser, ctx, link)
                    //divide link in 10 groups. for each 10 clear bulk texts
                    if ((index + 1) % 10 == 0) {
                        await ctx.reply(bulk_txts)
                        bulk_txts = ''
                    }
                }
                await ctx.reply(bulk_txts)
                //close browser
                await browser.close();
            }
        }
    } catch (error) {
        await ctx.reply(error.message)
    }
});





//pupp2 url uploader
const runPupp2 = async (browser, ctx, link) => {
    try {
        //open page
        const page = await browser.newPage();

        // Delete all cookies to start afresh
        const cookies = await page.cookies();
        await page.deleteCookie(...cookies);

        // Enable request interception to prevent file download
        await page.setRequestInterception(true);

        // Listen to all network requests
        page.on('request', async (request) => {
            if (request.url().endsWith(".mkv") && request.url().includes("/d/")) {
                //get dname frm lnk eg https://dl.com/dkd/The.Auditors.E04.(NKIRI.COM).mkv.html
                let drama = link.split('/').pop() //remove last item and return it
                drama = drama.replace('.(NKIRI.COM)', 'SHEMDOE').replace('_(NKIRI.COM)', 'SHEMDOE').split('SHEMDOE')[0]
                let epno = drama.split('.').pop()
                drama = drama.replace(`.${epno}`, '')
                let n2 = `${epno}.${drama}`.substring(0, 30)
                let txt = `${request.url()} | [dramastore.net] ${n2}.540p.NK.mkv\n`
                console.log(n2 + ` found ✅`)
                ctx.reply(txt).catch(e => console.log(e.message))
                request.abort(); // Abort the request to prevent the file from downloading
            } else {
                request.continue(); // Continue all other requests
            }
        });

        // Go to the link
        await page.goto(link, { waitUntil: 'domcontentloaded' });

        // Click the "Create download link" button
        let btn = await page.waitForSelector('#commonId #downloadbtn');
        await btn.click();

        //Wait for the specific request
        await Promise.all([
            page.waitForRequest(req =>
                req.url().endsWith(".mkv") && req.url().includes("/d/"),
                { timeout: 15000 }
            )
        ]);
    } catch (error) {
        console.log(error.message)
    }
}

//nkiri for pop2
bot.command('nkiri2', async ctx => {
    try {
        if (ctx.match && [imp.shemdoe, imp.halot, imp.bberry, imp.airt].includes(ctx.chat.id)) {
            let url = ctx.match.trim()

            //go to drama page
            let html = (await axios.get(url)).data
            let $ = cheerio.load(html)
            let links = $(`.elementor-button-wrapper a`)

            let linksArr = []
            let nkiserv = 'starting\n\n'
            links.each((i, a) => {
                let href = $(a).attr('href')
                if (href && href.includes('https://downloadwella.com/') || href.includes('https://wetafiles.com/')) {
                    linksArr.push(href);
                    console.log(href)
                }
            })
            await ctx.reply(nkiserv)

            if (linksArr.length > 0) {
                //open browser
                const browser = await puppeteer.launch()
                for (let [index, link] of linksArr.entries()) {
                    await runPupp2(browser, ctx, link)
                }
                await browser.close();
            }
        }
    } catch (error) {
        await ctx.reply(error.message)
    }
});

//nkiri for last one episode
bot.command('last', async ctx => {
    try {
        if (ctx.match && [imp.shemdoe, imp.halot, imp.bberry, imp.airt].includes(ctx.chat.id)) {
            let url = ctx.match.trim()

            //go to drama page
            let html = (await axios.get(url)).data
            let $ = cheerio.load(html)
            let links = $(`.elementor-button-wrapper a`)

            let linksArr = []
            let nkiserv = 'starting\n\n'
            links.each((i, a) => {
                let href = $(a).attr('href')
                if (href && href.includes('https://downloadwella.com/') || href.includes('https://wetafiles.com/')) {
                    if (i > links.length - 3) {
                        linksArr.push(href);
                        console.log(href)
                    }
                }
            })
            await ctx.reply(nkiserv)

            if (linksArr.length > 0) {
                //open browser
                const browser = await puppeteer.launch()
                for (let [index, link] of linksArr.entries()) {
                    await runPupp2(browser, ctx, link)
                }
                await browser.close();
            }
        }
    } catch (error) {
        await ctx.reply(error.message)
    }
});

bot.on('business_message', async ctx=> {
    try {
        let bizcon = await ctx.getBusinessConnection()
        console.log(ctx.businessMessage.chat.id)
    } catch (error) {
        console.error(error)
    }
})


bot.start()


process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

process.on('unhandledRejection', (reason, promise) => {
    bot.telegram.sendMessage(imp.shemdoe, reason + ' It is an unhandled rejection.')
    console.log(reason)
    //on production here process will change from crash to start cools
})

//caught any exception
process.on('uncaughtException', (err) => {
    console.log(err)
    bot.telegram.sendMessage(741815228, err.message + ' - It is ana uncaught exception.')
        .catch((err) => {
            console.log(err.message + ' while sending you')
            process.exit()
        })
})