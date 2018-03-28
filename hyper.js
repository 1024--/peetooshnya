/** описание логики построения

// стандартные лямбды
const zero = f => x => x;
const succ = n => f => x => f(n(f)(x));
const one = succ(zero);
const True = x => y => x, False = zero;
const pair = x => y => f => f(x)(y);
const first = p => p (True), second = p => p (False);

// const h0 = n => m => succ(m);
// const h1 = n => m => m(h0(n))(n);
// const h2 = n => m => m(h1(n))(zero);
// const h3 = n => m => m(h2(n))(one);
// const h4 = n => m => m(h3(n))(one);

// xs(n) = (n, 0)
const xs = n => pair(n)(zero);

// следующий гипероператор: (h, xs) -> (h', tail(xs))
const hnext = p => {
  const h = first(p), xs = second(p);
  
  // для гипероператора h и значения x следующий гипероператор h':
  // h' = n => m => m(h(n))(next(x));
  const h1 = n => m => m(h(n))(first(xs));
  
  // продавливание: (a, b) -> (b, 1)
  const xs1 = pair(second(xs))(one);
  
  return pair(h1)(xs1);
};

// гипероператор: hnext(...hnext((hnext(h0, xs)))...)
const hyper = k => n => m => first(k(hnext)(pair(_ => succ)(xs(n))))(n)(m);

*/

// гипероператор
const hyper = k=>n=>m=>(i=>(p=>(f=>(s=>f(k
  (h=>p(n=>m=>m(f(h)(n))(f(s(h))))(p(s(s(h)))(i(f=>x=>x))))
  (p(_=>i)(p(n)(f=>x=>x))))(n)(m))(p=>p(f=>x=>x)))
  (p=>p(x=>y=>x)))(x=>y=>f=>f(x)(y)))(n=>f=>x=>f(n(f)(x)));

// проверка работы гипероператора
const succ = n => f => x => f(n(f)(x));
const zero = f => x => x;
const one = succ(zero);
const two = succ(one);
const three = succ(two);
const four = succ(three);

console.log('2.3= ', hyper(zero)(two)(three)(x=>x+1)(0));
console.log('2+3= ', hyper(one)(two)(three)(x=>x+1)(0));
console.log('2*3= ', hyper(two)(two)(three)(x=>x+1)(0));
console.log('2^3= ', hyper(three)(two)(three)(x=>x+1)(0));
console.log('2^^3=', hyper(four)(two)(three)(x=>x+1)(0));
