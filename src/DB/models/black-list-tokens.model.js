import mongoose from "mongoose"


const blacklistTokenSchema = new mongoose.Schema({
    tokenId: {type: String, required: true},
    expiresAt: {type: String, required: true},
})

const BlacklistToken = mongoose.models.BlacklistToken || mongoose.model('BlacklistToken', blacklistTokenSchema)

export  {BlacklistToken}