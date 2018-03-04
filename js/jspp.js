#include <iostream>
#include <functional>
#include <sstream>
#include <map>
#include <vector>
#include <limits>
#include <memory>
#include <cmath>

class BaseBody;
typedef std::shared_ptr<BaseBody> BodyPtr;

class Object {
public:
  Object(int);
  Object(double);
  Object(const std::string&);
  Object(const char*);
  Object(char);
  Object(bool);
  template<typename R, typename... T> Object(R(*)(T...));
  template<typename R, typename... T> Object(std::function<R(T...)>);
  Object();
  Object(BaseBody*);
  Object(BodyPtr);
  Object(const Object&);
  
  ~Object();
  
  Object& operator = (const Object& o);
  Object toString() const;
  Object& operator [] (const Object& key);
  const Object& operator [] (const Object& key) const;
  
  Object operator ! () const;
  Object operator ~ () const;
  Object operator + () const;
  Object operator - () const;
  
  friend Object operator + (const Object&, const Object&);
  friend Object operator - (const Object&, const Object&);
  friend Object operator * (const Object&, const Object&);
  friend Object operator / (const Object&, const Object&);
  friend Object operator << (const Object&, const Object&);
  friend Object operator >> (const Object&, const Object&);
  friend Object operator && (const Object&, const Object&);
  friend Object operator || (const Object&, const Object&);
  friend Object operator & (const Object&, const Object&);
  friend Object operator | (const Object&, const Object&);
  friend Object operator ^ (const Object&, const Object&);
  
  Object& operator ++ () {
    return *this = *this + 1;
  }
  
  Object operator ++ (int) {
    Object o = *this;
    *this = *this + 1;
    return o;
  }
  
  Object& operator -- () {
    return *this = *this - 1;
  }
  
  Object operator -- (int) {
    Object o = *this;
    *this = *this - 1;
    return o;
  }

private:
  template <typename... T>
  Object call (std::vector<BodyPtr>& arguments, const Object& h, T... t) const;
  
  Object call (std::vector<BodyPtr>& arguments) const;
  
public:
  template <typename... T>
  Object operator () (T... t) const {
    std::vector<BodyPtr> v;
    return call(v, t...);
  }
  
  Object operator () () const {
    std::vector<BodyPtr> v;
    return call(v);
  }

  Object& operator +=  (const Object& rhs) { return *this = *this +  rhs; }
  Object& operator -=  (const Object& rhs) { return *this = *this -  rhs; }
  Object& operator *=  (const Object& rhs) { return *this = *this *  rhs; }
  Object& operator /=  (const Object& rhs) { return *this = *this /  rhs; }
  Object& operator <<= (const Object& rhs) { return *this = *this << rhs; }
  Object& operator >>= (const Object& rhs) { return *this = *this >> rhs; }
  Object& operator &=  (const Object& rhs) { return *this = *this &  rhs; }
  Object& operator |=  (const Object& rhs) { return *this = *this |  rhs; }
  Object& operator ^=  (const Object& rhs) { return *this = *this ^  rhs; }
  
  friend std::ostream& operator << (std::ostream& os, const Object& o);
  
  friend class Number;
  friend class String;
  friend class Boolean;
  friend class Math;
  
private:
  std::shared_ptr<BaseBody> value;
};

class ObjectBody;
class NumberBody;
class StringBody;
class BoolBody;
class NullBody;
class UndefinedBody;

class BaseBody {
public:
  BaseBody() : proto(new std::map<std::string, Object>) {}
  BaseBody(const BaseBody& o) : proto(o.proto) {}
  
  virtual ~BaseBody(){}
    
  virtual BaseBody* clone () const = 0;
  
  virtual Object rAdd (const BaseBody& lhs) const = 0;
  virtual Object add (const ObjectBody& rhs) const = 0;
  virtual Object add (const NumberBody& rhs) const = 0;
  virtual Object add (const StringBody& rhs) const = 0;
  virtual Object add (const BoolBody& rhs) const = 0;
  virtual Object add (const NullBody& rhs) const = 0;
  virtual Object add (const UndefinedBody& rhs) const = 0;
  
  virtual Object call (std::vector<BodyPtr>& arguments) const {
    std::cerr << "[CALLING OBJECT]";
    throw;
  }
  
  virtual Object& operator [] (const std::string& key) {
    return (*proto)[key];
  }
  
  virtual const Object& operator [] (const std::string& key) const {
    return (*proto)[key];
  }
  
  virtual const std::string toString() const = 0;
  virtual double toNumber() const = 0;
  virtual int toInt() const {
    double d = toNumber();
    if (std::isnan(d)) return 0;
    if (d > +9.9999999999998e24) return 0;
    if (d < -9.9999999999998e24) return 0;
    return d;
  }
  virtual bool toBool() const = 0;
private:
  std::shared_ptr<std::map<std::string, Object>> proto;
};

class ObjectBody : public BaseBody {
public:
  virtual BaseBody* clone () const {
    return new ObjectBody(*this);
  }
  
  virtual Object rAdd (const BaseBody& lhs) const;
  virtual Object add (const ObjectBody& rhs) const;
  virtual Object add (const NumberBody& rhs) const;
  virtual Object add (const StringBody& rhs) const;
  virtual Object add (const BoolBody& rhs) const;
  virtual Object add (const NullBody& rhs) const;
  virtual Object add (const UndefinedBody& rhs) const;
  
  virtual const std::string toString() const {
    return "[object Object]";
  }
  virtual double toNumber() const {
    return std::numeric_limits<double>::quiet_NaN();
  }
  virtual bool toBool() const {
    return true;
  }
};

class NullBody : public BaseBody {
public:
  virtual BaseBody* clone () const {
    return new NullBody(*this);
  }
  
  virtual Object rAdd (const BaseBody& lhs) const;
  virtual Object add (const ObjectBody& rhs) const;
  virtual Object add (const NumberBody& rhs) const;
  virtual Object add (const StringBody& rhs) const;
  virtual Object add (const BoolBody& rhs) const;
  virtual Object add (const NullBody& rhs) const;
  virtual Object add (const UndefinedBody& rhs) const;
  
  virtual const std::string toString() const {
    return "null";
  }
  virtual double toNumber() const {
    return 0;
  }
  virtual bool toBool() const {
    return false;
  }
};

class UndefinedBody : public NullBody {
public:
  virtual BaseBody* clone () const {
    return new UndefinedBody(*this);
  }
  
  static BodyPtr instance () {
    static BodyPtr instance;
    if(instance == NULL) instance.reset(new UndefinedBody);
    return instance;
  }

  virtual Object rAdd (const BaseBody& lhs) const;
  
  virtual const std::string toString() const {
    return "undefined";
  }
  virtual double toNumber() const {
    return std::numeric_limits<double>::quiet_NaN();
  }
  virtual bool toBool() const {
    return false;
  }
};

template <size_t size, size_t index, typename R, typename... T>
struct FunctionCall {
  template <typename... A>
  static Object call(std::function<R(T...)> func, std::vector<BodyPtr>& arguments, const A&... v) {
    BodyPtr arg = index < arguments.size() ? arguments[index] : UndefinedBody::instance();
    return FunctionCall<size, index+1, R, T...>::call(func, arguments, v..., Object(arg));
  }
};

template <size_t x, typename R, typename... T>
struct FunctionCall <x, x, R, T...> {
  template <typename... A>
  static Object call(std::function<R(T...)> func, std::vector<BodyPtr>& arguments, const A&... v) {
    return Object(func(v...));
  }
};

template <typename R, typename... T>
class FunctionBody : public ObjectBody {
public:
  FunctionBody(std::function<R(T...)> func) : value(func) {}
  FunctionBody(R(*func)(T...)) : value(func) {}

  virtual FunctionBody* clone () const {
    return new FunctionBody(*this);
  }

  virtual const std::string toString() const {
    return "function () { [naive code] }";
  }
  
  virtual Object call (std::vector<BodyPtr>& arguments) const {
    return FunctionCall<sizeof... (T), 0, R, T...>::call(value, arguments);
  }

private:
  std::function<R(T...)> value;
};

class NumberBody : public BaseBody {
public:
  explicit NumberBody(double v) : value(v) {}
  explicit NumberBody(int v) : value(v) {}
  
  virtual BaseBody* clone () const {
    return new NumberBody(*this);
  }
  
  virtual Object rAdd (const BaseBody& lhs) const;
  virtual Object add (const ObjectBody& rhs) const;
  virtual Object add (const NumberBody& rhs) const;
  virtual Object add (const StringBody& rhs) const;
  virtual Object add (const BoolBody& rhs) const;
  virtual Object add (const NullBody& rhs) const;
  virtual Object add (const UndefinedBody& rhs) const;
  
  virtual const std::string toString() const {
    if(std::isnan(value)) return "NaN";
    if(std::isinf(value)) return value < 0 ? "-Infinity" : "Infinity";
    
    std::stringstream s;
    s << value;
    return s.str();
  }
  virtual double toNumber() const {
    return value;
  }
  virtual bool toBool() const {
    if(std::isnan(value)) return false;
    return value;
  }
private:
  double value;
};

class StringBody : public BaseBody {
public:
  explicit StringBody(const std::string& s) : value(s) {}
  explicit StringBody(char c) : value() {
    value += c;
  }
  
  virtual BaseBody* clone () const {
    return new StringBody(*this);
  }
  
  virtual Object rAdd (const BaseBody& lhs) const;
  virtual Object add (const ObjectBody& rhs) const;
  virtual Object add (const NumberBody& rhs) const;
  virtual Object add (const StringBody& rhs) const;
  virtual Object add (const BoolBody& rhs) const;
  virtual Object add (const NullBody& rhs) const;
  virtual Object add (const UndefinedBody& rhs) const;
  
  virtual const std::string toString() const {
    return value;
  }
  virtual double toNumber() const {
    std::stringstream s(value);
    double v;
    s >> v;
    return v;
  }
  virtual bool toBool() const {
    return value.size();
  }
private:
  std::string value;
};

class BoolBody : public BaseBody {
public:
  explicit BoolBody(bool b) : value(b) {}
  
  virtual BaseBody* clone () const {
    return new BoolBody(*this);
  }
  
  virtual Object rAdd (const BaseBody& lhs) const;
  virtual Object add (const ObjectBody& rhs) const;
  virtual Object add (const NumberBody& rhs) const;
  virtual Object add (const StringBody& rhs) const;
  virtual Object add (const BoolBody& rhs) const;
  virtual Object add (const NullBody& rhs) const;
  virtual Object add (const UndefinedBody& rhs) const;
  
  virtual const std::string toString() const {
    return value ? "true" : "false";
  }
  virtual double toNumber() const {
    return value;
  }
  virtual bool toBool() const {
    return value;
  }
private:
  bool value;
};

Object ObjectBody::rAdd (const BaseBody& lhs) const {
  return lhs.add(*this);
}
Object ObjectBody::add (const ObjectBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object ObjectBody::add (const NumberBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object ObjectBody::add (const StringBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object ObjectBody::add (const BoolBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object ObjectBody::add (const NullBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object ObjectBody::add (const UndefinedBody& rhs) const {
  return Object(toString() + rhs.toString());
}

Object NumberBody::rAdd (const BaseBody& lhs) const {
  return lhs.add(*this);
}
Object NumberBody::add (const ObjectBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object NumberBody::add (const NumberBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}
Object NumberBody::add (const StringBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object NumberBody::add (const BoolBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}
Object NumberBody::add (const NullBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}
Object NumberBody::add (const UndefinedBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}

Object StringBody::rAdd (const BaseBody& lhs) const {
  return lhs.add(*this);
}
Object StringBody::add (const ObjectBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object StringBody::add (const NumberBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object StringBody::add (const StringBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object StringBody::add (const BoolBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object StringBody::add (const NullBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object StringBody::add (const UndefinedBody& rhs) const {
  return Object(toString() + rhs.toString());
}

Object BoolBody::rAdd (const BaseBody& lhs) const {
  return lhs.add(*this);
}
Object BoolBody::add (const ObjectBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object BoolBody::add (const NumberBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object BoolBody::add (const StringBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object BoolBody::add (const BoolBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}
Object BoolBody::add (const NullBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}
Object BoolBody::add (const UndefinedBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}

Object NullBody::rAdd (const BaseBody& lhs) const {
  return lhs.add(*this);
}
Object NullBody::add (const ObjectBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object NullBody::add (const NumberBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}
Object NullBody::add (const StringBody& rhs) const {
  return Object(toString() + rhs.toString());
}
Object NullBody::add (const BoolBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}
Object NullBody::add (const NullBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}
Object NullBody::add (const UndefinedBody& rhs) const {
  return Object(toNumber() + rhs.toNumber());
}

Object UndefinedBody::rAdd (const BaseBody& lhs) const {
  return lhs.add(*this);
}

Object::Object(int v) : value(new NumberBody(v)) {}
Object::Object(double v) : value(new NumberBody(v)) {}
Object::Object(const std::string& v) : value(new StringBody(v)) {}
Object::Object(const char* v) : value(new StringBody(v)) {}
Object::Object(char v) : value(new StringBody(v)) {}
template<typename R, typename... T>
Object::Object(R(*v)(T...)) : value(new FunctionBody<R, T...>(v)) {}
template<typename R, typename... T>
Object::Object(std::function<R(T...)> v) : value(new FunctionBody<R, T...>(v)) {}
Object::Object(bool v) : value(new BoolBody(v)) {}
Object::Object() : value(new ObjectBody) {}
Object::Object(BaseBody* o) : value(o) {}
Object::Object(BodyPtr o) : value(o) {}
Object::Object(const Object& o) : value(o.value) {}
Object::~Object() { }

Object& Object::operator = (const Object& o) {
  if(&o == this) return *this;
  value = o.value;
  return *this;
}

Object operator + (const Object& lhs, const Object& rhs) {
  return rhs.value->rAdd(*(lhs.value));
}

Object operator - (const Object& lhs, const Object& rhs) {
  return Object(lhs.value->toNumber() - rhs.value->toNumber());
}

Object operator * (const Object& lhs, const Object& rhs) {
  return Object(lhs.value->toNumber() * rhs.value->toNumber());
}

Object operator / (const Object& lhs, const Object& rhs) {
  return Object(lhs.value->toNumber() / rhs.value->toNumber());
}

Object operator << (const Object& lhs, const Object& rhs) {
  return Object(lhs.value->toInt() << rhs.value->toInt());
}
Object operator >> (const Object& lhs, const Object& rhs) {
  return Object(lhs.value->toInt() >> rhs.value->toInt());
}
Object operator && (const Object& lhs, const Object& rhs) {
  return lhs.value->toBool() ? rhs : lhs;
}
Object operator || (const Object& lhs, const Object& rhs) {
  return lhs.value->toBool() ? lhs : rhs;
}
Object operator & (const Object& lhs, const Object& rhs) {
  return Object(lhs.value->toInt() & rhs.value->toInt());
}
Object operator | (const Object& lhs, const Object& rhs) {
  return Object(lhs.value->toInt() | rhs.value->toInt());
}
Object operator ^ (const Object& lhs, const Object& rhs) {
  return Object(lhs.value->toInt() ^ rhs.value->toInt());
}

Object Object::toString() const {
  return Object(value->toString());
}

Object& Object::operator [] (const Object& key) {
  return (*value)[key.value->toString()];
}

const Object& Object::operator [] (const Object& key) const {
  return (*value)[key.value->toString()];
}

Object Object::operator ! () const {
  return Object(!value->toBool());
}

Object Object::operator ~ () const {
  return Object(~value->toInt());
}

Object Object::operator + () const {
  return Object(value->toNumber());
}

Object Object::operator - () const {
  return Object(-value->toNumber());
}

template <typename... T>
Object Object::call (std::vector<BodyPtr>& arguments, const Object& h, T... t) const {
  arguments.push_back(h.value);
  return call(arguments, t...);
}

Object Object::call (std::vector<BodyPtr>& arguments) const {
  return value->call(arguments);
}

std::ostream& operator << (std::ostream& os, const Object& o) {
  return os << o.value->toString();
}

static Object null(new NullBody);
static Object undefined(new UndefinedBody);
static Object NaN(std::numeric_limits<double>::quiet_NaN());
static Object Infinity(std::numeric_limits<double>::infinity());
static Object Number(static_cast<std::function<Object(Object)>>([](Object x) { return +x; }));
static Object String(static_cast<std::function<Object(Object)>>([](Object x) { return x + ""; }));
static Object Boolean(static_cast<std::function<Object(Object)>>([](Object x) { return !!x; }));

typedef Object var;

class ConsoleLogBody : public ObjectBody {
  virtual ConsoleLogBody* clone () const {
    return new ConsoleLogBody(*this);
  }

  virtual const std::string toString() const {
    return "function log() { [naive code] }";
  }
  
  virtual Object call (std::vector<BodyPtr>& arguments) const {
    for(size_t i = 0; i < arguments.size(); ++i) {
      if(i) std::cout << ' ';
      std::cout << arguments[i]->toString();
    }
    std::cout << std::endl;
    return undefined;
  }
};

class Console : public Object {
public:
  Console() : log(new ConsoleLogBody) {}
  Object log;
} console;

struct Math : public Object {
  Math() :
    sin(static_cast<std::function<Object(Object)>>([](Object x) { return std::sin(x.value->toNumber()); })),
    cos(static_cast<std::function<Object(Object)>>([](Object x) { return std::cos(x.value->toNumber()); })),
    PI(3.1415926) {}
  Object sin, cos, PI;
} Math;

struct Window : public Object {
  Window() : Math(Math), console(console) {}
  Object& Math, &console;
} window;

// TODO: как-то переписать unary, binary на Object(lambda_t)
template <typename F>
Object unary(F f) {
  return Object(static_cast<std::function<Object(Object)>>(f));
}

template <typename F>
Object binary(F f) {
  return Object(static_cast<std::function<Object(Object, Object)>>(f));
}

int main() {
  window["console"] = console;
  window["Math"] = Math;
  Math["sin"] = Math.sin;
  Math["cos"] = Math.cos;
  Math["PI"] = Math.PI;
  console["log"] = console.log;
  
  // EXAMPLE (Church numerals):
  
  var zero = unary([](var f){ return unary([f](var x){ return x; }); });
  var succ = unary([](var n){ return unary([n](var f){ return unary([n,f](var x){ return f(n(f)(x)); }); }); });
  var plus = unary([succ](var m){ return unary([m,succ](var n){ return m(succ)(n); }); });
  var mult = unary([](var m){ return unary([m](var n){ return unary([m,n](var f){ return m(n(f)); }); }); });
  var pred = unary([](var n){ return unary([n](var f){ return unary([n,f](var x){ return n (unary([f,x](var g){ return unary([f,g,x](var h){ return h (g (f)); }); })) (unary([x](var u){ return x; })) (unary([](var u){ return u; })); }); }); });
  
  var inc = unary([](var x) { return x+1; });
  var zeroValue = 0;
  
  console.log("0 is", zero(inc)(zeroValue));
  var two = succ(succ(zero));
  console.log("2 is", two(inc)(zeroValue));
  var four = plus(two)(two);
  console.log("4 is", four(inc)(zeroValue));
  var eight = mult(two)(four);
  console.log("8 is", eight(inc)(zeroValue));
  var seven = pred(eight);
  console.log("7 is", seven(inc)(zeroValue));
  
  console.log("7 is", unary([](var n){return unary([n](var f){return unary([n,f](var x){return n(unary([f,x](var g){return unary([f,g,x](var h){return h(g(f));});}))(unary([x](var u){return x;}))(unary([](var u){return u;}));});});})(unary([](var m){return unary([m](var n){return unary([m,n](var f){return m(n(f));});});})(unary([](var n){return unary([n](var f){return unary([n,f](var x){return f(n(f)(x));});});})(unary([](var n){return unary([n](var f){return unary([n,f](var x){return f(n(f)(x));});});})(unary([](var f){return unary([f](var x){return x;});}))))(unary([](var m){return unary([m](var n){return m(unary([](var n){return unary([n](var f){return unary([n,f](var x){return f(n(f)(x));});});}))(n);});})(unary([](var n){return unary([n](var f){return unary([n,f](var x){return f(n(f)(x));});});})(unary([](var n){return unary([n](var f){return unary([n,f](var x){return f(n(f)(x));});});})(unary([](var f){return unary([f](var x){return x;});}))))(unary([](var n){return unary([n](var f){return unary([n,f](var x){return f(n(f)(x));});});})(unary([](var n){return unary([n](var f){return unary([n,f](var x){return f(n(f)(x));});});})(unary([](var f){return unary([f](var x){return x;});}))))))(unary([](var x){return x+1;}))(0));

  // EXAMPLE (JS):
  
  var x = 3;
  var y = x + null;
  var z = "hello, " + y;
  var n = NaN << NaN;
  var f = Object(static_cast<std::function<Object(Object, Object)>>([](Object x, Object y){ return x+y; }));
  
  console.log("x = " + x + " y = " + y + " z = " + z);
  console.log("x =", x,"y =", y, "z =", z);
  console.log(String("222") + true);
  console.log(String("222") + 3);
  console.log(Number("222") + 3);
  console.log(NaN << NaN, !NaN);
  console.log(undefined + 1);
  console.log(f("hello, ", "world"));
  console.log("sin(pi/4) = ", Math.sin(Math.PI / 4));
  console["log"]("sin(pi/4) = ", window["Math"]["sin"](Math["PI"] / 4));
}
