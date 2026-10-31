import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { transform } = require('next/dist/build/swc');
const jsx = require('react/jsx-runtime');
const flush = async () => { for (let i=0; i<12; i++) await Promise.resolve(); };
async function harness(file, overrides = {}, globals = {}) {
  const state = [], refs = [], effects = [], timers = new Map();
  let cursor = 0, effectCursor = 0, refCursor = 0, timerId = 0;
  const react = {
    useState(initial) { const i=cursor++; if (!(i in state)) state[i]=typeof initial==='function'?initial():initial; return [state[i], value=>state[i]=typeof value==='function'?value(state[i]):value]; },
    useRef(value) { const i=refCursor++; return refs[i] ||= { current: value }; },
    useEffect(fn, deps) { const i=effectCursor++; const prev=effects[i]; if (!prev || deps.some((d,j)=>d!==prev.deps[j])) { prev?.cleanup?.(); effects[i]={deps,run:fn}; } },
    Suspense: 'suspense',
  };
  const base = {
    react, 'react/jsx-runtime': jsx,
    'next/navigation': { useSearchParams:()=>new URLSearchParams(''), useRouter:()=>({push(){}}) },
    'next/link': 'a', 'next/image':'img',
    'framer-motion': {motion: new Proxy({}, {get:(_,key)=>key})},
    'lucide-react': new Proxy({}, {get:()=> 'svg'}),
    '@/lib/analytics/gtag': {trackPurchase(){},trackBeginCheckout(){}},
    ...overrides,
  };
  const {code}=await transform(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const mod={exports:{}};
  const env={setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},window:{scrollTo(){}},fetch:async()=>{throw Error('offline')},...globals};
  new Function('require','module','exports',...Object.keys(env),code)(name=>{if(name in base)return base[name];return require(name);},mod,mod.exports,...Object.values(env));
  return {state,timers,render(){cursor=effectCursor=refCursor=0;let tree=mod.exports.default(); if(tree?.props?.children?.type && typeof tree.props.children.type==='function')tree=tree.props.children.type(); for(const e of effects)if(e.run){e.cleanup=e.run();delete e.run;}return tree;}};
}
function nodes(tree) { if (!tree || typeof tree!=='object')return []; return [tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)]; }
function text(tree) { if(tree==null||typeof tree==='boolean')return ''; if(typeof tree!=='object')return String(tree);return [tree.props?.children].flat(Infinity).map(text).join(' '); }
const successFile='app/success/page.jsx';
const missing=await harness(successFile);assert.match(text(missing.render()),/Order confirmation unavailable/);assert.doesNotMatch(text(missing.render()),/Thank You for Your Order/);
let purchases=0;
const receipt={_id:'abc',receiptToken:'secret',shipping:200,total:1200,customer:{name:'Test'},items:[]};
const nav={'next/navigation':{useSearchParams:()=>new URLSearchParams('orderId=abc')}};
const storage={getItem:key=>key.startsWith('burhan_order')?JSON.stringify(receipt):null,setItem(){throw Error('storage blocked')}};
const valid=await harness(successFile,{...nav,'@/lib/analytics/gtag':{trackPurchase(){purchases++;}}},{sessionStorage:storage,fetch:async()=>Response.json({order:{_id:'abc',shipping:0,total:1000}})});
valid.render();await flush();const validTree=valid.render();assert.match(text(validTree),/Thank You for Your Order/);assert.equal(valid.state[0].shipping,0);assert.equal(valid.state[0].total,1000);assert.equal(purchases,1);
const failed=await harness(successFile,nav,{sessionStorage:storage,fetch:async()=>new Response(null,{status:404})});failed.render();await flush();assert.doesNotMatch(text(failed.render()),/Thank You for Your Order/);assert.equal(failed.state[0],null);
const cart=[{_id:'p1',price:1000,quantity:1,name:'Test'}];let cleared=false;
const common={
  '@/lib/commerce/colourVariants':{cartLineKey:i=>i._id},
  '@/components/checkout/SecurityCheck':'security',
  '@/lib/contexts/CartContext':{useCart:()=>({cart,getCartTotal:()=>1000,clearCart:()=>{cleared=true;},replaceCart(){},isLoaded:true})},
  '@/hooks/useStoreSettings':{useStoreSettings:()=>({settings:{},error:'',loading:false})},
  '@/lib/commerce/shipping':{resolveShippingFee:()=>200},
  '@/lib/utils/phone':{normalizePakistaniPhone:p=>p},
};
const checkout=await harness('app/checkout/page.jsx',common,{
  crypto:{randomUUID:()=> 'test'},sessionStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}},
  fetch:async url=>Response.json(url.includes('validate')?{items:cart}:{success:true,order:{_id:'accepted-reference'}}),
});
checkout.render();await flush();const formIndex=checkout.state.findIndex(s=>s?.fullName==='');checkout.state[formIndex]={fullName:'Test',phone:'03001234567',alternatePhone:'',email:'',province:'Sindh',city:'Karachi',address:'Test street',notes:'',website:'',paymentMethod:'cod'};
const tree=checkout.render();const form=nodes(tree).find(n=>n.type==='form');assert.ok(form);await form.props.onSubmit({preventDefault(){}});assert.equal(cleared,true);assert.match(text(checkout.render()),/Order received.*accepted-reference/);
const timeout=await harness('app/checkout/page.jsx',common,{fetch:(_url,opts)=>new Promise((_resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('aborted'))))});timeout.render();for(const fn of [...timeout.timers.values()])fn();await flush();const timeoutTree=timeout.render();assert.match(text(timeoutTree),/Retry cart check/);assert.doesNotMatch(text(timeoutTree),/Checking cart/);
const retry=nodes(timeoutTree).find(n=>n.type==='button'&&text(n)==='Retry cart check');assert.ok(retry);retry.props.onClick();timeout.render();assert.ok(timeout.timers.size>0);
console.log('Actual component regressions passed: missing/unauthorized receipt, server totals, blocked storage after acceptance, cart timeout and retry.');
