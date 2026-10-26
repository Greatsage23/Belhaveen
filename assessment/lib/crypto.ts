import {scrypt as rawScrypt,randomBytes,timingSafeEqual,createHmac} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(rawScrypt);
export async function hash(password:string){if(password.length<12||password.length>128)throw new Error('Use a password of 12–128 characters');const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt}:${key.toString('hex')}`;}
export async function verify(password:string,stored:string){const [algorithm,salt,digest]=stored.split(':');if(algorithm!=='scrypt'||!salt||!digest||password.length>128)return false;const actual=await scrypt(password,salt,64) as Buffer;const expected=Buffer.from(digest,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}
export function signature(value:string,secret:string){return createHmac('sha256',secret).update(value).digest('base64url');}
export function constant(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
