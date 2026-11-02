/* Each overlay owns a lease, never a snapshot of another overlay's lock.
   New root-shell inert writers must use this helper. Local panel/snapshot inert
   state remains owned by its own component. */
(function(root){'use strict';
 var states=new WeakMap();
 function acquire(node){
  if(!node)return function(){};
  var state=states.get(node),holder={};
  if(!state){state={before:!!node.inert,holders:new Set()};states.set(node,state);}
  state.holders.add(holder);node.inert=true;
  return function release(){
   if(!state.holders.delete(holder))return;
   if(state.holders.size){node.inert=true;return;}
   states.delete(node);node.inert=state.before;
  };
 }
 root.HanqUiLocks={acquire:acquire};
})(typeof window!=='undefined'?window:globalThis);
