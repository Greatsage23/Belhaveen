import 'server-only';
import pg from 'pg';
const globalDb=globalThis as unknown as {bmsPool?:pg.Pool};
export function pool(){if(!process.env.DATABASE_URL)throw new Error('Database setup is required. Contact the school administrator.');return globalDb.bmsPool??=(new pg.Pool({connectionString:process.env.DATABASE_URL,max:4,connectionTimeoutMillis:10000}));}
export async function query(text:string,params:unknown[]=[]){return (await pool().query(text,params)).rows;}
export async function transaction<T>(fn:(client:pg.PoolClient)=>Promise<T>){const client=await pool().connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
export async function audit(id:string,action:string,target:string){await query('INSERT INTO bms_audit(actor_id,action,target) VALUES($1,$2,$3)',[id,action,target]);}
