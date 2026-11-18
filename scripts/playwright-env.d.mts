export interface RunnerEnvironment {
 vitePort:number;
 testOrigin:string;
 rustApiOrigin:string;
}
export function resolveRunnerEnvironment(env?:NodeJS.ProcessEnv|Record<string,string|undefined>):RunnerEnvironment;
