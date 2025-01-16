const axios = require('axios').default
const fs = require('fs')
const path = require('path')
const https = require('https');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(stderr || err.message);
            } else {
                resolve(stdout);
            }
        });
    });
};

const uploadingDramastore = async (ctx, durl, fname, InputFile, thumb) => {
    try {
        let starting = await ctx.reply('Dramastore file - downloading ⏳');

        let fpath = path.join(__dirname, '..', 'public', fname);
        let thumb_path = path.join(__dirname, '..', 'public', `${thumb}.jpeg`);

        let response = await axios.get(durl, {
            responseType: 'stream',
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        const writer = fs.createWriteStream(fpath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            let finish = 'Download Finished ✅ \nNow Uploading & Editing Metadata ⏳';
            await ctx.api.editMessageText(ctx.chat.id, starting.message_id, finish);

            const isMKV = path.extname(fname).toLowerCase() === '.mkv';

            try {
                if (isMKV) {
                    // Step 1: Edit global container metadata
                    await execPromise(`mkvpropedit "${fpath}" --edit info --set "title=Downloaded from DRAMASTORE.NET"`);
                    console.log(`Container metadata updated for ${fname}`);

                    // Step 2: Edit track-level metadata (video track)
                    await execPromise(`mkvpropedit "${fpath}" --edit track:1 --set "name=Downloaded from DRAMASTORE.NET"`);
                    console.log(`Track 1 metadata name updated for ${fname}`);
                } else {
                    // Fallback to ffmpeg for MP4 and others
                    await new Promise((resolve, reject) => {
                        ffmpeg.setFfmpegPath(ffmpegPath);
                        ffmpeg(fpath)
                            .outputOptions('-c', 'copy')  // Copy streams (no re-encoding)
                            .outputOptions('-metadata', 'title=Downloaded from DRAMASTORE.NET')
                            .saveToFile(fpath)
                            .on('end', resolve)
                            .on('error', (err) => {
                                console.error('FFmpeg Error:', err);
                                reject(err);
                            });
                    });
                }

                // Upload the file to Telegram
                await ctx.replyWithDocument(new InputFile(fpath), {
                    thumbnail: new InputFile(thumb_path),
                    caption: fname
                });

                // Cleanup
                await ctx.api.deleteMessage(ctx.chat.id, starting.message_id);
                fs.unlinkSync(fpath);

            } catch (error) {
                console.error('Metadata Update Error:', error);
                ctx.reply('Error during metadata update.').catch(e => console.log(e?.message));
            }
        });

        writer.on('error', (err) => {
            console.error('File Download Error:', err);
            ctx.reply('Failed to download the file.').catch(e => console.log(e?.message));
        });
    } catch (error) {
        await ctx.reply(error.message);
    }
};

const uploadingVideos = async (ctx, durl, fname, InputFile) => {
    try {
        //starting
        let starting = await ctx.reply('Video link detected and downloading... ⏳')

        //because public folder is in root and we are in subdirectory, we go back with '..'
        let fpath = path.join(__dirname, '..', 'public', fname)
        let thumb_path = path.join(__dirname, '..', 'public', `${fname}_thumb.jpg`)

        //video dimensions... will be modifided by ffmpeg
        let v_width = 320
        let v_height = 180

        let response = await axios.get(durl, {
            responseType: 'stream',
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        })

        //console response headers
        console.log(response.headers['content-disposition'])

        //save file locally
        const writer = fs.createWriteStream(fpath)

        //pipe the file
        response.data.pipe(writer);

        writer.on('finish', async () => {
            let finish = 'Download Finished. Now uploading...'
            await ctx.api.editMessageText(ctx.chat.id, starting.message_id, finish)

            // Generate the thumbnail
            await new Promise((resolve, reject) => {
                ffmpeg(fpath)
                    .on('end', resolve)
                    .on('error', reject)
                    .screenshots({
                        timestamps: ['50%'],
                        filename: `${fname}_thumb.jpg`,
                        folder: path.dirname(thumb_path),
                        size: '320x180'
                    });
            })

            let duration = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(fpath, (err, metadata) => {
                    if (err) { return reject(err) }
                    let dur = metadata.format.duration
                    resolve(dur)
                })
            })

            let dimensions = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(fpath, (err, metadata) => {
                    if (err) { reject(err) } else {
                        let vid = metadata.streams.find(stream => stream?.codec_type == 'video')
                        if (vid) {
                            v_width = vid.width
                            v_height = vid.height
                            resolve(vid)
                        } else {
                            ctx.reply('The file has no video stream... height and width of video will be sent with default values ie 320x180')
                            resolve({ width: 320, height: 180 })
                        }
                    }
                })
            })

            // Upload the video to Telegram
            await ctx.replyWithVideo(new InputFile(fpath), {
                thumbnail: new InputFile(thumb_path),
                duration: duration,
                supports_streaming: true,
                width: v_width, height: v_height
            })
            await ctx.api.deleteMessage(ctx.chat.id, starting.message_id)
            fs.unlinkSync(fpath); // Optionally delete the file after upload
            fs.unlinkSync(thumb_path); // Optionally delete the file after upload
        });

        writer.on('error', err => {
            console.error('Error writing the video:', err);
            ctx.reply('Failed to writing the video.');
        });
    } catch (error) {
        await ctx.reply(error.message)
    }
}

module.exports = {
    uploadingDramastore, uploadingVideos
}