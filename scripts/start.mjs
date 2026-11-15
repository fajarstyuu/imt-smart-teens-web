let running=false;
const port=process.env.PORT||'4174';
try {const response=await fetch(`http://127.0.0.1:${port}/api/bootstrap`,{signal:AbortSignal.timeout(1000)});const body=await response.json();running=response.ok&&body.config?.brand==='Imt Smart Teens';}catch{}
if(running)console.log(`Imt Smart Teens is already running at http://127.0.0.1:${port}`);
else await import('../server/development.mjs');
