var TAB_SIZE = 8, MAX_LENGTH = 2000;
var tabSizedBlock = new RegExp('.{' + TAB_SIZE + '}', 'g');

var arr2 = (w, h, v) => '.'.repeat(h-1).split('.').map(_ => v.repeat(w).split(''));
var str2 = a2 => a2.map(a1 => a1.join('')).join('\n');

function format2(a2) {
  return a2.map(function(a1) {
    return a1.join('').replace(/ +$/, '').replace(tabSizedBlock, function(b) {
      return b.replace(/ +$/, '\t');
    });
  }).join('\n').replace(/^[ \n]+|[ \n]+$/g, '');
}

function xui(n, sp) {
  var S = sp[0] + sp[1] + sp[2];
  var a = arr2(n * 6 + S + 2, n * 2 + 1, ' ');
  a[0][0] = String.fromCharCode(0x00A0);
  
  for(var i=0; i<2*n; ++i) {
    // Х
    var k = sp[0];
    a[i+1][k+i] = '\\';
    a[i+1][k+2*n-i-1] = '/';
    // У
    k += 2*n + sp[1];
    if(i<n) a[i+1][k+i] = '\\';
    a[i+1][k+2*n-i-1] = '/';
    // И
    k += 2*n + sp[2];
    a[i+1][k] = '|';
    a[i+1][k+2*n-i] = '/';
    a[i+1][k+2*n+1] = '|';
  }
  
  // v
  a[0][n*5 + S] = '\\';
  a[0][n*5 + S + 1] = '/';
  
  return format2(a);
}

function optimalXui(maxLength) {
  var nMax = maxLength / (2*7) | 0;
  var ms0 = [0, 0, 0];
  for(var n = 1; n <= nMax; ++ n) {
    var m = maxLength + 1, ms = [0, 0, 0];
    for(var sp1 = 0; sp1 < 8; ++ sp1) {
      for(var sp2 = 1; sp2 <= 8; ++ sp2) {
        for(var sp3 = 1; sp3 <= 8; ++ sp3) {
          var sp = [sp1, sp2, sp3];
          var x = xui(n, sp);
          if(x.length < m) {
            m = x.length;
            ms = sp;
          }
          // console.log('n=' + n + ' sp=' + sp + ' L=' + x.length);
          // console.log(x);
        }
      }
    }
    if(m > maxLength) {
      if(n == 1) return null;
      return {
        n: n-1,
        sp: ms0,
        xui: xui(n-1, ms0)
      };
    }
    ms0 = ms;
  }
}

var optXui = optimalXui(MAX_LENGTH);

console.log('optXui: n=' + optXui.n + ' sp=' + optXui.sp +
  ' L=' + optXui.xui.length);
console.log(optXui.xui);
