import jwt from 'jsonwebtoken'


export const generateToken = ({
    publicClaims,
    registeredClaims,
    secretKey=process.env.JWT_SECRET
}) => {
    return jwt.sign(publicClaims, secretKey,registeredClaims)
}



export const verifyToken = ({token, secretKey=process.env.JWT_SECRET}) => {
    return jwt.verify(token, secretKey)
}   