function BfVM(){
  this.length = 32768;
  this.mem = Array(this.length);
  for(var i=0; i<this.length; ++i) this.mem[i] = 0;
  this.p = 0;
}

BfVM.prototype.run = function(c){
  switch(c){
  case '+':
    ++ this.mem[this.p];
    if(this.mem[this.p] > 0xff) this.mem[this.p] = 0;
    break;
  case '-':
    -- this.mem[this.p];
    if(this.mem[this.p] < 0) this.mem[this.p] = 0xff;
    break;
  case '>':
    ++ this.p;
    if(this.p >= this.length) this.p = 0;
    break;
  case '<':
    -- this.p;
    if(this.p < 0) this.p = this.length - 1;
    break;
  case '.':
    if(typeof process !== 'undefined')
      process.stdout.write(String.fromCharCode(this.mem[this.p]));
    else
      console.log(String.fromCharCode(this.mem[this.p]));
    break;
  case ',':
    if(typeof process !== 'undefined')
      throw Error('read: not implemented');
    else
      this.mem[this.p] = String(prompt('введите символ')).charCodeAt(0) & 0xff;
    break;
  default:
    throw new Error('unexpected: ' + c);
  }
};

BfVM.prototype.get = function(){
  return this.mem[this.p];
};

function BfStream(vm){
  this.commands = [];
  this.level = 0;
  this.vm = vm;
}

BfStream.prototype.run = function(){
  var i = 0, c = this.commands, N;
  
  while(i < c.length) {
    if(c[i] === '['){
      if(this.vm.get()){
        ++ i;
        continue;
      }
      
      N = 1;
      while(N){
        ++ i;
        if(c[i] === '[') ++N;
        if(c[i] === ']') --N;
      }
      ++ i;
      continue;
    }
    
    if(c[i] === ']'){
      N = 1;
      while(N){
        -- i;
        if(c[i] === '[') --N;
        if(c[i] === ']') ++N;
      }
      continue;
    }
    
    this.vm.run(c[i]);
    ++ i;
  }
  
  this.commands = [];
};

BfStream.prototype.add = function(command){
  if(command === '['){
    this.commands.push('[');
    ++ this.level;
    return;
  }
  
  if(command === ']'){
    this.commands.push(']');
    -- this.level;
    if(this.level === 0) this.run();
    return;
  }
  
  if(this.level === 0) this.vm.run(command);
  else this.commands.push(command);
};

function brainfuck(){
  var stream = new BfStream(new BfVM);
  
  function run(c){ stream.add(c); return intr; }
  
  var intr = {
    get plus  (){ return run('+'); },
    get minus (){ return run('-'); },
    get prev  (){ return run('<'); },
    get next  (){ return run('>'); },
    get begin (){ return run('['); },
    get end   (){ return run(']'); },
    get print (){ return run('.'); },
    get read  (){ return run(','); }
  };
  
  return intr;
}

function test(){

    brainfuck()
    
      .plus .plus .plus .plus .plus .plus .plus 
      .plus .plus .plus .plus .plus .plus .plus
      .begin
            .minus.next .plus .plus .plus .plus
            .plus .next .plus .plus .plus .plus
            .plus .plus .next .plus .plus .plus
            .plus .plus .plus .prev .prev .prev
      .end
      .next .plus .print.next .minus.minus.minus
      .minus.minus.print.next .plus .plus .print
      .prev .minus.print.plus .print.minus.minus
      .minus.minus.print.plus .plus .plus .plus
      .print.prev .minus.minus.minus.print
    
    ;
    
}

if(typeof module !== 'undefined' && module !== require.main)
  module.exports = brainfuck;
else
  test();
