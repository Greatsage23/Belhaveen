import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Belhaven | Assessment Record Management',description:'Belhaven Montessori School assessment management portal',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
