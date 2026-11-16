import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import config from '../vite.config';
const file=(path:string)=>{expect(existsSync(path),`${path} must exist`).toBe(true);return readFileSync(path,'utf8');};
describe('production frontend proxy boundaries',()=>{
  it('keeps Vite development proxy Origin intact, verifies TLS, and restricts allowed hosts',()=>{
    expect(config.server?.allowedHosts).toEqual(['localhost','imtsmartteens.my.id']);
    expect(config.server?.proxy?.['/api']).toMatchObject({changeOrigin:false,secure:true});
    expect(config.preview?.proxy?.['/api']).toMatchObject({changeOrigin:false,secure:true});
    expect(config.server?.host).toBe('127.0.0.1');
  });
  it('uses an immutable build image and non-root static nginx, not Vite preview',()=>{
    const text=file('Dockerfile');
    expect(text).toMatch(/FROM node:[^\n]+@sha256:[a-f0-9]{64}/);
    expect(text).toMatch(/FROM nginxinc\/nginx-unprivileged:[^\n]+@sha256:[a-f0-9]{64}/);
    expect(text).toContain('npm ci');
    expect(text).not.toContain('npm start');
    expect(text).not.toContain('vite preview');
  });
  it('preserves same-origin credentials and sanitized edge identity with an internal API upstream',()=>{
    const text=file('deploy/nginx.conf');
    expect(text).toContain('location /api/v1/');
    expect(text).toContain('client_max_body_size 1m');
    expect(text).toContain('proxy_pass http://backend:4180');
    expect(text).toContain('proxy_set_header Host $host');
    expect(text).toContain('proxy_set_header X-Real-IP $http_x_real_ip');
    expect(text).not.toMatch(/proxy_set_header\s+Origin/);
    expect(text).not.toContain('proxy_cookie_domain');
    expect(text).not.toContain('Access-Control-Allow-Origin');
    expect(text).toContain('try_files $uri $uri/ /index.html');
    expect(text).toContain('location = /healthz');
  });
  it('excludes credentials and browser authentication artifacts from image context',()=>{
    const text=file('.dockerignore');
    for(const name of ['.env','.git','.worktrees','node_modules','test-results','.superpowers'])expect(text).toContain(name);
  });
});
