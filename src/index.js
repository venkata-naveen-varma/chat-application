const express = require('express')
const path = require('path')
const http = require('http'
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = new express()
const server = http.createServer(app) // This is done behind the scenes by express but we explicitly called to use in socketio
const io = socketio(server)

const port = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => { // to connect.

    // socket.broadcast.emit('message', generateMessage('A new user has joined!')) // To emit to everyone except for a particular connection.

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})

        if(error){
            return callback(error)
        }

        socket.join(user.room) //sends msgs to a specific room


        socket.emit('message', generateMessage('Admin', 'Welcome!')) //To emit to that particular connection.
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)) // To emit to everyone in a room except for a particular connection.
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)

        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, msg))
        //io.emit('message', generateMessage(msg)) // To emit to everyone
        callback()
    })

    socket.on('sendLocation', (location, callback) => { // for location
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })

    socket.on('disconnect', () => { // To disconnect.
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server. listen(port, () => {
    console.log("Server is up on port "+port)
})
