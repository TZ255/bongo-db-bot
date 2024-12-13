const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tikSchema = new Schema({
    uniq_id: {
        type: String,
    },
    videos_id: {
        type: Array
    }
}, {strict: false, timestamps: true })

const model = mongoose.model('Bongo Tiktokers', tikSchema)
module.exports = model