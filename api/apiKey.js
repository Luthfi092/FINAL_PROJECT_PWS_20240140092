const crypto=require('crypto'); const db=require('./db');
function generateApiKey(){return 'mk_live_'+crypto.randomBytes(24).toString('hex')}
function hashKey(key){return crypto.createHash('sha256').update(key).digest('hex')}
async function requireApiKey(req,res,next){const raw=req.headers['x-api-key'];if(!raw)return res.status(401).json({success:false,message:'Header x-api-key diperlukan'});const r=await db.query('SELECT id,user_id FROM api_keys WHERE key_hash=$1 AND revoked_at IS NULL',[hashKey(raw)]);if(!r.rows.length)return res.status(401).json({success:false,message:'API key tidak valid atau sudah dicabut'});req.apiKey=r.rows[0];next()}
module.exports={generateApiKey,hashKey,requireApiKey};
