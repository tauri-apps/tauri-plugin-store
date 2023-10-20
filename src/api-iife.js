if("__TAURI__"in window){var __TAURI_STORE__=function(t){"use strict";var e=Object.defineProperty,a=(t,a)=>{for(var n in a)e(t,n,{get:a[n],enumerable:!0})},n=(t,e,a)=>{if(!e.has(t))throw TypeError("Cannot "+a)},r=(t,e,a)=>(n(t,e,"read from private field"),a?a.call(t):e.get(t));function i(t,e=!1){return window.__TAURI_INTERNALS__.transformCallback(t,e)}a({},{Channel:()=>h,PluginListener:()=>u,addPluginListener:()=>o,convertFileSrc:()=>c,invoke:()=>l,transformCallback:()=>i});var s,h=class{constructor(){this.__TAURI_CHANNEL_MARKER__=!0,((t,e,a)=>{if(e.has(t))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(t):e.set(t,a)})(this,s,(()=>{})),this.id=i((t=>{r(this,s).call(this,t)}))}set onmessage(t){((t,e,a,r)=>{n(t,e,"write to private field"),r?r.call(t,a):e.set(t,a)})(this,s,t)}get onmessage(){return r(this,s)}toJSON(){return`__CHANNEL__:${this.id}`}};s=new WeakMap;var u=class{constructor(t,e,a){this.plugin=t,this.event=e,this.channelId=a}async unregister(){return l(`plugin:${this.plugin}|remove_listener`,{event:this.event,channelId:this.channelId})}};async function o(t,e,a){let n=new h;return n.onmessage=a,l(`plugin:${t}|register_listener`,{event:e,handler:n}).then((()=>new u(t,e,n.id)))}async function l(t,e={},a){return window.__TAURI_INTERNALS__.invoke(t,e,a)}function c(t,e="asset"){return window.__TAURI_INTERNALS__.convertFileSrc(t,e)}a({},{TauriEvent:()=>p,emit:()=>g,listen:()=>d,once:()=>y});var p=(t=>(t.WINDOW_RESIZED="tauri://resize",t.WINDOW_MOVED="tauri://move",t.WINDOW_CLOSE_REQUESTED="tauri://close-requested",t.WINDOW_CREATED="tauri://window-created",t.WINDOW_DESTROYED="tauri://destroyed",t.WINDOW_FOCUS="tauri://focus",t.WINDOW_BLUR="tauri://blur",t.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",t.WINDOW_THEME_CHANGED="tauri://theme-changed",t.WINDOW_FILE_DROP="tauri://file-drop",t.WINDOW_FILE_DROP_HOVER="tauri://file-drop-hover",t.WINDOW_FILE_DROP_CANCELLED="tauri://file-drop-cancelled",t.MENU="tauri://menu",t))(p||{});async function _(t,e){await l("plugin:event|unlisten",{event:t,eventId:e})}async function d(t,e,a){return l("plugin:event|listen",{event:t,windowLabel:a?.target,handler:i(e)}).then((e=>async()=>_(t,e)))}async function y(t,e,a){return d(t,(a=>{e(a),_(t,a.id).catch((()=>{}))}),a)}async function g(t,e,a){await l("plugin:event|emit",{event:t,windowLabel:a?.target,payload:e})}return t.Store=class{constructor(t){this.path=t}async set(t,e){return await l("plugin:store|set",{path:this.path,key:t,value:e})}async get(t){return await l("plugin:store|get",{path:this.path,key:t})}async has(t){return await l("plugin:store|has",{path:this.path,key:t})}async delete(t){return await l("plugin:store|delete",{path:this.path,key:t})}async clear(){return await l("plugin:store|clear",{path:this.path})}async reset(){return await l("plugin:store|reset",{path:this.path})}async keys(){return await l("plugin:store|keys",{path:this.path})}async values(){return await l("plugin:store|values",{path:this.path})}async entries(){return await l("plugin:store|entries",{path:this.path})}async length(){return await l("plugin:store|length",{path:this.path})}async load(){return await l("plugin:store|load",{path:this.path})}async save(){return await l("plugin:store|save",{path:this.path})}async onKeyChange(t,e){return await d("store://change",(a=>{a.payload.path===this.path&&a.payload.key===t&&e(a.payload.value)}))}async onChange(t){return await d("store://change",(e=>{e.payload.path===this.path&&t(e.payload.key,e.payload.value)}))}},t}({});Object.defineProperty(window.__TAURI__,"store",{value:__TAURI_STORE__})}
