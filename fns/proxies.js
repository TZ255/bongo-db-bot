const axios = require('axios').default
const sortArray = require('sort-array')
const nyumbuModel = require('../database/chats')
const dayoModel = require('../database/dayo-users')

const mtproAPI = async (bot) => {
    try {
        let protoAPI = `https://mtpro.xyz/api/?type=mtproto`

        let all_proxies = await axios.get(protoAPI)
        let proxies = all_proxies.data
        let sorted_proxies = sortArray(proxies, {by: 'addTime', order: 'desc'})
        for(let p of sorted_proxies.slice(0,3)) {
            let tgpx = `Connect:\ntg://proxy?server=${p.host}&port=${p.port}&secret=${p.secret}&bot=@pilau_bot`
            await bot.api.sendMessage(5849160770, tgpx)
        }
        return sorted_proxies
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    mtproAPI
}