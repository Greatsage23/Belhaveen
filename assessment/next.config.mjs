import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
export default {turbopack:{root},outputFileTracingRoot:root,poweredByHeader:false,async headers(){return [{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'same-origin'},{key:'Cache-Control',value:'no-store'}]}]}};
