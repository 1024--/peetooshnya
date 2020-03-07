'use strict';

// асинхронная итерация по произвольной undefined-терминированной питушне,
// выражающейся через getNextValue(cb),
//   где cb принимает следующий элемент или undefined
// remember - сколько прошлых элементов помнить
// f - коллбек итерации цикла
//   где f принимает x, next, done,
//     где x - текущий элемент
//     где next(n, cb) - функция для получения n-ого элемента
//       где n - номер элемента, если 0 - номер текущего элемента,
//         n<0 - прошлые, n>0 будущие
//       где cb - функция, принимающая значение элемента или undefined, если нет
// cb - коллбек, вызывающийся после цикла
function asyncForEach (getNextValue, remember, f, cb) {
  var nexts = [], prevs = [], maxPrevs = remember >= 0 ? remember + 1 : 1, ended = false;
  var postponed = [], loading = false;
  
  function getNextValueTailed (cb) {
    if (ended) cb(undefined);
    else getNextValue(function(x) {
      if (x === undefined) ended = true;
      cb(x);
    });
  }
  
  function next(n, cb) {
    if (n <= 0 && -n < prevs.length) cb(prevs[prevs.length+n-1]);
    else if (n < 0) cb(undefined);
    else if (n <= nexts.length) cb(nexts[n-1]);
    else {
      if (loading) {
        postponed.push([n, cb]);
        return;
      }
      loading = true;
      (function load(i) {
        getNextValueTailed(function(x) {
          nexts.push(x);
          if (i) load(i-1);
          else{
            loading = false;
            cb(x);
            if (postponed.length) {
              var args = postponed.shift();
              next(args[0], args[1]);
            }
          }
        });
      })(n - nexts.length - 1);
    }
  }
  
  function process (x) {
    if (x === undefined) {
      cb();
      return;
    }
    prevs.push(x);
    if (prevs.length > maxPrevs) prevs.shift();
    f(x, next, iteration);
  }
  
  function iteration() {
    if (nexts.length) process(nexts.shift());
    else getNextValue(process);
  }
  
  iteration();
}

// генерация случайных последовательностей
function randoms (n) {
  return function (cb) {
    if (n < 0) throw new Error('Sosnooley!');
    setTimeout(function() {
      cb(n-- ? Math.random() * 1000 | 0 : undefined);
    }, Math.random() * 1000 | 0);
  }
}

// демонстрация циклоняшества
var i = 0;
console.log('Start loop #1.');
asyncForEach(randoms(10), 2, function(x, next, done) {
  i ++;
  next(-4, function(prev4) {
    next(-3, function(prev3) {
      next(-2, function(prev2) {
        next(-1, function(prev1) {
          next(0, function(cur) {
            next(1, function(next1) {
              next(2, function(next2) {
                next(3, function(next3) {
                  console.log('Loop #1, iteration #' + i + ': x=' + x + '=' + cur +
                    ' prevs=' + JSON.stringify([prev4, prev3, prev2, prev1]) +
                    ' nexts=' + JSON.stringify([next1, next2, next3]));
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
}, function(){
  console.log('End loop #1.');

  var i = 0;
  console.log('Start loop #2');
  asyncForEach(randoms(10), 1, function(x, next, done) {
    i ++;
    next(-1, function(prev) {
      console.log('Loop #2, iteration #' + i + ': x=' + x + ' prev=' + prev);
      done();
    });
  }, function(){
    console.log('End loop #2.');
  });

});
