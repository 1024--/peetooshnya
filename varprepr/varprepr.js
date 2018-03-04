'use strict';

/*
  Исходный код
  ------------
  В исходный код на каждую строку добавляют директивы, начинающиеся с ~, например:
  {
  ~begin
    ~def x:int y:float
    x = 1;
    ~def x:float
    x = 0.5;
    ~def x:char
    ~undef x
    ~undef x
    ~end
  }
  
  ~begin, ~end определяют начало и конец лексического контекста,
    в одном лексическом контексте языка не должно быть более одной пары begin/end,
    каждый begin должен иметь парный end,
    фактически begin соответствует объявлению всех переменных языка
    внутри конкретного лексического контекста
    фактически end соответствует выходу из лексического контекста
  ~def определяет или перекрывает переменные,
    в одном begin/end может быть сколько угодно def для одной и той же переменной,
    при повторном использовании имени переменная скрывается,
    фактически def создаст новую или переиспользует свободную переменную языка
  ~undef уничтожает переменную, открывает предыдущую,
    если имелась переменная с тем же именем,
    фактически undef помечает переменную языка как свободную,
    после чего def может её переиспользовать
  
  При использовании идентификатора, объяленного в ~def, он заменяется
  на преобразованное имя переменной.
  
  Препроцессинг
  -------------
  window.preprocess(text, language) или require(.....)(text, language)
  
  language - строка вида 'js', 'cpp' (см. список доступных языков
  
  или объект вида { begin:, end:, def:, undef:, use: }
  Все, кроме use, принимают массив переменных, use принимает отдельную переменную
  Переменная имеет вид { type:, id:, id2: {typeid:, id} }
  Результат функций подставляется вместо строки с директивой (все, кроме use)
  или в месте использования переменной (use).
  type - строка типа, заданная пользователем в def
  id - уникальный числовой идентификатор переменной в блоке (между begin и end)
  id2.typeid - уникальный числовой типа в блоке (между begin и end)
  id2.id - уникальный числовой идентификатор переменной определённого типа в блоке
  
  max(id) + 1 = length(vs), где vs - список, переданный в begin/end
  begin, end, def, undef, use вызываются в порядке использования
    директив begin/end/def/undef и использования переменных
  
  Если определённые переменные не были использованы, они могут быти исключены из
  аргументов begin/end/def/undef/use.
  
  Пример:
    Использование переменных i0, i1, ... в языке C:
    preprocess(text, {
      begin: vs => vs.map(v => v.type + ' ' + this.use(v) + ';').join(' '),
      use: v => 'i' + v.id
    });
    Использование переменных (*i0), (*i1), ... в языке C в динамической памяти:
    preprocess(text, {
      begin: vs => vs.map(v => v.type + '* i' + v.id + ';').join(' '),
      use: v => '(*i' + v.id + ')',
      end: vs => vs.map(v => 'free(i' + v.id + ')').join(' ')
    });
    Использование переменных i0, i1, ... в языке C:
    preprocess(text, {
      begin: vs => vs.map(v => v.type + ' ' + this.use(v) + ';').join(' '),
      use: v => 'i' + v.id
    });
    Использование переменных t0_0, t0_1, ... в языке C, где первое число
    - ID типа, а второе - ID переменной этого типа:
    preprocess(text, {
      begin: vs => vs.map(v => v.type + ' ' + this.use(v) + ';').join(' '),
      use: v => t' + v.id2.typeid + '_' + v.id2.id
    });
  
  Список доступных языков
  -----------------------
  window.preprocess(text, language).languages
  или require(.....)(text, language).languages
  
*/

(function() {

var IDENTIFIER = '[A-Za-z_$][A-Za-z0-9_$]*';
var SPACES = '\\s*';
var MATCH_LINE_SEPARATOR = /\r\n|\r|\n/;
var LINE_SEPARATOR = '\n';

function directive(name, end) {
  return new RegExp('^(' + SPACES + ')~' + SPACES + name + SPACES + (end || '') + '$');
}

var MATCH_IDENTIFIERS = new RegExp('(' + IDENTIFIER + ')', 'g');
var MATCH_VARDEFS = new RegExp('(' + IDENTIFIER + ')' + SPACES +
    '(?::' + SPACES + '(' + IDENTIFIER + ')' + SPACES + ')?|(.)', 'g');
var MATCH_VARUNDEFS = new RegExp('(' + IDENTIFIER + ')' + SPACES + '|(.)', 'g');

var MATCH_BEGIN = directive('begin');
var MATCH_END = directive('end');
var MATCH_DEF = directive('def', '(.*)');
var MATCH_UNDEF = directive('def', '(.*)');

function returnEmptyString() { return ''; }

function createLanguage(lang) {
  return {
    'begin': lang['begin'] || returnEmptyString,
    'def': lang['def'] || returnEmptyString,
    'use': lang['use'] || function(v){ return 'i' + v.id; },
    'undef': lang['undef'] || returnEmptyString,
    'end': lang['end'] || returnEmptyString,
    '_replace': function(options) {
      var that = this;
      return options.line.replace(MATCH_IDENTIFIERS, function(_, name) {
        if(name in options.variables)
          return that['use'](options.variables[name]);
        
        return name;
      });
    }
  };
}

function Variable(name, type, typeid, id, id2) {
  this.name = name;
  this.type = type;
  this.id = id;
  this.id2 = {
    typeid: typeid,
    id: id2
  };
  this.used = false;
}

function Scope() {
  this.variables = 0;
  this.types = Object.create(null);
  this.ntypes = 0;
  this.busy = Object.create(null);
  this.free = Object.create(null);
};

Scope.prototype.def = function(name, type) {
  var v;
  
  if(type in this.free && this.free[type].length) {
    v = this.free[type].pop();
  } else {
    if(!(type in this.types)) this.types[type] = {
      id: this.ntypes ++,
      count: 0
    };
    
    var t = this.types[type];
    v = new Variable(name, type, t.id, this.variables ++, t.count ++);
  }
  
  if(name in this.busy) {
    this.busy[name].push(v);
  } else {
    this.busy[name] = [v];
  }
};

Scope.prototype.undef = function(name) {
  if(!(name in this.busy) || !this.busy[name].length)
    throw new Error(name + ' is free');
  
  var v = this.busy[name].pop();
  
  if(v.type in this.free)
    this.free[v.type].push(v);
  else
    this.free[v.type] = [v];
  
  return v.type;
};

Scope.prototype.find = function(name) {
  if(name in this.busy) {
    var vs = this.busy[name];
    if(vs.length) return vs[vs.length - 1];
  }
  
  return null;
};

Scope.prototype.collect = function() {
  var variables = [];
  
  for(var name in this.busy) {
    var vs = this.busy[name];
    for(var i=0; i<vs.length; ++i)
      variables.push(vs[i]);
  }
  
  for(var type in this.free) {
    var vs = this.free[type];
    for(var i=0; i<vs.length; ++i)
      variables.push(vs[i]);
  }
  
  return variables;
};

var JavaScript = createLanguage({
  'begin': function(variables) {
    return variables
      .map(function(v) { return 'var ' + this.use(v) + ';' })
      .join(' ');
  }
});

var ActionScript = createLanguage({
  'begin': function(variables) {
    return variables
      .map(function(v) {
        return 'var ' + this.use(v) +
          (v.type ? ':' + v.type : '') + ';';
      })
      .join(' ');
  }
});

var C = createLanguage({
  'begin': function(variables) {
    return variables
      .map(function(v) {
        return v.type + ' ' + this.use(v) + ';';
      })
      .join(' ');
  }
});

var python = createLanguage({});

var languages = {
  'js': JavaScript,
  'javascript': JavaScript,
  'ecmascript': JavaScript,
  'jscript': JavaScript,
  'c': C,
  'h': C,
  'c++': C,
  'cpp': C,
  'cc': C,
  'cxx': C,
  'hpp': C,
  'java': C,
  'c#': C,
  'cs': C,
  'python': python,
  'py': python,
  'actionscript': ActionScript,
  'typescript': ActionScript,
};

function preprocess(text, language_) {
  
  if(typeof text !== 'string') throw new TypeError('Invalid text');
  
  var language;
  if(typeof language_ == 'string' && language_.toLowerCase() in languages) {
    language = languages[language_.toLowerCase()];
  } else if(typeof language_ == 'object') {
    language = createLanguage(language_);
  } else {
    throw new TypeError('Invalid language');
  }
  
  var line, scope, actions = [], scopes = [], lineNumber;
  
  function Action(name, args, spaces) {
    this.name = name;
    this.args = args;
    this.spaces = spaces;
  }
  
  Action.prototype.run = function() {
    return this.spaces + language[this.name](this.args);
  };

  function Begin() {
    var m = MATCH_BEGIN.exec(line);
    if(!m) return false;
    scopes.push({scope: scope, aid: actions.length});
    actions.push(new Action('begin', null, m[1]));
    scope = new Scope;
    return true;
  }

  function End() {
    var m = MATCH_END.exec(line);
    if(!m) return false;
    var variables = scope.collect();
    var s = scopes.pop();
    actions[s.aid].args = variables;
    actions.push(new Action('end', variables, m[1]));
    scope = s.scope;
    return true;
  }
  
  function Def() {
    var m = MATCH_DEF.exec(line);
    if(!m) return false;
    
    var variables = [];
    
    m[2].replace(MATCH_VARDEFS, function(_, name, type, error) {
      if (error) throw new Error('Invalid def directive ("'+ error + '")');
    
      scope.def(name, type);
      variables.push({name: name, type: type});
    });
    
    actions.push(new Action('def', variables, m[1]));
    
    return true;
  }
  
  function Undef() {
    var m = MATCH_UNDEF.exec(line);
    if(!m) return false;
    
    var variables = [];
    
    m[2].replace(MATCH_VARUNDEFS, function(_, name, error) {
      if (error) throw new Error('Invalid undef directive (symbol "' + error + '")');
    
      var type = scope.undef(name);
      variables.push({name: name, type: type});

    });
    
    actions.push(new Action('undef', variables, m[1]));
    
    return true;
  }
  
  function DefaultLine() {
    var variables = Object.create(null);
    
    line.replace(MATCH_IDENTIFIERS, function(_, name) {
      var v = scope && scope.find(name);
      if(v) {
        v.used = true;
        variables[name] = v;
      }
    });

    actions.push(new Action('_replace', {line: line, variables: variables}, ''));
    
    return true;
  }
  
  var directives = [Begin, End, Def, Undef, DefaultLine];
  var lines = text.split(MATCH_LINE_SEPARATOR);
  
  for(lineNumber = 0; lineNumber < lines.length; ++lineNumber) {
    line = lines[lineNumber];
    
    for(var i=0; i<directives.length; ++i) {
        try {
          if(directives[i]()) break;
        } catch(e) {
          var error = Object.create(Error.prototype);
          error.message = e.message + ' at line ' + lineNumber + ' "' + line + '"';
          var stack = e.stack.split(MATCH_LINE_SEPARATOR);
          stack[0] = error.message;
          error.stack = stack.join(LINE_SEPARATOR);
          throw error;
        }
    }
  
  }
  
  actions.forEach(function(a) {
    if(a.name != '_replace')
      a.args = a.args.filter(function(v) { return v.used; });
  });
  
  return actions.map(function(a){
    return a.run();
  }).join(LINE_SEPARATOR);
  
}

preprocess.languages = Object.keys(languages);

if (typeof module !== 'undefined') {
  module.exports = preprocess;
}

if (typeof window !== 'undefined') {
  window['preprocess'] = preprocess;
}

})();
