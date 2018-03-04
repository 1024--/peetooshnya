'use strict';

var preprocess = require('./varprepr');

function getTypes(variables) {
    var types = [];
    variables.forEach(function(v) {
      while(v.id2.typeid + 1 > types.length) types.push({
        name: '',
        count: 0,
        vname: 'v' + types.length
      });
      types[v.id2.typeid].count ++;
      types[v.id2.typeid].name = v.type;
    });
  return types;
}

var dynamicC = {
  'begin': function(variables) {
    var types = getTypes(variables);
    
    return types.map(function(t) {
     return t.name + '* ' + t.vname + ' = malloc(' +
       t.count + ' * sizeof(' + t.name + '));'
    }).concat(types.map(function(t){
      return 'if(' + t.vname + ' == NULL) exit(1);';
    })).join(' ');
  },
  'end': function(variables) {
    var types = getTypes(variables);
    
    return types.map(function(t) {
      return 'free(' + t.vname + ');';
    }).join(' ');
  },
  'use': function(variable) {
    return 'v' + variable.id2.typeid + '[' + variable.id2.id + ']';
  }
};

var code = `
#include<stdio.h>

int main() {
  ~begin
  ~def i:int
  // int#1 busy
  i = 2;
  printf('%d', i);
  
  ~def i:float
  // int#0 busy, float#1 busy
  i = 8.;
  printf('%d', i);
  ~undef i
  // int#0 busy, float#1 free
  
  printf('%d', i);
  ~undef i
  // int#0 free, float#1 free
  
  ~def x:float y:float
  // int#0 free, float#1 busy, float#2 busy
  x = 0.5;
  y = 0.8;
  printf("%g", x + y);
  
  ~def y:float
  // int#0 free, float#1 busy, float#2 busy, float#3 busy
  
  {
    ~begin
    ~def x:float y:int z:char
    // float#0 busy, int#1 busy, char#0 busy
    x = 0.1;
    printf("%g", x);
    ~end
  }
  
  ~undef y y x
  // int#0 free, float#1 free, float2 free, float#3 free
  ~def x:int y:int
  // int#0 busy, float#1 free, float#2 free, float#3 free, int#4 busy

  y = 8;
  ~end
}

`;

console.log(preprocess(code, 'C'));
console.log(preprocess(code, dynamicC));
