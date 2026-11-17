import {defineConfig} from 'vite';

// Development/preview only. Production uses the container Nginx configuration.
// Preserve browser Origin for CSRF checks; never disable upstream TLS verification.
const target = process.env.RUST_API_ORIGIN || 'http://127.0.0.1:4180';
const proxy = {
  '/api': {target, changeOrigin:false, secure:true},
  '/health': {target, changeOrigin:false, secure:true},
};
const allowedHosts = ['localhost','imtsmartteens.my.id'];
export default defineConfig({
  base:'/',
  plugins:[{
    name:'source-spa-entry',
    configureServer(server){
      server.middlewares.use((req,_res,next)=>{
        if(req.headers.accept?.includes('text/html') && !req.url?.startsWith('/api/') &&
           !req.url?.startsWith('/health/') && !/\.[a-z0-9]+(?:\?|$)/i.test(req.url??'')) req.url='/app.html';
        next();
      });
    },
  }],
  build:{rollupOptions:{input:'app.html'}},
  server:{host:'127.0.0.1',port:Number(process.env.VITE_DEV_PORT||5173),strictPort:true,allowedHosts,proxy},
  preview:{host:'127.0.0.1',port:Number(process.env.VITE_DEV_PORT||5173),strictPort:true,allowedHosts,proxy},
});
