export function formateMessageTime(date){
return new Date(date).toLocaleTimeString("en-US",{
    hour:"2-digit",
    minute:"2-digit",
    hour24:false,
})
}