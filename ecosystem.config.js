module.exports = {
  apps: [
    {
      name: "bongo-db",
      script: "./bot.js",
      watch: true,
      ignore_watch : ["./public", "*.log", "*.jpeg"],
    }
  ]
}
