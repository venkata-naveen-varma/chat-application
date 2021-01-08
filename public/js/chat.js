const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locaionMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room}= Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild
    // Height of new msg
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // Visible height
    const visibleHeight = $messages.offsetHeight
    // Heights of messages container
    const containerHeight = $messages.scrollHeight
    // How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


// welcome msg
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//Sending location
socket.on('locationMessage', (message) => {
    const html = Mustache.render(locaionMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// sending a msg
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // Disable a button
    $messageFormButton.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value // e.target.elements contains form data we can access using a name like message
    
    socket.emit('sendMessage', msg, (error) => {
        //enable a button
        $messageFormButton.removeAttribute('disabled')
        //clear input field in the form
        $messageFormInput.value = ''
        $messageForm.focus()

        if(error){
            return console.log(error)
        }
        console.log('The message is delivered!')
    })
})
// sending location
$sendLocationButton.addEventListener('click', () => {
    //disable the button
    $sendLocationButton.setAttribute('disabled', 'disabled')

    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        latitude = position.coords.latitude
        longitude = position.coords.longitude
        socket.emit('sendLocation', {latitude, longitude}, () => {
            //enable a button
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href='/'
    }
})