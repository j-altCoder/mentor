// ─────────────────────────────────────────────────────────────────
//  LESSON: JavaScript Internals — The Deep End
//  Category: JavaScript Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_JS_INTERNALS = {
  category: "Language & Framework Fundamentals",
  tag: "JS Deep Dive",
  title: "The JavaScript Everybody Skips Until the Interview",
  intro: "You've been writing JavaScript for a year. You know functions, arrays, async/await. You've used classes. Then an interviewer asks you to explain what 'this' is in a setTimeout callback, or what actually happens when you write 'new', or why two objects that look identical aren't behaving the same way — and the words slow down. Raj has a blank file open. 'We're going to build all of it from scratch,' he says. 'The real version, not the simplified one.'",
  scenes: [

    // ══════════════════════════════════════════════════════════════
    // SECTION 1 — OBJECTS
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"I want to start from the very beginning. I use objects every day but when someone asks me what one actually is under the hood, I stall."`
    },
    {
      speaker: "raj",
      text: `"Good place to start. An object is a collection of key-value pairs where keys are strings — or Symbols — and values can be anything, including other functions. That's it. But here's what most people don't know: every property on an object isn't just a value. It has hidden metadata sitting behind it called a property descriptor. Four flags: writable, enumerable, configurable, and the value itself. Those flags control how the property behaves."`
    },
    {
      speaker: "you",
      text: `"Hidden metadata — I've never thought about that. Like, what does writable actually control?"`
    },
    {
      speaker: "raj",
      text: `"Whether you can reassign the property. Set writable to false and the property is read-only — any assignment silently fails in normal mode, throws in strict mode. Enumerable controls whether it shows up in for...in loops and Object.keys. Configurable controls whether you can delete the property or change its descriptor. This is how Array.length works — it's non-enumerable, so when you iterate an array with for...in, length doesn't show up. The engine set that flag deliberately."`
    },
    {
      speaker: "you",
      text: `"Can I set those flags myself?"`
    },
    {
      speaker: "raj",
      text: `"That's what Object.defineProperty is for. And Object.getOwnPropertyDescriptor lets you inspect them. Once you see those two, a lot of things that seemed like magic start making sense."`
    },
    {
      type: "code",
      text: `// ── Property descriptors: the hidden metadata ──

const user = { name: 'Alice', age: 30 };

Object.getOwnPropertyDescriptor(user, 'name');
// {
//   value:        'Alice',
//   writable:     true,    ← can you reassign it?
//   enumerable:   true,    ← shows in for...in and Object.keys?
//   configurable: true,    ← can you delete or redefine it?
// }

// ── Making a truly read-only property ──
const config = {};
Object.defineProperty(config, 'MAX_RETRIES', {
  value:        3,
  writable:     false,
  enumerable:   true,
  configurable: false,
});

config.MAX_RETRIES = 99;      // silently ignored (throws in strict mode)
delete config.MAX_RETRIES;    // silently ignored
config.MAX_RETRIES;           // still 3

// ── Non-enumerable properties — exist, but hidden from loops ──
const obj = { a: 1, b: 2 };
Object.defineProperty(obj, 'secret', {
  value: 42, enumerable: false, writable: true, configurable: true
});

Object.keys(obj);    // ['a', 'b']  — secret is invisible
for (let k in obj) {} // 'a', 'b'  — secret is invisible
obj.secret;          // 42         — still directly accessible

// ── Inline getters and setters ──
const temperature = {
  _celsius: 0,
  get fahrenheit()    { return this._celsius * 9/5 + 32; },
  set fahrenheit(val) { this._celsius = (val - 32) * 5/9; },
};

temperature.fahrenheit = 212;
temperature._celsius;         // 100 — setter ran the conversion

// ── Interview trap: Object.freeze vs Object.seal ──
const frozen = Object.freeze({ x: 1, nested: { y: 2 } });
frozen.x = 99;           // silently fails — no write
frozen.z = 3;            // silently fails — no add
frozen.nested.y = 99;    // WORKS — freeze is shallow. nested object is NOT frozen.

const sealed = Object.seal({ x: 1 });
sealed.x = 99;           // WORKS — can still change existing values
sealed.z = 3;            // silently fails — no new properties
// seal: no add/delete, but writable properties stay writable`
    },

    // ── Object creation patterns ──
    {
      speaker: "you",
      text: `"Okay. Now object creation. I've seen object literals, new, Object.create, classes. Are these actually doing different things or are they all producing the same thing?"`
    },
    {
      speaker: "raj",
      text: `"They all produce objects. What's different is the prototype chain they set up — that's the only real mechanical difference. Let me show you the same object built five different ways so you can see what's equivalent."`
    },
    {
      speaker: "you",
      text: `"And 'new' — I've always thought of it as just 'how you make an instance.' I've never thought about what it's actually doing."`
    },
    {
      speaker: "raj",
      text: `"Let's fix that. 'new' does exactly four things, in order. It creates a brand new empty object. It sets that object's prototype to Constructor.prototype. It calls the constructor function with 'this' pointing to the new object. And it returns the new object — unless the constructor explicitly returns a different object, in which case that returned object wins instead. Four steps. We'll implement it ourselves in a minute."`
    },
    {
      type: "code",
      text: `// ── Five ways to create an object — what they each do ──

// ── 1. Object literal — prototype is Object.prototype ──
const obj1 = { name: 'Alice' };

// ── 2. Object.create — you choose the prototype explicitly ──
const proto = {
  greet() { return \`Hi, I'm \${this.name}\`; }
};
const obj2 = Object.create(proto);
obj2.name = 'Alice';
// obj2.__proto__ === proto — direct, explicit, no constructor involved

// ── 3. Constructor function (pre-ES6 pattern) ──
function Person(name) {
  this.name = name;         // own property set on the new object
}
Person.prototype.greet = function() { return \`Hi, I'm \${this.name}\`; };
const obj3 = new Person('Alice');

// ── 4. ES6 Class — same as 3, cleaner syntax ──
class PersonClass {
  constructor(name) { this.name = name; }
  greet() { return \`Hi, I'm \${this.name}\`; }
}
const obj4 = new PersonClass('Alice');

// ── 5. Factory function — returns a plain object, no 'new' ──
const createPerson = (name) => ({
  name,
  greet() { return \`Hi, I'm \${this.name}\`; }
});
const obj5 = createPerson('Alice');

// ── Implementing 'new' from scratch — the four steps ──
const myNew = (Constructor, ...args) => {
  const obj    = Object.create(Constructor.prototype); // steps 1 + 2
  const result = Constructor.call(obj, ...args);       // step 3
  return result instanceof Object ? result : obj;      // step 4
};

const obj6 = myNew(Person, 'Alice');
obj6.greet(); // "Hi, I'm Alice" — identical to new Person('Alice')

// ── Interview trap: constructor returning an object ──
function Weird() {
  this.a = 1;
  return { b: 2 };    // explicit object return — OVERRIDES 'this'
}
const w = new Weird();
console.log(w);  // { b: 2 } — not { a: 1 }
// If the constructor returns a primitive, 'this' is used instead:
function Normal() { this.a = 1; return 42; }
const n = new Normal();
console.log(n);  // { a: 1 } — primitive return is ignored`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 2 — PROTOTYPE CHAIN
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"Prototype is the one I always say I understand and then can't explain. Can we go slow?"`
    },
    {
      speaker: "raj",
      text: `"Let's start with what it's actually solving. You have a hundred user objects. Every one of them needs a greet method. Do you want greet to be copied into all hundred objects?"`
    },
    {
      speaker: "you",
      text: `"No, that's wasteful. You'd want one shared copy."`
    },
    {
      speaker: "raj",
      text: `"Right. The prototype chain is the mechanism for that sharing. Every object has a hidden link — __proto__ — pointing to another object. When you access a property that doesn't exist on the object itself, JavaScript follows that link to the next object, checks there, then the next, all the way up to Object.prototype, and then null. It's a live lookup chain, not a copy. greet lives on Person.prototype. All hundred user objects have their __proto__ pointing there. One copy, shared by all."`
    },
    {
      speaker: "you",
      text: `"So when I call array.map(), the array itself doesn't actually have map?"`
    },
    {
      speaker: "raj",
      text: `"Correct. The array is just an object with numeric keys and a length. map lives on Array.prototype. JavaScript finds it by walking: the array itself — not there. Array.prototype — found it. Done. Every array in your program is sharing that single map function via the chain."`
    },
    {
      type: "analogy",
      text: "The prototype chain is like a question going up a chain of command. You ask the private — they don't know. They ask the sergeant — doesn't know. They ask the captain — she knows. Answer comes back down. The private didn't have the answer, but the chain found it. That's a property lookup. Now imagine every soldier's chain eventually reaches the same general at the top — that's Object.prototype. And above the general is nobody — that's null, the end of the chain."
    },
    {
      type: "code",
      text: `// ── The prototype chain, visualised ──

const arr = [1, 2, 3];
// arr                    { 0:1, 1:2, 2:3, length:3 }
// arr.__proto__          === Array.prototype  (map, filter, forEach...)
// Array.prototype.__proto__ === Object.prototype  (toString, hasOwnProperty...)
// Object.prototype.__proto__ === null  ← end of chain

arr.map;       // found on Array.prototype    — one hop
arr.toString;  // found on Object.prototype   — two hops
arr.whatever;  // not found anywhere          → undefined

// ── The most confused pair in JS: __proto__ vs .prototype ──
function Dog(name) { this.name = name; }
Dog.prototype.speak = function() { return \`\${this.name} barks\`; };

const rex = new Dog('Rex');

// .prototype   → a property ON FUNCTIONS
//               the object that becomes __proto__ of instances
Dog.prototype;    // { speak: [Function], constructor: Dog }

// __proto__    → a property ON OBJECTS (non-standard, use getPrototypeOf)
//               the actual link to the prototype
Object.getPrototypeOf(rex) === Dog.prototype;  // true

// ── Own vs inherited properties ──
rex.hasOwnProperty('name');   // true  — 'name' is ON rex
rex.hasOwnProperty('speak');  // false — 'speak' is on Dog.prototype

// ── Property shadowing ──
rex.speak = () => 'custom!';  // own property shadows Dog.prototype.speak
rex.speak();                  // 'custom!'
delete rex.speak;             // remove shadow — chain is exposed again
rex.speak();                  // 'Rex barks' — back to prototype method

// ── Object.create(null) — a truly empty object ──
const pure = Object.create(null);
// pure has NO prototype chain — no toString, no hasOwnProperty, nothing
// Perfect for a hash map where you don't want accidental key collisions
'toString' in pure;  // false

// ── instanceof under the hood ──
rex instanceof Dog;    // true  — Dog.prototype is in rex's chain
rex instanceof Object; // true  — Object.prototype is in rex's chain

// Manual instanceof:
const instanceOf = (obj, Ctor) => {
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto === Ctor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
};

// ── Prototypal inheritance — the correct pattern ──
function Animal(name) { this.name = name; }
Animal.prototype.speak = function() { return \`\${this.name} makes a sound\`; };

function Cat(name, colour) {
  Animal.call(this, name);   // borrow parent constructor — sets own properties
  this.colour = colour;
}

// ✗ Wrong: Dog.prototype = new Animal()
//   This runs Animal() unnecessarily and leaves 'name: undefined' on the prototype

// ✓ Correct: Object.create — sets up chain without running the constructor
Cat.prototype = Object.create(Animal.prototype);
Cat.prototype.constructor = Cat;  // restore the constructor reference
Cat.prototype.purr = function() { return \`\${this.name} purrs\`; };

const luna = new Cat('Luna', 'black');
luna.speak();  // "Luna makes a sound"  — inherited from Animal.prototype
luna.purr();   // "Luna purrs"          — own method on Cat.prototype

// Chain: luna → Cat.prototype → Animal.prototype → Object.prototype → null`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 3 — ES6 CLASSES AND CONSTRUCTORS
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"Okay, so that's the manual prototype wiring. But in my day-to-day I use classes. How much of what I just learned applies to them?"`
    },
    {
      speaker: "raj",
      text: `"All of it. A class is not a new system — it's new syntax for the exact same prototype wiring we just did manually. The engine turns your class into the same constructor function and Object.create pattern under the hood. When you run typeof on a class, it says 'function'. That's not an accident."`
    },
    {
      speaker: "you",
      text: `"So class is just... cosmetic?"`
    },
    {
      speaker: "raj",
      text: `"Mostly. There are a few genuine differences: classes must be called with new — calling them without throws a TypeError instead of silently doing nothing. Class bodies always run in strict mode. Methods defined in the class body are non-enumerable — with constructor functions you had to set that up manually. And classes aren't hoisted the way function declarations are — you can't use a class before its definition. But the prototype chain they produce is identical to the manual version."`
    },
    {
      speaker: "you",
      text: `"What about the constructor itself — what's its job exactly?"`
    },
    {
      speaker: "raj",
      text: `"The constructor is the function that runs when you call new. Its one job is to set up the own properties of the instance — the properties that belong to that specific object, not the shared prototype. name, age, id — those go in the constructor. Methods go on the prototype, which in class syntax means just defining them in the class body outside the constructor. If you skip the constructor entirely, JavaScript provides an empty one for you automatically."`
    },
    {
      speaker: "you",
      text: `"And extends and super — how do those fit in?"`
    },
    {
      speaker: "raj",
      text: `"extends wires up the prototype chain — it's doing Object.create(Parent.prototype) automatically. super() inside the constructor is the Animal.call(this, ...) we wrote manually — it runs the parent constructor with 'this' pointing to your new instance. The critical rule: in a subclass constructor, you must call super() before you can touch 'this' at all. Try to use 'this' before super() and you get a ReferenceError. The reason is that until super() runs, 'this' doesn't exist yet — the parent constructor is what creates it."`
    },
    {
      speaker: "you",
      text: `"That's actually a really clear way to think about it. What about class fields — the ones you just write directly in the class body without being in a method?"`
    },
    {
      speaker: "raj",
      text: `"Class fields are shorthand for 'set this on every instance.' They're equivalent to writing this.x = value inside the constructor — they run per-instance, not once on the prototype. That distinction matters most with methods. A method defined in the class body goes on the prototype — one copy shared by all instances. A method assigned as a class field — like onClick = () => {} — gets its own copy on every single instance. The payoff is that the arrow function version permanently captures 'this', which makes it safe to detach and pass as a callback. The cost is memory."`
    },
    {
      type: "code",
      text: `// ── ES6 Class: full anatomy ──

class Animal {
  // Class field — runs per instance, same as this.legs = 4 in constructor
  legs = 4;

  // Private field — # makes it truly inaccessible outside the class
  #alive = true;

  // Static field — belongs to the class itself, not instances
  static kingdom = 'Animalia';

  constructor(name, sound) {
    this.name  = name;   // own properties — set per instance
    this.sound = sound;
  }

  // Prototype method — one copy, shared by all instances
  speak() {
    return \`\${this.name} says \${this.sound}\`;
  }

  // Getter — accessed like a property, runs a function
  get isAlive() { return this.#alive; }

  // Static method — called on the class, not on instances
  static create(name, sound) {
    return new Animal(name, sound);  // factory convenience
  }
}

const dog = new Animal('Rex', 'woof');
dog.speak();              // "Rex says woof"
dog.isAlive;              // true
dog.#alive;               // SyntaxError — private field
Animal.kingdom;           // 'Animalia'
Animal.create('Cat','meow'); // new Animal — via static factory
typeof Animal;            // 'function' — class IS a function under the hood

// ── Class methods are non-enumerable (unlike constructor function methods) ──
Object.keys(dog);                       // ['legs', 'name', 'sound'] — no 'speak'
dog.hasOwnProperty('speak');            // false — it's on Animal.prototype
dog.hasOwnProperty('legs');             // true  — class field is on the instance

// ── extends and super — the inheritance wiring ──
class Dog extends Animal {
  // Static field — inherited through the class chain
  #breed;

  constructor(name, breed) {
    super(name, 'woof');  // MUST call super() before touching 'this'
    // Before super(): 'this' does not exist — ReferenceError if accessed
    this.#breed = breed;
  }

  // Overrides the prototype method — same name, different behaviour
  speak() {
    const base = super.speak();  // call the parent's version
    return \`\${base}! (it's a \${this.#breed})\`;
  }

  fetch() { return \`\${this.name} fetches the ball\`; }
}

const rex = new Dog('Rex', 'Husky');
rex.speak();   // "Rex says woof! (it's a Husky)"
rex.fetch();   // "Rex fetches the ball"
rex.isAlive;   // true — inherited getter from Animal

// Prototype chain:
// rex → Dog.prototype → Animal.prototype → Object.prototype → null
Object.getPrototypeOf(Dog.prototype) === Animal.prototype;  // true

// ── Class field arrow vs prototype method: the 'this' difference ──
class Timer {
  count = 0;

  // Prototype method — 'this' depends on how it's called
  increment() { this.count++; }

  // Class field arrow — 'this' is permanently the instance
  incrementArrow = () => { this.count++; };
}

const t = new Timer();
const { increment, incrementArrow } = t;   // detach both

increment();       // TypeError or NaN — 'this' is lost, not the Timer
incrementArrow();  // t.count becomes 1 — arrow captured 'this' at creation

// Cost: every Timer instance gets its OWN copy of incrementArrow (memory)
// Benefit: safe to pass as a callback without .bind()
t.hasOwnProperty('incrementArrow');  // true  — it's on the instance
t.hasOwnProperty('increment');       // false — it's on Timer.prototype`
    },

    {
      speaker: "you",
      text: `"What about static — I use it sometimes but I'm not totally clear on when it makes sense versus just a regular method."`
    },
    {
      speaker: "raj",
      text: `"Static means 'this belongs to the class, not to any instance.' If the method doesn't need to read or write instance properties — this.name, this.age — it probably shouldn't be an instance method. Utility functions, factory methods, constants. The canonical example is a factory: User.create() that does validation before constructing. Another example: Math.random() — it's static because Math doesn't have instances. Calling new Math() makes no sense."`
    },
    {
      speaker: "you",
      text: `"And new.target — I've seen that in codebases and had no idea what it was for."`
    },
    {
      speaker: "raj",
      text: `"new.target tells you whether a function was called with new or without it. Inside a regular call it's undefined. Inside a new call it's the constructor being invoked. The classic use case: an abstract base class that should never be instantiated directly. In the constructor, check if new.target is the base class — if so, throw. It forces subclasses to be used instead. It's also how you detect if someone accidentally called your constructor without new."`
    },
    {
      type: "code",
      text: `// ── Static: class-level methods and properties ──

class User {
  static #count = 0;                      // private static — tracks all instances

  constructor(name, email) {
    this.name  = name;
    this.email = email;
    User.#count++;
  }

  // Static factory — validates before constructing
  static create(data) {
    if (!data.name)  throw new Error('Name required');
    if (!data.email) throw new Error('Email required');
    if (!/\S+@\S+\.\S+/.test(data.email)) throw new Error('Invalid email');
    return new User(data.name, data.email);
  }

  // Static utility — doesn't need 'this', doesn't need an instance
  static isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }

  // Static getter
  static get count() { return User.#count; }

  // Instance method — needs 'this'
  greet() { return \`Hello, I'm \${this.name}\`; }
}

User.create({ name: 'Alice', email: 'alice@example.com' });
User.isValidEmail('bad-email');  // false
User.count;                      // 1

// Static methods are NOT available on instances:
const alice = new User('Alice', 'alice@example.com');
alice.create;       // undefined — create is on User, not instances
alice.isValidEmail; // undefined

// Static inheritance — subclass inherits static methods
class AdminUser extends User {
  constructor(name, email, role) {
    super(name, email);
    this.role = role;
  }
}

AdminUser.isValidEmail('test@test.com'); // true — inherited static method
AdminUser.count;                         // inherited static getter

// ── new.target: detecting how a function was called ──

// Use case 1: force 'new' usage on a constructor function
function Connection(host) {
  if (!new.target) {
    // Called without new — fix it automatically or throw
    return new Connection(host);
  }
  this.host = host;
}
Connection('localhost');       // still works, new.target was undefined, auto-fixed
new Connection('localhost');   // normal path

// Use case 2: abstract base class — cannot be instantiated directly
class Shape {
  constructor(colour) {
    if (new.target === Shape) {
      throw new Error('Shape is abstract — use a subclass like Circle or Rectangle');
    }
    this.colour = colour;
  }
  area() { throw new Error('area() must be implemented'); }
}

class Circle extends Shape {
  constructor(radius, colour) {
    super(colour);        // new.target is Circle here, not Shape — no throw
    this.radius = radius;
  }
  area() { return Math.PI * this.radius ** 2; }
}

new Shape('red');    // Error: Shape is abstract
new Circle(5, 'red'); // works fine`
    },

    {
      speaker: "you",
      text: `"Can you show me a realistic class hierarchy — something that demonstrates inheritance, super, static, and private all together? I want to see how they interact."`
    },
    {
      speaker: "raj",
      text: `"Let's build a simple payment system. It's a good domain for inheritance because you have a base Charge class, and then specific types like CardCharge and BankCharge that share most of the logic but differ in one or two things. We'll see exactly where each feature earns its place."`
    },
    {
      type: "code",
      text: `// ── Realistic class hierarchy: payment system ──

class Charge {
  static #nextId = 1;

  #id;
  #status = 'pending';
  #createdAt;

  constructor(amount, currency = 'USD') {
    if (new.target === Charge) throw new Error('Charge is abstract');
    if (amount <= 0) throw new Error('Amount must be positive');

    this.#id        = Charge.#nextId++;
    this.amount     = amount;
    this.currency   = currency;
    this.#createdAt = new Date();
  }

  // Abstract method — subclasses must override
  process() { throw new Error('process() must be implemented'); }

  // Template method — orchestrates the flow, calls process() internally
  async execute() {
    if (this.#status !== 'pending') throw new Error('Already processed');
    try {
      this.#status = 'processing';
      const result = await this.process();   // calls the subclass version
      this.#status = 'succeeded';
      return result;
    } catch (err) {
      this.#status = 'failed';
      throw err;
    }
  }

  get id()     { return this.#id; }
  get status() { return this.#status; }

  toString() {
    return \`[\${this.constructor.name} #\${this.#id}] \${this.currency} \${this.amount} — \${this.#status}\`;
  }

  static get totalCreated() { return Charge.#nextId - 1; }
}

class CardCharge extends Charge {
  #cardToken;

  constructor(amount, cardToken, currency) {
    super(amount, currency);       // Charge sets id, status, amount
    this.#cardToken = cardToken;
  }

  // Override — provides the specific implementation
  async process() {
    // call Stripe/Adyen/etc. with this.#cardToken
    return { processor: 'stripe', token: this.#cardToken, amount: this.amount };
  }

  get last4() { return this.#cardToken.slice(-4); }
}

class BankCharge extends Charge {
  #accountNumber;
  #routingNumber;

  constructor(amount, accountNumber, routingNumber, currency) {
    super(amount, currency);
    this.#accountNumber = accountNumber;
    this.#routingNumber = routingNumber;
  }

  async process() {
    // call ACH/BACS network
    return { processor: 'ach', account: this.#accountNumber, amount: this.amount };
  }
}

// Usage:
const card = new CardCharge(99.99, 'tok_visa_4242', 'USD');
const bank = new BankCharge(500, '123456789', '021000021', 'USD');

await card.execute();  // calls CardCharge.process() internally
card.status;           // 'succeeded'
card.toString();       // "[CardCharge #1] USD 99.99 — succeeded"
card.last4;            // '4242'

Charge.totalCreated;   // 2 — static tracks across all subclasses

// new Charge(100)     → Error: Charge is abstract
// new CardCharge(-5, 'tok') → Error: Amount must be positive`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 4 — CLOSURES
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"Let's talk closures. I know the definition — 'a function that remembers its outer scope.' But I've failed closure questions in interviews and I don't fully know why."`
    },
    {
      speaker: "raj",
      text: `"The definition is right but there's a word in it that trips people up. 'Remembers' sounds like it took a snapshot — a copy of the values at the moment the function was created. That's wrong. A closure holds a live reference to the variables themselves. If the variable changes after the function was created, the function sees the new value when it runs. That's the insight everything else flows from."`
    },
    {
      speaker: "you",
      text: `"That's the var loop thing, right?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. Walk me through what you think is happening there."`
    },
    {
      speaker: "you",
      text: `"You have a for loop with var i, you push a function that returns i into an array, and they all return 3 instead of 0, 1, 2."`
    },
    {
      speaker: "raj",
      text: `"Why 3, though? Not 2, not undefined — specifically 3."`
    },
    {
      speaker: "you",
      text: `"Because... the loop ran three times, so i got incremented to 3, and then the loop condition i < 3 failed, so it stopped at 3?"`
    },
    {
      speaker: "raj",
      text: `"Exactly right. And because var is function-scoped — not block-scoped — there is one single i variable for the entire loop. All three closures are pointing at the same i. By the time any of the functions actually run, the loop is done and i is 3. They all see 3. let fixes this because let is block-scoped — each iteration of the loop creates a brand new i binding. Three separate variables, three separate closures, each pointing to a different one."`
    },
    {
      type: "code",
      text: `// ── Closure: live reference, not a copy ──

function makeCounter() {
  let count = 0;          // this variable lives in makeCounter's scope
  return {
    increment() { count++; },
    decrement() { count--; },
    value()     { return count; },
  };
}

const counter = makeCounter();
counter.increment();
counter.increment();
counter.value(); // 2

// 'count' is completely private — no external access
// The returned methods hold a LIVE reference to it — not a copy

// ── The classic loop bug — traced step by step ──
const funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(() => i);
  // Each function says "I'll return whatever i is when I'm called"
  // They all point at THE SAME i variable
}
// Loop ends → i === 3 (the condition i < 3 failed at i = 3)
funcs[0](); // 3 — not 0
funcs[1](); // 3 — not 1
funcs[2](); // 3 — not 2

// ── Fix 1: let — a new binding per iteration ──
const funcs2 = [];
for (let j = 0; j < 3; j++) {
  funcs2.push(() => j);
  // Each iteration: a brand new j variable is created
  // Each function points to a different j
}
funcs2[0](); // 0 ✓
funcs2[1](); // 1 ✓
funcs2[2](); // 2 ✓

// ── Fix 2: IIFE — capture the current value (pre-ES6 pattern) ──
const funcs3 = [];
for (var k = 0; k < 3; k++) {
  funcs3.push((function(captured) {
    return () => captured;  // closes over 'captured', a fresh param each call
  })(k));                   // immediately invoke with the current k
}
funcs3[0](); // 0 ✓

// ── Closures and memory — what gets kept alive ──
function outer() {
  const bigData = new Array(1_000_000).fill('x');
  const index   = 0;
  return () => bigData[index];   // inner closes over bigData AND index
}

const fn = outer();
// bigData cannot be garbage collected — fn still holds a reference
// This is a legitimate closure memory concern: fn keeps the array alive
// Set fn = null when done and bigData becomes eligible for GC

// ── Practical patterns ──

// 1. Module pattern — private state via IIFE
const bankAccount = (() => {
  let balance = 1000;  // private
  return {
    deposit(n)   { balance += n; },
    withdraw(n)  {
      if (n > balance) throw new Error('Insufficient funds');
      balance -= n;
    },
    getBalance() { return balance; },
  };
})();

bankAccount.balance;     // undefined — truly private
bankAccount.deposit(500);
bankAccount.getBalance(); // 1500

// 2. Memoisation — cache lives in the closure
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const factorial = memoize((n) => n <= 1 ? 1 : n * factorial(n - 1));
factorial(10); // computed
factorial(10); // returned from cache immediately`
    },

    // ── this in closures ──
    {
      speaker: "you",
      text: `"The place closures trip me up most is with 'this'. I write a method, I put a callback inside it, and suddenly 'this' is wrong. Why does going one level deeper break it?"`
    },
    {
      speaker: "raj",
      text: `"Because 'this' in JavaScript is not determined by where the function is written — it's determined by how it's called. You can write a function inside a class, but if someone calls it without going through the object, 'this' is gone. It's not lexical like closures are. It's dynamic. Arrow functions are the exception to this rule — they do capture 'this' lexically, from wherever they were defined. That's why using an arrow function in a callback inside a method fixes the problem."`
    },
    {
      speaker: "you",
      text: `"So every time I use 'this', I need to ask how this function will be called, not where it's written?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. That's the mental shift. And there are four specific rules that determine what 'this' is, in priority order. Let me give you all four because interviewers love to construct code that mixes them."`
    },
    {
      type: "code",
      text: `// ── The four rules that determine 'this' ──

// Rule 4 (lowest priority): Default binding
// Standalone function call → 'this' is undefined (strict) or global
function standalone() { return this; }
standalone();  // undefined in strict mode, globalThis otherwise

// Rule 3: Implicit binding
// Called as a method → 'this' is the object before the dot
const obj = { name: 'Alice', greet() { return this.name; } };
obj.greet();  // 'Alice' — this is obj

// Rule 2: Explicit binding — call / apply / bind
obj.greet.call({ name: 'Bob' });   // 'Bob'
obj.greet.apply({ name: 'Carol' }); // 'Carol'
const bound = obj.greet.bind({ name: 'Dana' });
bound();  // 'Dana'

// Rule 1 (highest priority): new binding
// Constructor call → 'this' is the new object
function Person(name) { this.name = name; }
const p = new Person('Eve');
p.name;  // 'Eve'

// ── Losing 'this' — the most common bug ──
class Timer {
  count = 0;
  start() {
    setInterval(function() {
      this.count++;  // ✗ 'this' is undefined — callback is a standalone call
    }, 1000);
  }
}

// ── Three fixes ──

// Fix 1: Arrow function (captures 'this' from start(), which is the Timer instance)
class Timer2 {
  count = 0;
  start() {
    setInterval(() => { this.count++; }, 1000);  // ✓
  }
}

// Fix 2: .bind(this)
class Timer3 {
  count = 0;
  start() {
    setInterval(function() { this.count++; }.bind(this), 1000);  // ✓
  }
}

// Fix 3: const self = this (oldest pattern — pre-arrow functions)
class Timer4 {
  count = 0;
  start() {
    const self = this;
    setInterval(function() { self.count++; }, 1000);  // ✓ 'self' is a regular variable
  }
}

// ── Arrow functions: 'this' is frozen at definition ──
const obj2 = {
  name: 'Alice',
  getArrow() {
    return () => this.name;   // 'this' captured from getArrow()'s context
  }
};

const arrow = obj2.getArrow();
arrow();  // 'Alice' — even though arrow is now detached from obj2

// Arrow functions completely ignore call/apply/bind for 'this':
arrow.call({ name: 'Bob' }); // still 'Alice' — can't override arrow's 'this'`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 5 — CALL, APPLY, BIND
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"call, apply, bind — I always mix them up under pressure. What's the one-line version of each?"`
    },
    {
      speaker: "raj",
      text: `"call: invoke now, arguments listed one by one. apply: invoke now, arguments as an array. bind: don't invoke — return a new function with 'this' permanently locked. Once that's in your head, everything else is just knowing when to reach for which one."`
    },
    {
      speaker: "you",
      text: `"Why would apply ever be useful if you can just spread an array with call?"`
    },
    {
      speaker: "raj",
      text: `"Today, with spread syntax, apply is mostly legacy. But apply predates spread by many years. The classic use case was Math.max on an array — Math.max doesn't accept an array, it wants separate arguments. apply let you spread an array before spread syntax existed. You'll still see it in older codebases. And knowing how to implement all three from scratch is a common interview ask — it tests whether you actually understand what they do."`
    },
    {
      type: "code",
      text: `// ── call, apply, bind — side by side ──

function introduce(greeting, punctuation) {
  return \`\${greeting}, I'm \${this.name}\${punctuation}\`;
}
const alice = { name: 'Alice' };

introduce.call(alice, 'Hello', '!');       // "Hello, I'm Alice!" — args one by one
introduce.apply(alice, ['Hello', '!']);    // "Hello, I'm Alice!" — args as array
const greetAlice = introduce.bind(alice, 'Hello'); // returns new fn, doesn't call
greetAlice('!');                           // "Hello, I'm Alice!" — called later

// Mnemonic:
// call  → Comma-separated args
// apply → Array of args
// bind  → Bound function returned

// ── Implementing call from scratch ──
Function.prototype.myCall = function(context, ...args) {
  context    = context ?? globalThis;    // null/undefined → global
  const sym  = Symbol('fn');            // unique key to avoid collisions
  context[sym] = this;                  // attach fn as a method temporarily
  const result = context[sym](...args); // call — now 'this' inside fn is context
  delete context[sym];                  // clean up
  return result;
};

introduce.myCall(alice, 'Hi', '?');  // "Hi, I'm Alice?"

// ── Implementing apply from scratch ──
Function.prototype.myApply = function(context, args = []) {
  context    = context ?? globalThis;
  const sym  = Symbol('fn');
  context[sym] = this;
  const result = context[sym](...args);
  delete context[sym];
  return result;
};

// ── Implementing bind from scratch ──
Function.prototype.myBind = function(context, ...partialArgs) {
  const fn = this;  // 'this' is the function being bound
  return function(...laterArgs) {
    // Merge partial args + later args, then call with locked context
    return fn.apply(context, [...partialArgs, ...laterArgs]);
  };
};

const hi = introduce.myBind(alice, 'Hey');
hi('.');  // "Hey, I'm Alice."

// ── Real-world uses ──

// 1. Borrowing array methods for array-like objects
function logArgs() {
  // 'arguments' is array-like — no map, filter, etc.
  const arr = Array.prototype.slice.call(arguments);
  // modern alternative: Array.from(arguments) or [...arguments]
  return arr.map(x => x * 2);
}
logArgs(1, 2, 3);  // [2, 4, 6]

// 2. Math.max on an array (pre-spread pattern)
const nums = [3, 1, 4, 1, 5, 9];
Math.max.apply(null, nums);  // 9
Math.max(...nums);           // 9 — modern equivalent

// 3. Borrowing a method from a completely different object
const borrower = { name: 'Bob' };
introduce.call(borrower, 'Sup', '~');  // "Sup, I'm Bob~"

// ── Interview trap: bind on an arrow function does nothing ──
const arrow = () => this;
const boundArrow = arrow.bind({ name: 'Alice' });
boundArrow();  // same as arrow() — 'this' of an arrow cannot be changed
// call, apply, bind are all ignored for 'this' on arrow functions`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 6 — FACTORY FUNCTIONS
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"Factory functions — I always just reach for a class. Is there a real argument for factories or is it just a style preference?"`
    },
    {
      speaker: "raj",
      text: `"There are three concrete advantages. First: no 'this' confusion — a factory is just a function that returns an object. You're working with regular variables and closures, not with dynamic 'this'. Second: private state comes for free — anything you declare inside the factory and don't put on the returned object is private. No WeakMaps, no # syntax, no workarounds. Third: no 'new' — which means calling a factory without new doesn't silently produce undefined behaviour. It just works."`
    },
    {
      speaker: "you",
      text: `"What's the downside?"`
    },
    {
      speaker: "raj",
      text: `"Memory. Methods on a class prototype are shared — one copy across every instance. Methods inside a factory are re-created per instance. Ten thousand instances means ten thousand copies of every method. For most use cases it doesn't matter, but it's a legitimate trade-off to know about. The fix is sharing methods via an explicit prototype-like object — you get the best of both."`
    },
    {
      speaker: "you",
      text: `"And composition — I've heard the phrase 'favour composition over inheritance' but I've never seen what that looks like in practice."`
    },
    {
      speaker: "raj",
      text: `"Inheritance says 'a Dog IS-A Animal.' Composition says 'a Duck HAS-A swim capability and HAS-A fly capability.' Instead of building a hierarchy, you build small behaviour units and mix them into objects that need them. Factory functions are perfect for this because there's no prototype chain getting in the way. You just merge the behaviours you want."`
    },
    {
      type: "code",
      text: `// ── Factory function: private state, no 'this', no 'new' ──

const createUser = (name, email) => {
  // Private — no way to access these from outside
  let loginCount = 0;
  const createdAt = new Date();

  return {
    name,
    email,
    login() {
      loginCount++;
      return \`\${name} logged in. Total: \${loginCount}\`;
    },
    getStats() {
      return { loginCount, createdAt, name };
    },
  };
};

const user = createUser('Alice', 'alice@example.com');
user.login();       // "Alice logged in. Total: 1"
user.loginCount;    // undefined — it's private
user.getStats();    // { loginCount: 1, ... }

// No 'new' needed — works exactly the same:
const user2 = createUser('Bob', 'bob@example.com');

// ── Memory: shared methods via Object.create ──
const userMethods = {
  greet()    { return \`Hi, I'm \${this.name}\`; },
  toString() { return \`[User: \${this.name}]\`; },
};

const createUserFast = (name, email) =>
  Object.assign(Object.create(userMethods), { name, email });
  // Object.create(userMethods) → prototype IS userMethods (methods shared)
  // Object.assign → adds own properties (name, email)

const u1 = createUserFast('Alice', 'a@a.com');
const u2 = createUserFast('Bob',   'b@b.com');

u1.greet === u2.greet;                     // true — same function reference
Object.getPrototypeOf(u1) === userMethods; // true

// ── Composition: mixing in behaviours ──
// Each "mixin" takes an object and adds a capability
const canSwim  = (obj) => ({ ...obj, swim()  { return \`\${obj.name} swims\`;  } });
const canFly   = (obj) => ({ ...obj, fly()   { return \`\${obj.name} flies\`;  } });
const canBark  = (obj) => ({ ...obj, bark()  { return \`\${obj.name} barks\`;  } });
const canQuack = (obj) => ({ ...obj, quack() { return \`\${obj.name} quacks\`; } });

// Compose exactly the capabilities each type needs
const createDuck  = (name) => canSwim(canFly(canQuack({ name })));
const createDog   = (name) => canSwim(canBark({ name }));
const createFish  = (name) => canSwim({ name });

const duck = createDuck('Donald');
duck.swim();   // "Donald swims"
duck.fly();    // "Donald flies"
duck.quack();  // "Donald quacks"

// No inheritance hierarchy. No 'what if I need a FlyingFish?' problem.
// You just compose: const createFlyingFish = (name) => canSwim(canFly({ name }))`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 7 — CURRYING
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"Currying. I know it transforms a multi-argument function into a chain of single-argument functions. But every time I have to implement the general version in an interview my mind goes blank."`
    },
    {
      speaker: "raj",
      text: `"The implementation looks intimidating but the logic is actually very simple once you see it. You have a function that expects some number of arguments — say three. If you've given it three or more, call it. If you've given it fewer, return a new function that collects more. That's the whole thing. The implementation is just recursion over that idea."`
    },
    {
      speaker: "you",
      text: `"How does it know how many arguments the function expects?"`
    },
    {
      speaker: "raj",
      text: `"fn.length — every function has a length property that tells you how many parameters it was declared with. That's your target. Compare args collected so far against fn.length. If you're at or over — fire. If not — return another collector function."`
    },
    {
      type: "code",
      text: `// ── Manual currying ──

// Original
const add = (a, b, c) => a + b + c;

// Manually curried — each step returns a function
const curriedAdd = (a) => (b) => (c) => a + b + c;

curriedAdd(1)(2)(3); // 6
const add1 = curriedAdd(1);    // waiting for b and c
const add1and2 = add1(2);      // waiting for c
add1and2(3);                   // 6

// ── General curry — works for any function ──
const curry = (fn) => {
  return function curried(...args) {
    if (args.length >= fn.length) {
      // Enough arguments — call the original
      return fn.apply(this, args);
    }
    // Not enough — return a collector that merges args
    return function(...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
};

const multiply = curry((a, b, c) => a * b * c);

multiply(2)(3)(4);    // 24 — one at a time
multiply(2, 3)(4);    // 24 — two then one
multiply(2)(3, 4);    // 24 — one then two
multiply(2, 3, 4);    // 24 — all at once (fn.length === args.length, fires immediately)

const double   = multiply(2);      // waiting for b and c
const sixTimes = multiply(2, 3);   // waiting for c

double(3)(4);   // 24
sixTimes(10);   // 60

// ── Practical uses ──

// 1. Specialised loggers from a general one
const log = curry((level, service, message) =>
  console.log(\`[\${level}] [\${service}] \${message}\`)
);

const error  = log('ERROR');
const warn   = log('WARN');
const orderError = error('order-service');  // level + service baked in

orderError('Payment failed');    // [ERROR] [order-service] Payment failed
warn('payment-service')('Slow response time'); // [WARN] [payment-service] Slow response time

// 2. Reusable data transformations
const filter = curry((pred, arr) => arr.filter(pred));
const map    = curry((fn, arr)   => arr.map(fn));

const adults   = filter(u => u.age >= 18);
const getNames = map(u => u.name);

const users = [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 15 }];
getNames(adults(users));  // ['Alice']

// 3. Validation builder
const validate = curry((rules, value) => rules.every(r => r(value)));

const required = v => v != null && v !== '';
const minLen   = curry((n, v) => v.length >= n);
const isEmail  = v => /\S+@\S+\.\S+/.test(v);

const validateEmail = validate([required, isEmail]);
const validatePw    = validate([required, minLen(8)]);

validateEmail('alice@example.com'); // true
validateEmail('bad');               // false
validatePw('short');                // false
validatePw('longpassword');         // true

// ── Currying vs partial application ──
// Strict currying: always one argument at a time → f(a)(b)(c)
// Partial application: fix some, pass rest later → f(a)(b, c)
// Our curry() implementation does both — it accepts 1 or more at each step`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 8 — GENERATOR FUNCTIONS
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"Generators. I've seen function* and yield but I've never written one. I don't really get what they're for."`
    },
    {
      speaker: "raj",
      text: `"A normal function runs to completion every time you call it. A generator is a function that can pause in the middle and hand back control — and then resume from exactly where it left off the next time you ask it to. The mechanism is the yield keyword: it sends a value out, and the function freezes until someone says 'continue.'"`
    },
    {
      speaker: "you",
      text: `"Who says continue?"`
    },
    {
      speaker: "raj",
      text: `"You do. Calling a generator function doesn't run any code — it gives you an iterator object. That iterator has a next() method. Every time you call next(), the generator runs until it hits a yield, hands back the yielded value, and pauses again. When you call next() again, it picks up from where it stopped. This is called lazy evaluation — values are produced one at a time, only when asked for."`
    },
    {
      speaker: "you",
      text: `"And what's the practical reason to want that?"`
    },
    {
      speaker: "raj",
      text: `"Sequences that would be infinite or very large to precompute. Traversing trees node by node without building up a stack of recursive calls. Making objects iterable — anything that needs to work with for...of. And historically, generators are what async/await is built on top of. Understanding generators is understanding how await actually suspends a function without blocking the thread."`
    },
    {
      type: "code",
      text: `// ── Generator basics: pause and resume ──

function* count() {
  console.log('A');
  yield 1;              // pause here, send 1 out
  console.log('B');
  yield 2;              // pause here, send 2 out
  console.log('C');
  // no more yields — generator finishes
}

const gen = count();    // function body has NOT run yet

gen.next(); // logs 'A', returns { value: 1, done: false }
gen.next(); // logs 'B', returns { value: 2, done: false }
gen.next(); // logs 'C', returns { value: undefined, done: true }
gen.next(); // { value: undefined, done: true } — stays exhausted

// ── Infinite sequence — lazy, only computes when asked ──
function* naturals(start = 1) {
  let n = start;
  while (true) { yield n++; }  // infinite loop is fine — pauses at each yield
}

const take = (n, gen) => {
  const result = [];
  for (const val of gen) {     // for...of calls .next() automatically
    result.push(val);
    if (result.length === n) break;
  }
  return result;
};

take(5, naturals());    // [1, 2, 3, 4, 5]
take(3, naturals(10));  // [10, 11, 12]

// ── Two-way communication: passing values in with next(value) ──
function* adder() {
  let total = 0;
  while (true) {
    const n = yield total;     // sends total out, receives the next input
    if (n === null) return total;
    total += n;
  }
}

const a = adder();
a.next();       // start it — { value: 0, done: false }
a.next(10);     // send 10 in → total = 10 → { value: 10, done: false }
a.next(20);     // send 20 in → total = 30 → { value: 30, done: false }
a.next(null);   // signal done → { value: 30, done: true }

// ── Making a class iterable with Symbol.iterator ──
class Range {
  constructor(start, end, step = 1) {
    this.start = start;
    this.end   = end;
    this.step  = step;
  }

  // Symbol.iterator makes the class work with for...of, spread, destructuring
  *[Symbol.iterator]() {
    for (let i = this.start; i <= this.end; i += this.step) {
      yield i;
    }
  }
}

const range = new Range(1, 10, 2);  // 1, 3, 5, 7, 9
[...range];                          // [1, 3, 5, 7, 9]
for (const n of range) {}           // works with for...of
Math.max(...range);                  // 9

// ── yield* — delegate to another generator ──
function* flatten(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) yield* flatten(item);  // recurse into sub-generator
    else yield item;
  }
}

[...flatten([1, [2, [3, 4]], 5])]; // [1, 2, 3, 4, 5]

// ── How async/await is built on generators ──
// async/await = generators + promises + automatic runner

// Generator version (what the engine essentially does under the hood):
function* fetchData(userId) {
  const user  = yield fetch(\`/users/\${userId}\`).then(r => r.json());
  const posts = yield fetch(\`/posts?user=\${user.id}\`).then(r => r.json());
  return { user, posts };
}

// A 'runner' that drives the generator, resolving each yielded promise:
function run(genFn) {
  const gen = genFn();
  const step = (val) => {
    const { value, done } = gen.next(val);
    if (done) return Promise.resolve(value);
    return Promise.resolve(value).then(step);
  };
  return step();
}

// The async/await version does exactly this, with built-in syntax:
async function fetchDataAsync(userId) {
  const user  = await fetch(\`/users/\${userId}\`).then(r => r.json());
  const posts = await fetch(\`/posts?user=\${user.id}\`).then(r => r.json());
  return { user, posts };
}
// They are equivalent. async/await is sugar over this generator + runner pattern.`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 9 — OOP (THE FOUR PILLARS IN JAVASCRIPT)
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"OOP. I can recite encapsulation, abstraction, inheritance, polymorphism. But in a JavaScript-specific interview I'm never sure how to demonstrate them properly."`
    },
    {
      speaker: "raj",
      text: `"The problem is that most OOP teaching is language-agnostic. Let's pin each pillar to the specific JavaScript tools for it. Encapsulation: closures or # private fields — take your pick. Abstraction: expose a clean public interface, hide everything else in private methods. Inheritance: the prototype chain, which in modern code means classes with extends. Polymorphism: method overriding on subclasses, or duck typing — if it has the right method, it works, regardless of its type."`
    },
    {
      speaker: "you",
      text: `"Duck typing — I've heard the phrase but I'm not sure what it means."`
    },
    {
      speaker: "raj",
      text: `"'If it walks like a duck and quacks like a duck, treat it as a duck.' In JavaScript, that means you don't check the type of an object — you check whether it has the method you need. A function that calls animal.speak() works with any object that has a speak method. Doesn't matter if it's a Dog, a Cat, or a plain object with speak on it. No shared class required. JavaScript doesn't enforce interfaces like TypeScript does — you just call the method and trust it's there."`
    },
    {
      type: "code",
      text: `// ── Encapsulation: private state ──

// Option A: closure (true privacy, no syntax support needed)
const createAccount = (initialBalance) => {
  let balance = initialBalance;

  return {
    deposit(n)   { balance += n; },
    withdraw(n)  {
      if (n > balance) throw new Error('Insufficient funds');
      balance -= n;
    },
    get balance() { return balance; },  // read-only getter
  };
};

const acc = createAccount(100);
acc.deposit(50);
acc.balance;          // 150
acc.balance = 9999;   // silently fails — getter has no setter

// Option B: # private class fields (ES2022+, truly private to the class)
class BankAccount {
  #balance;
  #txLog = [];

  constructor(initial) { this.#balance = initial; }

  deposit(n)  {
    this.#balance += n;
    this.#txLog.push({ type: 'deposit', n, at: new Date() });
  }
  withdraw(n) {
    if (n > this.#balance) throw new Error('Insufficient funds');
    this.#balance -= n;
    this.#txLog.push({ type: 'withdraw', n, at: new Date() });
  }

  get balance() { return this.#balance; }
  get history() { return [...this.#txLog]; }  // return copy — prevent external mutation
}

const account = new BankAccount(1000);
account.#balance;  // SyntaxError — not just convention, actually inaccessible

// ── Abstraction: clean interface, hidden implementation ──
class EmailService {
  // Public — callers see only this
  async send(to, subject, body) {
    const clean = this.#sanitise(body);
    const addr  = this.#validateAddress(to);
    return this.#dispatch(addr, subject, clean);
  }

  // Private — implementation detail, subject to change
  // #sanitise(body)        { return body.replace(new RegExp('<script>', 'gi'), '') }
  #validateAddress(addr) {
    if (!/\S+@\S+/.test(addr)) throw new Error('Invalid email');
    return addr.trim().toLowerCase();
  }
  async #dispatch(to, subject, body) { /* SMTP logic */ }
}

// Caller does: emailService.send('a@b.com', 'Hi', 'Hello!')
// No knowledge of sanitise, validateAddress, or dispatch needed

// ── Inheritance: prototype chain via class ──
class Shape {
  constructor(colour) { this.colour = colour; }
  area()     { throw new Error('Subclass must implement area()'); }
  toString() { return \`\${this.constructor.name}(\${this.colour}): area=\${this.area().toFixed(2)}\`; }
}

class Circle extends Shape {
  constructor(r, colour) { super(colour); this.r = r; }
  area() { return Math.PI * this.r ** 2; }
}

class Rectangle extends Shape {
  constructor(w, h, colour) { super(colour); this.w = w; this.h = h; }
  area() { return this.w * this.h; }
}

class Triangle extends Shape {
  constructor(base, height, colour) { super(colour); this.base = base; this.height = height; }
  area() { return 0.5 * this.base * this.height; }
}

// ── Polymorphism: same interface, different behaviour ──
const shapes = [
  new Circle(5, 'red'),
  new Rectangle(4, 6, 'blue'),
  new Triangle(3, 8, 'green'),
];

// All three respond to area() and toString() — each differently
shapes.forEach(s => console.log(s.toString()));
// "Circle(red): area=78.54"
// "Rectangle(blue): area=24.00"
// "Triangle(green): area=12.00"

const totalArea = shapes.reduce((sum, s) => sum + s.area(), 0);

// ── Duck typing — polymorphism without inheritance ──
// Any object with a speak() method works here — no shared class required
const makeNoise = (entity) => entity.speak();

makeNoise(new Dog('Rex'));         // uses Dog's speak
makeNoise({ speak: () => 'Moo' }); // plain object — no class, no extends
makeNoise({ speak: () => 'Beep' }); // works — it has speak()

// ── Mixins: composition with classes ──
// When you want to share behaviour without inheriting from a single parent
const Serialisable = (Base) => class extends Base {
  serialise()   { return JSON.stringify(this); }
  static parse(json) { return Object.assign(new this(), JSON.parse(json)); }
};

const Timestamped = (Base) => class extends Base {
  constructor(...args) {
    super(...args);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  touch() { this.updatedAt = new Date(); }
};

class BaseUser {
  constructor(name) { this.name = name; }
}

class User extends Timestamped(Serialisable(BaseUser)) {
  constructor(name, email) { super(name); this.email = email; }
}

const u = new User('Alice', 'alice@example.com');
u.serialise();   // '{"name":"Alice","email":"...","createdAt":"...","updatedAt":"..."}'
u.touch();       // updates updatedAt`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 10 — TRICKY INTERVIEW QUESTIONS
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"Can we do the tricky code trace questions now? The ones that mix all of this together? Those are what actually show up in interviews and I want to be able to answer without running the code."`
    },
    {
      speaker: "raj",
      text: `"Good instinct. The point of those questions isn't to catch you out — it's to see if you can hold multiple concepts in your head at the same time and reason through them. Let's do eight. After each one, I'll give you not just the answer but the chain of reasoning, so you can apply it to questions you've never seen before."`
    },
    {
      type: "code",
      text: `// ══════════════════════════════════════════════════════════
// TRICKY INTERVIEW QUESTIONS — trace without running
// ══════════════════════════════════════════════════════════

// ─── Q1: Detached method — what does this log? ───
function Person(name) { this.name = name; }
Person.prototype.getName = function() { return this.name; };

const alice = new Person('Alice');
const getName = alice.getName;  // detach from alice

getName();          // ?
alice.getName();    // ?

// Answer:
// getName()       → undefined (or TypeError in strict mode)
//   Rule: standalone call → default binding
//   'this' is undefined (strict) or globalThis
//   globalThis.name is undefined
// alice.getName() → 'Alice'
//   Rule: method call → implicit binding, 'this' is alice

// ─── Q2: Arrow inside a method ───
const obj = {
  value: 42,
  outer() {
    const inner = () => this.value;  // arrow — 'this' from outer()'s context
    return inner;
  }
};

const fn1 = obj.outer();
fn1();  // ?

const { outer } = obj;
const fn2 = outer();
fn2();  // ?

// Answer:
// fn1() → 42
//   obj.outer() is a method call — 'this' inside outer is obj
//   Arrow captures that — inner's 'this' is locked to obj
//   fn1() → obj.value → 42
//
// fn2() → undefined
//   outer() is a standalone call — 'this' is undefined/global
//   Arrow captures undefined
//   fn2() → undefined.value → TypeError (strict) / undefined

// ─── Q3: Classic loop bug — predict all three ───
const funcs = [];
for (var i = 0; i < 3; i++) {
  funcs[i] = () => i;
}
console.log(funcs[0](), funcs[1](), funcs[2]()); // ?

// Answer: 3 3 3
// var is function-scoped — one i variable, shared by all three closures
// Loop ends when i === 3 (condition i < 3 fails)
// All three functions see the same i — which is now 3

// ─── Q4: instanceof after prototype reassignment ───
function Foo() {}
const foo = new Foo();

Foo.prototype = { newMethod() {} };  // reassign AFTER creating foo

console.log(foo instanceof Foo);  // ?

// Answer: false
// instanceof checks: is Foo.prototype in foo's prototype chain?
// foo.__proto__ still points to the ORIGINAL Foo.prototype object
// Foo.prototype was REPLACED with a new object
// Original prototype is no longer at Foo.prototype
// → foo.__proto__ !== Foo.prototype → false

// ─── Q5: Class field arrow vs prototype method ───
class Counter {
  count = 0;
  increment   = () => { this.count++; };  // class field — per instance
  decrement() { this.count--; }           // prototype method — shared
}

const c = new Counter();
const { increment, decrement } = c;       // detach both

increment();  // does this work?
decrement();  // does this work?
console.log(c.count);  // ?

// Answer: c.count === 1 (not 0, not -1)
// increment is a class field arrow — defined per instance
//   'this' is permanently locked to c at creation
//   increment() → c.count++ → c.count = 1 ✓
// decrement is a prototype method — 'this' is dynamic
//   decrement() standalone → 'this' is undefined
//   undefined.count-- → TypeError in strict mode
//   (or NaN if not strict — the global count or undefined minus 1)

// ─── Q6: Object.create chain — trace the lookups ───
const base = { type: 'base', describe() { return \`I am \${this.type}\`; } };
const mid  = Object.create(base);
mid.type   = 'mid';

const top  = Object.create(mid);
// top has no own properties

console.log(top.type);                      // ?
console.log(top.describe());                // ?
console.log(top.hasOwnProperty('type'));    // ?
console.log(mid.hasOwnProperty('type'));    // ?

// Answer:
// top.type → 'mid'
//   top has no 'type' → check mid → found 'mid' ✓
// top.describe() → "I am mid"
//   top has no 'describe' → check mid → not there → check base → found
//   Called on top, so 'this' is top
//   top.type → walks chain → 'mid'
//   → "I am mid"
// top.hasOwnProperty('type')  → false (type is on mid, not top)
// mid.hasOwnProperty('type')  → true  (type IS on mid itself)

// ─── Q7: Generator with two-way communication ───
function* gen() {
  const x = yield 1;      // yield 1 out, receive something back as x
  const y = yield x + 2;  // yield x+2 out, receive something back as y
  return x + y;
}

const g = gen();
console.log(g.next());      // ?
console.log(g.next(10));    // ?
console.log(g.next(20));    // ?

// Answer:
// g.next()    → { value: 1, done: false }
//   Runs to first yield → sends out 1
//   x is not yet assigned (the value sent via NEXT next() call sets x)
//
// g.next(10)  → { value: 12, done: false }
//   The 10 is the return value of 'yield 1' → x = 10
//   Runs to second yield: x + 2 = 12 → sends out 12
//
// g.next(20)  → { value: 30, done: true }
//   The 20 is the return value of 'yield x+2' → y = 20
//   return x + y = 10 + 20 = 30 → done

// ─── Q8: Combining bind, closure, and class ───
class Greeter {
  constructor(greeting) {
    this.greeting = greeting;
    this.greet = this.greet.bind(this);  // bound in constructor
  }
  greet(name) { return \`\${this.greeting}, \${name}!\`; }
}

const g1 = new Greeter('Hello');
const g2 = new Greeter('Hi');

const fn = g1.greet;
console.log(fn('Alice'));              // ?
console.log(fn.call(g2, 'Alice'));     // ?

// Answer:
// fn('Alice') → "Hello, Alice!"
//   fn is g1.greet which was bound to g1 in the constructor
//   Bound functions ignore implicit binding — 'this' is always g1
//   g1.greeting = 'Hello' → "Hello, Alice!"
//
// fn.call(g2, 'Alice') → "Hello, Alice!"  (NOT "Hi, Alice!")
//   Bound functions also ignore explicit binding (call/apply/bind)
//   Once bound, 'this' cannot be changed — call(g2) is ignored
//   Still g1 → still 'Hello'`
    },

    // ══════════════════════════════════════════════════════════════
    // SECTION 11 — IMPLEMENTATIONS
    // ══════════════════════════════════════════════════════════════

    {
      speaker: "you",
      text: `"There's one more type of question I keep seeing — 'implement X from scratch.' Deep clone, event emitter, debounce. Is there a way to approach those systematically instead of trying to remember the answer?"`
    },
    {
      speaker: "raj",
      text: `"Yes. Break the problem into its requirements before you write a line of code. Deep clone: what types do I need to handle? Primitives, objects, arrays, special types like Date and Map, and circular references. List them out, then handle them one by one. Event emitter: what operations do I need? Subscribe, unsubscribe, publish, one-time subscribe. Each one follows from the data structure you pick. If you think before you write, the code almost writes itself."`
    },
    {
      speaker: "you",
      text: `"And circular references in deep clone — that's the part I always forget."`
    },
    {
      speaker: "raj",
      text: `"WeakMap. Before you recurse into an object, register it in the WeakMap with its clone. If you encounter an object you've already seen, return the clone you already made. That's it. Two lines. But if you don't think about it before writing, you'll end up with infinite recursion and a confused interviewer."`
    },
    {
      type: "code",
      text: `// ── Implementations interviewers actually ask for ──

// ─── 1. Deep clone ───
const deepClone = (val, seen = new WeakMap()) => {
  // Primitives: return as-is
  if (val === null || typeof val !== 'object') return val;

  // Circular reference: return the clone we already made
  if (seen.has(val)) return seen.get(val);

  // Special object types
  if (val instanceof Date)   return new Date(val);
  if (val instanceof RegExp) return new RegExp(val.source, val.flags);

  if (val instanceof Map) {
    const clone = new Map();
    seen.set(val, clone);  // register BEFORE recursing
    val.forEach((v, k) => clone.set(deepClone(k, seen), deepClone(v, seen)));
    return clone;
  }

  if (val instanceof Set) {
    const clone = new Set();
    seen.set(val, clone);
    val.forEach(v => clone.add(deepClone(v, seen)));
    return clone;
  }

  // Arrays and plain objects
  const clone = Array.isArray(val) ? [] : Object.create(Object.getPrototypeOf(val));
  seen.set(val, clone);  // register BEFORE recursing (circular ref safety)

  for (const key of [...Object.keys(val), ...Object.getOwnPropertySymbols(val)]) {
    clone[key] = deepClone(val[key], seen);
  }
  return clone;
};

// Test:
const original = { a: 1, b: { c: 2 }, arr: [3, 4], date: new Date() };
original.self = original;                 // circular reference
const cloned = deepClone(original);
cloned.b.c = 99;
original.b.c;  // 2 — independent deep copy, circular ref handled

// ─── 2. EventEmitter ───
class EventEmitter {
  #listeners = new Map();

  on(event, listener) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(listener);
    return () => this.off(event, listener);  // returns unsubscribe fn
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);  // auto-remove after first call
    };
    return this.on(event, wrapper);
  }

  off(event, listener) {
    this.#listeners.get(event)?.delete(listener);
  }

  emit(event, ...args) {
    this.#listeners.get(event)?.forEach(fn => fn(...args));
  }
}

const emitter = new EventEmitter();
const unsub = emitter.on('data', x => console.log(x));
emitter.emit('data', 42);   // 42
unsub();                     // unsubscribe
emitter.emit('data', 99);   // nothing

// ─── 3. Debounce and throttle ───

// Debounce: only fires AFTER the user has stopped for 'delay' ms
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
// Use case: search input — only queries API 300ms after user stops typing

// Throttle: fires at most once per 'interval' ms, no matter how many calls
const throttle = (fn, interval) => {
  let lastRun = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRun >= interval) {
      lastRun = now;
      return fn(...args);
    }
  };
};
// Use case: scroll handler — process at most every 100ms regardless of scroll speed

// ─── 4. Compose and pipe ───
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);
const pipe    = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

// compose: right-to-left  compose(f, g, h)(x) = f(g(h(x)))
// pipe:    left-to-right  pipe(f, g, h)(x)    = h(g(f(x)))

const add1   = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

pipe(add1, double, square)(3);     // square(double(add1(3))) = square(8) = 64
compose(square, double, add1)(3);  // same result, reversed function order

// ─── 5. Promise.all from scratch ───
const myPromiseAll = (promises) => {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) return resolve([]);
    const results = new Array(promises.length);
    let remaining = promises.length;

    promises.forEach((p, i) => {
      Promise.resolve(p).then(val => {
        results[i] = val;
        if (--remaining === 0) resolve(results);
      }).catch(reject);   // first rejection rejects the whole thing
    });
  });
};

// ─── 6. Flatten ───
const flatten = (arr, depth = Infinity) => {
  if (depth === 0) return arr.slice();
  return arr.reduce((flat, item) =>
    flat.concat(Array.isArray(item) ? flatten(item, depth - 1) : item)
  , []);
};

flatten([1, [2, [3, [4]]]]);      // [1, 2, 3, 4]
flatten([1, [2, [3, [4]]]], 1);   // [1, 2, [3, [4]]]`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Okay. We covered a lot. Objects and descriptors, prototype chain, ES6 classes and constructors in depth, closures, 'this', call/apply/bind, factory functions, currying, generators, OOP, tricky questions, and common implementations. Which one changed the most for you?"`
    },
    {
      speaker: "you",
      text: `"Definitely prototype and classes together. I used classes constantly without understanding that they're just cleaner syntax for the same constructor-function-plus-Object.create wiring we did manually. And understanding 'new' as four explicit steps — that makes constructor behaviour so much less mysterious. The super-before-this rule actually makes sense now."`
    },
    {
      speaker: "raj",
      text: `"That's the right insight. 'this' doesn't exist in a subclass until super() runs — because super() is what creates it. Once you have that, the ReferenceError you get for accessing 'this' before super becomes obvious rather than confusing. What about closures?"`
    },
    {
      speaker: "you",
      text: `"Live reference, not a copy. That's the sentence I was missing. And once I have that, the loop bug explains itself — there's one var, it changes, all closures see the change. Before I just knew 'use let instead of var in loops' without understanding why."`
    },
    {
      speaker: "raj",
      text: `"That's exactly the level you want to be at for interviews. Not just 'what do I do' — but 'why does doing that fix the problem.' When you can explain the why, you can answer questions you've never seen before, because you're reasoning from first principles rather than pattern-matching to something you memorised. Prototype, 'this', closures — those three are the engine. Everything else is built on top of them."`
    },
    {
      speaker: "you",
      text: `"One thing that really helped was implementing things from scratch — myNew, myCall, myBind, curry. Once I write it, I can't un-know it."`
    },
    {
      speaker: "raj",
      text: `"That's the point of those exercises. You can't fake understanding when you're building the thing itself. If you can implement 'new', you know what 'new' does. If you can implement curry, you know what curry does. That's the bar."`
    },

    {
      type: "summary",
      points: [
        "Every object property has a hidden descriptor with four flags: value, writable, enumerable, and configurable. Object.defineProperty sets these explicitly. Object.freeze makes properties non-writable and non-configurable but is shallow — nested objects are still mutable. Object.seal prevents adding and deleting properties but leaves existing ones writable. The new keyword does four steps: creates an empty object, sets its prototype to Constructor.prototype, calls the constructor with 'this' as the new object, and returns the new object unless the constructor explicitly returns a different object.",
        "Every object has a __proto__ link to its prototype. Property lookups walk this chain until the property is found or null is reached. The .prototype property on functions is the object that becomes __proto__ of instances. Object.getPrototypeOf is the correct way to inspect the chain. hasOwnProperty returns true only for own properties. instanceof walks the chain looking for Constructor.prototype — it returns false if the prototype is reassigned after the instance is created. Class syntax produces an identical prototype chain to the manual Object.create pattern — it is syntax, not a new system.",
        "ES6 classes are syntax over the same prototype mechanism. The constructor's job is to set own properties per instance. Methods defined in the class body live on the prototype — shared by all instances. Class field assignments (x = value) run per instance, equivalent to this.x = value in the constructor. Class field arrow functions (fn = () => {}) give each instance its own copy of the function with 'this' permanently locked — safe to detach but costs memory. Classes must be called with new, run in strict mode, and produce non-enumerable prototype methods — unlike constructor functions.",
        "extends wires the prototype chain automatically and is equivalent to Object.create(Parent.prototype). super() in a subclass constructor must be called before accessing 'this' — until super() runs, the instance does not exist. super.method() calls the parent's version of an overridden method. static methods and properties belong to the class itself, not instances, and are inherited by subclasses. new.target inside a constructor equals the constructor being called — use it to create abstract base classes that throw when instantiated directly.",
        "A closure holds a live reference to outer variables — not a copy of their values at creation time. If the variable changes, the closure sees the new value. The var loop bug: var is function-scoped, so one variable is shared by all iterations and all closures. By the time callbacks run, the loop is done. let creates a new binding per iteration, giving each closure its own variable. Closures enable private state, memoisation, the module pattern, and partial application.",
        "'this' is determined at call time, not write time. Four rules in priority order: new binding (the new object), explicit binding via call/apply/bind, implicit binding (the object before the dot), default binding (undefined in strict mode). Arrow functions capture 'this' lexically from their enclosing scope at definition time — call, apply, and bind have no effect on an arrow function's 'this'. Losing 'this' by detaching a method from its object is the most common source of this-related bugs.",
        "call invokes immediately with arguments listed one by one. apply invokes immediately with arguments as an array. bind returns a new function with 'this' permanently locked without invoking. All three are ignored on arrow functions. Implementing them from scratch: temporarily attach the function as a method on the context object, call it — 'this' is set by the method call — then delete the temporary property.",
        "Factory functions return plain objects from regular functions. No new, no this confusion, private state via closures at no extra cost. The memory trade-off is that methods are re-created per instance. Mitigate with Object.create to share methods via a prototype-like object. Factory functions are ideal for composition: small behaviour mixins are applied to an object, composing capabilities without inheritance hierarchies. Favour composition over inheritance — factory functions make this natural.",
        "Currying transforms a multi-argument function into a chain that collects arguments until it has enough, then fires. The general implementation uses fn.length as the target arity — if args collected so far meets or exceeds it, call; otherwise return a collector. Partial application bakes in some arguments. Practical uses: specialised functions from general ones, reusable data transformations, validation builders. The collected arguments live in a closure.",
        "A generator function returns an iterator without running any code. Each .next() call runs the body until the next yield, returns the yielded value, and pauses. Values pass in via next(value) — the value becomes the result of the yield expression. yield* delegates to another generator. Generators make infinite lazy sequences, custom iterables via Symbol.iterator, and tree traversal clean. async/await is generators + promises + an automatic runner — understanding generators means understanding how await suspends a function.",
        "The four OOP pillars in JavaScript: Encapsulation via closures (true privacy anywhere) or # private class fields (ES2022+). Abstraction via private methods — expose a clean public interface, hide the implementation. Inheritance via the prototype chain — classes and extends handle the wiring. Polymorphism via method overriding on subclasses or duck typing — any object with the right method works regardless of its type. Mixins are functions that take a base class and return a new class with additional behaviour, enabling multiple behaviour composition without deep inheritance.",
        "For tricky interview questions: detached methods lose 'this' (default binding). Arrow functions inside methods capture 'this' at definition — detaching the outer function breaks it. var in loops creates one shared variable; all closures see the final value. instanceof fails if the prototype is reassigned after instance creation. Class field arrows are per-instance and cannot lose 'this'; prototype methods can. Generator next(value) sends a value back in as the result of the yield expression. Bound functions ignore both implicit and explicit binding — once bound, 'this' is permanent. For implementations: think requirements before code. Deep clone — handle primitives, special types, circular references with WeakMap. EventEmitter — Map of Sets, return unsubscribe function from on(). Debounce — clear and reset timer on each call. Throttle — track last run time and skip calls within the interval."
      ]
    }
  ]
};
