const express = require("express")
const http = require("http")
const {Server} = require("socket.io")
const OpenAI = require("openai")
require("dotenv").config()

const app = express()
const server = http.createServer(app)
const io = new Server(server)

// setup openai
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

app.use(express.static("public"))

const users = new Set()

io.on("connection", (socket) => {
    console.log("User Connected")

    // event for chat message
    socket.on("chat message", async (msg) => {
        console.log(`Message: ${msg}`)

        // send message to all users
        io.emit("chat message", `${socket.username}: ${msg}`)

      
        if(msg.startsWith("@bot")) {
            const question = msg.replace("@bot", "").trim()

            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "user", content: question }
                    ]
                })

                const botReply = response.choices[0].message.content
                io.emit("bot message", `Bot: ${botReply}`)

            } catch(err) {
                console.log(err)
                io.emit("bot message", "Bot: Sorry something went wrong.")
            }
        }
    })

    socket.on("set username", (username) => {
        socket.username = username
        users.add(username)
        io.emit("user list", Array.from(users))
    })

    // for disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.username)
        users.delete(socket.username)
        io.emit("user list", Array.from(users))
    })
})

server.listen(3000, () => {
    console.log("Server is running on Port 3000")
})
