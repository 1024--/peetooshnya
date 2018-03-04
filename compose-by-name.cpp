#include <iostream>

/****************************
*  functions
****************************/

// inner functions

struct id {
  template <typename T>
  static const T& val(const T& v) {
    return v;
  }
};

template <typename T>
struct ho_id {
  template <typename V>
  static auto val(const V& param) -> decltype(T::val(param)) {
    return T::val(param);
  }
};

// user functions

template <typename T>
struct f1 {
  template <typename V>
  static auto val(const V& param) -> decltype(T::val(param) * 2) {
    return T::val(param) * 2;
  }
};

template <typename T>
struct f2 {
  template <typename V>
  static auto val(const V& param) -> decltype(T::val(param) + 2) {
    return T::val(param) + 2;
  }
};

template <typename T>
struct _05 {
  template <typename V>
  static auto val(const V& param) -> decltype(T::val(param) * 0.5) {
    return T::val(param) * 0.5;
  }
};

template <typename T>
struct sqr {
  template <typename V>
  static auto val(const V& param) -> decltype(T::val(param) * T::val(param)) {
    return T::val(param) * T::val(param);
  }
};

/****************************
*  tree states
****************************/

struct has_value;
struct has_children;
struct has_none;
struct null_type;

/****************************
*  map<string, function>
****************************/

// map nodes forward declarations
template <char c> struct functions1;
template <char c> struct functions2;
template <char c> struct functions3;
template <char c> struct functions4;
template <char c> struct functions5;

struct functions {
  typedef has_children state;
  template<char c>
  using children = functions1<c>;
};

template <char c>
struct functions1 {
  typedef has_none state;
};

template <>
struct functions1<'f'> {
  typedef has_children state;
  template<char c> using children = functions2<c>;
};

template <>
struct functions1<'s'> {
  typedef has_children state;
  template<char c> using children = functions3<c>;
};

template <>
struct functions1<'0'> {
  typedef has_children state;
  template<char c> using children = functions5<c>;
};

template <char c>
struct functions2 {
  typedef has_none state;
};

template<>
struct functions2<'1'> {
  typedef has_value state;
  template<typename T> using value = f1<T>;
};

template<>
struct functions2<'2'> {
  typedef has_value state;
  template<typename T> using value = f2<T>;
};

template <char c>
struct functions3 {
  typedef has_none state;
};

template<>
struct functions3<'q'> {
  typedef has_children state;
  template<char c> using children = functions4<c>;
};

template <char c>
struct functions4 {
  typedef has_none state;
};

template<>
struct functions4<'r'> {
  typedef has_value state;
  template<typename T> using value = sqr<T>;
};

template <char c>
struct functions5 {
  typedef has_none state;
};

template<>
struct functions5<'5'> {
  typedef has_value state;
  template<typename T> using value = _05<T>;
};

/****************************
*  logic
****************************/

template <typename T1, typename T2>
struct when_match {
  template <typename T> using get_value = null_type;
  template <typename T> using get = null_type;
};
    
template <typename T1>
struct when_match<T1, T1> {
  template <typename T> using get_value = typename T::value;
  template <typename T> using get = T;
};

template <typename... T>
struct one_of;

template <typename T, typename... Ts>
struct one_of<T, Ts...> {
  typedef T value;
};

template <typename... Ts>
struct one_of<null_type, Ts...> {
  typedef typename one_of<Ts...>::value value;
};

template <>
struct one_of<> {
  typedef null_type value;
};

/****************************
* getting and composing
* functions from the map:
****************************/

template <template<typename> class F, typename map, char... str>
struct compose1;

template <char... str>
using compose = typename compose1<ho_id, functions, str...>::value;

template <template<typename> class F, typename map, char c, char... oth>
struct compose_children {
  typedef typename compose1<F, typename map::template children<c>, oth...>::value value;
};

template <template<typename> class F, typename map, char c, char... oth>
struct compose1<F, map, c, oth...> {
  
  template <typename T>
  struct val_raw {
    typedef typename map::template value<T> value;
  };
  
  typedef typename map::state state;
  
  template <typename T>
  using val = typename when_match<state, has_value>::template get_value<val_raw<T>>;
  
  typedef typename one_of<
    typename when_match<state, has_value>::template get<
      F<typename compose1<val, functions::children<c>, oth...>::value>
    >,
    typename when_match<state, has_children>::template get_value<
      compose_children<F, map, c, oth...>
    >
  >::value value;
    
};

template <template<typename> class F, typename map>
struct compose_value1 {
  typedef F<typename map::template value<id>> value;
};

template <template<typename> class F, typename map>
struct compose1<F, map> {

  typedef typename when_match<typename map::state, has_value>::template get_value<
    compose_value1<F, map>
  > value;
};

template <char... str>
constexpr auto operator "" _func() -> compose<str...> {
  return compose<str...>();
}

/****************************
* string to chars conversion
* by Johannes Schaub - litb
* http://stackoverflow.com/a/4709240
****************************/

#define E(L,I) \
  (I < sizeof(L)) ? L[I] : 0

#define STR(X, L)                                                       \
  typename Expand<X,                                                    \
                  cstring<E(L,0),E(L,1),E(L,2),E(L,3),E(L,4), E(L,5),   \
                          E(L,6),E(L,7),E(L,8),E(L,9),E(L,10), E(L,11), \
                          E(L,12),E(L,13),E(L,14),E(L,15),E(L,16), E(L,17)>, \
                  cstring<>, sizeof L-1>::type

#define CSTR(L) STR(cstring, L)

template<char ...C> struct cstring { };

template<template<char...> class P, typename S, typename R, int N>
struct Expand;

template<template<char...> class P, char S1, char ...S, char ...R, int N>
struct Expand<P, cstring<S1, S...>, cstring<R...>, N> :
  Expand<P, cstring<S...>, cstring<R..., S1>, N-1>{ };

template<template<char...> class P, char S1, char ...S, char ...R>
struct Expand<P, cstring<S1, S...>, cstring<R...>, 0> {
  typedef P<R...> type;
};

// using Schaub's hack:
#define COMPOSE(str) ho_id<STR(compose, #str)>::val

/****************************
* examples
****************************/

int main() {
  std::cout << "there are f1, f2, 05 and sqr functions" << std::endl;
  std::cout << "f1 x = x * 2" << std::endl;
  std::cout << "f2 x = x + 2" << std::endl;
  std::cout << "05 x = x * 0.5" << std::endl;
  std::cout << "sqr x = x * x" << std::endl;
  std::cout << "-----------------------" << std::endl;
  
  std::cout << "direct access: f1(f2(sqr(f2(id))))(2) = " << f1<f2<sqr<f2<id>>>>::val(2) << std::endl;
  std::cout << "access via function tree: sqr(2) = " << functions1<'s'>::children<'q'>::children<'r'>::value<id>::val(2) << std::endl;
  
  std::cout << "-----------------------" << std::endl;
  std::cout << "05(3) = " << 05_func .val(3) << std::endl;
  std::cout << "05(05(6)) = " << 0505_func .val(6) << std::endl;
  
  std::cout << "-----------------------" << std::endl;
  std::cout << "access by names via Schaub's hack" << std::endl;
  std::cout << "sqr(f2(4)) = " << COMPOSE(sqrf2)(4) << std::endl;
  
  std::cout << "and by pointer: (\\f -> f 4.3) (sqr.f2) = " <<
    [] (double(f)(const double&)) {
      return f(4.3);
    } (&COMPOSE(sqrf2))
  << std::endl;
  
  auto func = &COMPOSE(sqrf2)<short>;
  std::cout << "and again: (sqr.f2)(6.2) = " << func(4.2) << std::endl;
  
  std::cout << "-----------------------" << std::endl;
  std::cout << "access by names or name sequences:" << std::endl;
  std::cout << "f1(6) = " << compose<'f','1'>::val(6) << std::endl;
  std::cout << "f2(6) = " << compose<'f','2'>::val(6) << std::endl;
  std::cout << "sqr(6) = " << compose<'s','q','r'>::val(6) << std::endl;
  
  std::cout << "sqr(f2(4)) = " << compose<'s','q','r','f','2'>::val(6) << std::endl;
  std::cout << "sqr(f2(f1(4))) = " << compose<'s','q','r','f','2','f','1'>::val(6) << std::endl;
  
}
