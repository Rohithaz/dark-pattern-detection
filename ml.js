function detectManipulativeLanguage(text){

let patterns=[
"only today",
"hurry",
"limited stock",
"don't miss",
"act now",
"exclusive deal"
]

let score=0

patterns.forEach(p=>{
if(text.includes(p)){
score++
}
})

return score

}
