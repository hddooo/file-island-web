/* Reuse only the definitions audited in docs/glossary-verification.md.
 * This is a small exact-emphasis glossary, not full source annotation. */
(function(root){
  'use strict';
  const pdf='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
  const opening='255c37fb68122a329cca00ae1c15035590b6a7b21f601e4a5b5f7515fdfbf695';
  const ids={prehistory:['tteonseokgi','bitsal','goindol','sachuldo','yeonggo','jegahoeui','seookje','sodo','cheongun'],samguk:['golpum','yukdupum','yullyeong','taehak'],nambuk:['golpum','yukdupum','nogeup','gwallyojeon'],opening:['hopo','sachang','dangbaek','cheokhwa','byeolgigun','jipgangso','hongbeom','danbal','gwangmu','tonggambu'],colonial:['hoesa','sanmi','changssi'],modern:['nongji','sasaoip','gingeup','silmyeong']};
  function data(){
    const entries=[],sources={};
    for(const [era,allowed] of Object.entries(ids)){
      sources[era]=era==='opening'?opening:pdf;
      for(const e of root.HANQ_GLOSSARY||[]){
        if(!allowed.includes(e.id)||!e.short||Array.from(e.short).length>150||!e.sources?.length||!e.sources.every(s=>/^https:\/\/(encykorea\.aks\.ac\.kr|contents\.history\.go\.kr)\//.test(s.url)))continue;
        for(const phrase of e.match||[e.term])entries.push({id:era+'-glossary-'+e.id,era,phrase,summary:e.short,sources:e.sources.map(s=>s.url)});
      }
    }
    return {sources,entries};
  }
  function pageEra(page){const n=page.pdfPage;return n>=8&&n<=15?'prehistory':n>=16&&n<=30?'samguk':n>=31&&n<=40?'nambuk':n>=108&&n<=125?'colonial':n>=126&&n<=139?'modern':null;}
  function mount(host,era,source){return root.HanqHistory81Terms&&ids[era]?root.HanqHistory81Terms.mount(host,era,source,data()):{count:0,stop(){}};}
  root.HanqHistory81Glossary={mount,pageEra,data};
})(typeof window==='object'?window:globalThis);
