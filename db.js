const mongoose=require('mongoose')
async function connectMongodb(url){
    return mongoose.connect(url)
    .then(() => console.log(new Date().toISOString()+": Mongodb connected"))
    .catch(err => console.log("error", err))
}

module.exports ={
    connectMongodb,
}