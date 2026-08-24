const jwt=require('jsonwebtoken');
function signToken(user){return jwt.sign({sub:user.id,email:user.email,name:user.name},process.env.JWT_SECRET,{expiresIn:'2h'});}
function requireJWT(req,res,next){const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return res.status(401).json({success:false,message:'JWT Bearer token diperlukan'});try{req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET);next()}catch{return res.status(401).json({success:false,message:'JWT tidak valid atau expired'})}}
module.exports={signToken,requireJWT};
