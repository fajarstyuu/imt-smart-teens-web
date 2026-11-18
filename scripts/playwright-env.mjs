const DEFAULT_VITE_PORT=5173;
const DEFAULT_RUST_API_ORIGIN='http://127.0.0.1:4180';

function readPort(name,value){
 if(value===undefined||value==='')return undefined;
 const port=Number(value);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error(`${name} must be an integer port from 1 to 65535`);
 return port;
}

function parseOrigin(name,value,protocols=['http:']){
 if(value===undefined||value==='')return undefined;
 let url;
 try{url=new URL(value);}catch{throw new Error(`${name} must be an absolute HTTP${protocols.includes('https:')?' or HTTPS':''} origin`);}
 if(!protocols.includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error(`${name} must be an HTTP${protocols.includes('https:')?' or HTTPS':''} origin without credentials, path, query or fragment`);
 return {origin:url.origin,port:Number(url.port||(url.protocol==='https:'?443:80))};
}

function resolveConsistentPort(inputs){
 const provided=inputs.filter(([,value])=>value!==undefined);
 const values=new Set(provided.map(([,value])=>value));
 if(values.size>1)throw new Error(`Conflicting frontend port settings: ${provided.map(([name,value])=>`${name}=${value}`).join(', ')}`);
 return provided[0]?.[1]??DEFAULT_VITE_PORT;
}

export function resolveRunnerEnvironment(env=process.env){
 const e2e=parseOrigin('E2E_ORIGIN',env.E2E_ORIGIN?.trim());
 const vitePort=resolveConsistentPort([
  ['VITE_DEV_PORT',readPort('VITE_DEV_PORT',env.VITE_DEV_PORT?.trim())],
  ['E2E_ORIGIN port',e2e?.port],
  ['PORT',readPort('PORT',env.PORT?.trim())],
 ]);
 const canonicalApi=parseOrigin('RUST_API_ORIGIN',env.RUST_API_ORIGIN?.trim(),['http:','https:']);
 const aliasApi=parseOrigin('RUST_API_URL',env.RUST_API_URL?.trim(),['http:','https:']);
 if(canonicalApi&&aliasApi&&canonicalApi.origin!==aliasApi.origin)throw new Error(`Conflicting API origin settings: RUST_API_ORIGIN=${canonicalApi.origin}, RUST_API_URL=${aliasApi.origin}`);
 const rustApiOrigin=canonicalApi?.origin??aliasApi?.origin??DEFAULT_RUST_API_ORIGIN;
 const testOrigin=e2e?.origin??`http://127.0.0.1:${vitePort}`;
 if(e2e&&e2e.port!==vitePort)throw new Error(`E2E_ORIGIN port ${e2e.port} does not match resolved Vite port ${vitePort}`);
 return {vitePort,testOrigin,rustApiOrigin};
}
