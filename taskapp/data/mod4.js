// ─── MODULE 4: user model ─────────────────────────────────────────────────────
STEPS.push(

  { /* step 81 — intro */
    mod: 4,
    alex: [
      "this module is about data modelling — defining the shape, rules, and behaviour of a User document in MongoDB. this is one of the most important things you'll build because everything else depends on it: auth, task ownership, permissions.",
      "a User model in a real app is more than just a schema. it's where you enforce data integrity (required fields, valid email format, minimum password length), handle security (hashing passwords so they're never stored in plain text), and control what data gets exposed (stripping the password field before sending user data to the frontend).",
      "all of this lives at the model layer — not in the routes, not in the controllers. the model is the single source of truth for what a User is.",
    ],
    nextOn: 'ok',
    after: "type 'ok' to continue.",
  },

  { /* step 82 — validation layer quiz */
    mod: 4,
    alex: [
      "before we write the schema, let's establish where validation should live in a MERN app. this is something a lot of devs get wrong — they put all validation in the route handler and end up with duplicated logic everywhere.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "in a production MERN app, where should data validation ideally happen?",
      multi: false,
      options: [
        "only on the frontend — validate before the user can even submit",
        "only in the route handler — one place to handle all incoming data",
        "only in the Mongoose schema — let the database layer enforce it",
        "at all three layers — frontend for UX, route middleware for API safety, model for database integrity",
      ],
      correct: [3],
      explanation: "each layer has a different job. frontend validation improves UX — instant feedback without a network round trip. route middleware (like express-validator) validates the API contract — rejects malformed requests before they hit business logic. model-level validation is the last line of defence — enforces data integrity regardless of how the data got there (API, seed scripts, migrations). skipping any layer means assumptions get violated in unexpected ways.",
      hint: "think about what happens if someone bypasses the frontend and hits your API directly with a tool like Postman.",
    },
  },

  { /* step 83 — schema types quiz */
    mod: 4,
    alex: [
      "Mongoose schemas have their own type system that maps to MongoDB's BSON types. let's make sure you can pick the right type for the right field — this matters because Mongoose enforces and coerces these types at save time.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "you're adding a 'role' field to the User schema. a user can be either 'user' or 'admin'. which Mongoose field definition best represents this?",
      multi: false,
      options: [
        "role: String",
        "role: { type: String, enum: ['user', 'admin'], default: 'user' }",
        "role: { type: Boolean, default: false }",
        "role: { type: Number, enum: [0, 1], default: 0 }",
      ],
      correct: [1],
      explanation: "the enum validator restricts the field to a predefined set of values — Mongoose will reject any value that isn't in the list. String with enum is the idiomatic way to model a field with a fixed set of options. Boolean would work for a simple admin/non-admin flag but doesn't scale to three or more roles. the default: 'user' means new users are regular users unless explicitly set otherwise.",
      hint: "think about a field with a limited set of valid string values — Mongoose has a specific validator for this.",
    },
  },

  { /* step 84 — user schema scaffold */
    mod: 4,
    alex: [
      "let's build the User schema. we'll add fields one section at a time so each decision is deliberate — not just copying a block of code.",
      "start with the schema scaffold: import mongoose, create the schema with the identity fields — name and email. a few things to note on the email field: 'lowercase: true' automatically lowercases the value before saving (so 'Alice@Example.com' and 'alice@example.com' are treated as the same). 'trim: true' strips leading and trailing whitespace. 'match' is a regex validator — we're using a standard email regex to catch obvious invalid formats.",
    ],
    after: "create server/models/User.js with the name and email fields.",
    task: {
      type: 'code',
      file: 'server/models/User.js',
      lang: 'javascript',
      hint: "import mongoose. create a new Schema with name (String, required, trim, maxlength 50) and email (String, required, unique, lowercase, trim, match with email regex). don't export the model yet — we'll add more fields first.",
      answer:
`import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
  },
  { timestamps: true }
);`,
      check(input) {
        const ok =
          input.includes('mongoose.Schema') &&
          input.includes('name') &&
          input.includes('email') &&
          input.includes('required') &&
          input.includes('timestamps');
        return {
          ok,
          msg: ok ? "user schema scaffolded with name and email." : "create a mongoose.Schema with name and email fields, both required, and pass { timestamps: true } as the second argument.",
        };
      },
    },
  },

  { /* step 85 — unique vs validator */
    mod: 4,
    alex: [
      "you just added 'unique: true' to the email field. this is one of the most common misconceptions in Mongoose — so let's address it head on before you hit the bug.",
      "'unique: true' in Mongoose is not a validator. it doesn't run validation logic when you call user.save(). what it actually does is create a unique index in MongoDB. the uniqueness check happens at the database level when the document is inserted — and the error that comes back is a MongoDB error, not a Mongoose ValidationError.",
      "the practical implication: you can't catch duplicate email errors with Mongoose's normal validation error handling. you need to specifically check for MongoDB error code 11000 (duplicate key error) in your route handler. we'll handle this properly when we write the auth controller.",
    ],
    nextOn: 'got it',
    after: "type 'got it' to continue.",
  },

  { /* step 86 — password field */
    mod: 4,
    alex: [
      "now add the password field. two important things here: first, we set a minimum length of 8 characters at the schema level. second, and critically: 'select: false'.",
      "'select: false' means this field is excluded from query results by default. when you do User.findOne({ email }), the returned document will not include the password field — even though it's stored in MongoDB. you have to explicitly opt into fetching it with User.findOne({ email }).select('+password') when you actually need it (like during login to verify the password).",
      "without select: false, every time you fetch a user — to display their profile, to attach them to a request, anywhere — you'd be loading their hashed password into memory and potentially returning it in API responses if you're not careful. select: false eliminates that risk by default.",
    ],
    after: "add the password field to the User schema.",
    task: {
      type: 'code',
      file: 'server/models/User.js',
      lang: 'javascript',
      context:
`import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
  },
  { timestamps: true }
);`,
      hint: "add a password field inside the schema object: type String, required, minlength 8, select: false. also add a role field: type String, enum ['user', 'admin'], default 'user'. and an avatar field: type String, default empty string.",
      answer:
`import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);`,
      check(input) {
        const ok =
          input.includes('password') &&
          input.includes('select: false') &&
          input.includes('role') &&
          input.includes('enum');
        return {
          ok,
          msg: ok ? "password, role, and avatar fields added." : "add password with select: false, role with enum ['user', 'admin'], and avatar fields.",
        };
      },
    },
  },

  { /* step 87 — install bcryptjs */
    mod: 4,
    alex: [
      "we need bcryptjs for password hashing. a note on the naming: there are two packages — 'bcrypt' and 'bcryptjs'. 'bcrypt' is faster but requires native C++ bindings to compile, which can cause issues in some environments (especially Docker, CI, or Windows). 'bcryptjs' is a pure JavaScript implementation — slightly slower but zero native dependencies, works everywhere.",
      "for an app at this scale, the performance difference is negligible. 'bcryptjs' is the safer choice for a project that might be deployed to different environments.",
    ],
    after: "install bcryptjs in the server workspace.",
    task: {
      type: 'cmd',
      hint: "npm install bcryptjs",
      answer: "npm install bcryptjs",
      check(input) {
        const ok = input.includes('bcryptjs');
        return {
          ok,
          msg: ok ? "bcryptjs installed." : "install bcryptjs (with a 'js' suffix) — not the native bcrypt package.",
        };
      },
    },
  },

  { /* step 88 — pre-save hook */
    mod: 4,
    alex: [
      "now the pre-save hook. this is Mongoose middleware — a function that runs automatically before every save operation. we use it to hash the password.",
      "two critical things about this hook: first, we check 'this.isModified(password)' before hashing. if you update a user's name, you don't want to rehash the password — that would invalidate any active sessions. isModified() returns true only when the password field has actually changed. second, we use a regular function (not an arrow function) because we need 'this' to refer to the document being saved. arrow functions don't have their own 'this'.",
      "the salt rounds (10) control how computationally expensive the hash is. higher = more secure but slower. 10 is the industry standard recommendation — it takes about 100ms on modern hardware, which is intentional. you want password hashing to be slow to make brute-force attacks impractical.",
    ],
    after: "add the pre-save password hashing hook to the User schema.",
    task: {
      type: 'code',
      file: 'server/models/User.js',
      lang: 'javascript',
      context:
`import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);`,
      hint: "import bcryptjs. add userSchema.pre('save', async function(next)) — NOT an arrow function. check if password isModified, if not call next(). if yes, hash with bcrypt.hash(this.password, 10) and assign back to this.password, then call next().",
      answer:
`import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ── hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});`,
      check(input) {
        const ok =
          input.includes("pre('save'") &&
          input.includes('isModified') &&
          input.includes('bcrypt.hash') &&
          !input.includes('pre(\'save\', async () =>');
        return {
          ok,
          msg: ok ? "pre-save password hashing hook added." : "use userSchema.pre('save', async function(next)) — not an arrow function — check isModified('password'), and hash with bcrypt.hash(this.password, 10).",
        };
      },
    },
  },

  { /* step 89 — arrow function quiz */
    mod: 4,
    alex: [
      "you used a regular function in the pre-save hook. let's make sure you understand exactly why — because using an arrow function there is a subtle bug that causes confusing errors.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "why can't you use an arrow function for Mongoose middleware hooks like pre('save', async () => { ... })?",
      multi: false,
      options: [
        "arrow functions don't support async/await",
        "Mongoose middleware requires the function to be named",
        "arrow functions don't have their own 'this' — 'this' would refer to the outer scope, not the document being saved",
        "arrow functions can't call next() as a callback",
      ],
      correct: [2],
      explanation: "in a regular function, 'this' is dynamically bound — inside a Mongoose pre-save hook, it refers to the document being saved. arrow functions inherit 'this' from their lexical scope — in a module, that's undefined (or the global object in non-strict mode). so 'this.isModified' would throw 'Cannot read properties of undefined'. this is the same reason React class component methods that use 'this' needed to be bound or use regular functions.",
      hint: "think about what 'this' refers to in an arrow function vs a regular function.",
    },
  },

  { /* step 90 — comparePassword method */
    mod: 4,
    alex: [
      "add an instance method to the schema — comparePassword. instance methods are functions available on every document instance. we'll call this during login to check if the password a user submits matches the stored hash.",
      "this method takes the plain text candidate password, uses bcrypt.compare() to check it against the stored hash, and returns a boolean. bcrypt.compare() handles the salt extraction internally — you don't need to know the salt, bcrypt stores it in the hash itself.",
      "notice we need the hashed password to compare against — which is why we'll have to explicitly select the password field when doing login queries, since we set select: false on it.",
    ],
    after: "add the comparePassword instance method to the User schema.",
    task: {
      type: 'code',
      file: 'server/models/User.js',
      lang: 'javascript',
      context:
`// ── hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});`,
      hint: "add userSchema.methods.comparePassword = async function(candidatePassword) that returns the result of bcrypt.compare(candidatePassword, this.password)",
      answer:
`// ── hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ── instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};`,
      check(input) {
        const ok =
          input.includes('comparePassword') &&
          input.includes('bcrypt.compare') &&
          input.includes('candidatePassword');
        return {
          ok,
          msg: ok ? "comparePassword method added." : "add userSchema.methods.comparePassword that calls bcrypt.compare(candidatePassword, this.password).",
        };
      },
    },
  },

  { /* step 91 — toJSON transform */
    mod: 4,
    alex: [
      "add a toJSON transform to the schema. this controls what the document looks like when it's serialised to JSON — which happens any time you call res.json(user) in a route.",
      "we want to remove two things: 'password' (even though select: false should handle this, the transform is a safety net for cases where password was explicitly selected), and '__v' (Mongoose's internal version key — it's used for optimistic concurrency control but clutters API responses).",
      "the transform function receives the raw MongoDB document ('doc') and the plain object representation ('ret'). you delete fields from 'ret' and return it. this doesn't affect the database — it only affects serialisation.",
    ],
    after: "add the toJSON transform to the User schema options.",
    task: {
      type: 'code',
      file: 'server/models/User.js',
      lang: 'javascript',
      context:
`const userSchema = new mongoose.Schema(
  {
    // ... fields
  },
  { timestamps: true }
);`,
      hint: "change the schema options from { timestamps: true } to { timestamps: true, toJSON: { transform: (_doc, ret) => { delete ret.password; delete ret.__v; return ret; } } }",
      answer:
`const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);`,
      check(input) {
        const ok =
          input.includes('toJSON') &&
          input.includes('transform') &&
          input.includes('delete ret.password') &&
          input.includes('delete ret.__v');
        return {
          ok,
          msg: ok ? "toJSON transform added." : "add a toJSON transform in the schema options that deletes ret.password and ret.__v.",
        };
      },
    },
  },

  { /* step 92 — register model and export */
    mod: 4,
    alex: [
      "last step for the model: register it with Mongoose and export it. 'mongoose.model('User', userSchema)' does two things: it compiles the schema into a Model class, and it registers the model under the name 'User'.",
      "the name 'User' is what Mongoose uses to determine the MongoDB collection name — it lowercases and pluralises it automatically: 'User' → 'users' collection. this matters later when you use Mongoose's populate() to link documents across collections, because populate uses the registered model name.",
    ],
    after: "add the model registration and export to the bottom of User.js.",
    task: {
      type: 'code',
      file: 'server/models/User.js',
      lang: 'javascript',
      context:
`// ── instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};`,
      hint: "add const User = mongoose.model('User', userSchema) and export default User at the bottom of the file",
      answer:
`// ── instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;`,
      check(input) {
        const ok =
          input.includes("mongoose.model('User'") &&
          input.includes('export default User');
        return {
          ok,
          msg: ok ? "User model registered and exported." : "register with mongoose.model('User', userSchema) and export default User.",
        };
      },
    },
  },

  { /* step 93 — model name quiz */
    mod: 4,
    alex: [
      "one more concept to nail down before we move on.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "you register a model as mongoose.model('UserProfile', schema). what will MongoDB name the collection?",
      multi: false,
      options: [
        "UserProfile",
        "userprofile",
        "userprofiles",
        "user_profiles",
      ],
      correct: [2],
      explanation: "Mongoose automatically lowercases and pluralises the model name for the collection name. 'UserProfile' becomes 'userprofiles'. 'Task' becomes 'tasks'. 'Category' becomes 'categories'. you can override this by passing a collection name explicitly as a third argument to mongoose.model(), but the default behaviour is lowercase + pluralise.",
      hint: "Mongoose applies two transformations to the model name when naming the collection.",
    },
  },

  { /* step 94 — complete User.js review */
    mod: 4,
    alex: [
      "let's look at the complete User.js before we commit. your file should have: the bcryptjs and mongoose imports, the full schema with all five fields (name, email, password, role, avatar), timestamps and toJSON transform in the schema options, the pre-save hashing hook, the comparePassword instance method, and the model export.",
      "take a moment to read through it end to end. this is a production-quality model — the kind of thing you'd find in a real codebase.",
    ],
    nextOn: 'looks good',
    after: "review your User.js and type 'looks good' when you're satisfied.",
  },

  { /* step 95 — commit */
    mod: 4,
    alex: [
      "commit the User model. this is a feature commit — you've added a new piece of meaningful application code.",
    ],
    after: "stage and commit.",
    task: {
      type: 'cmd',
      hint: "git add . && git commit -m 'feat: add User model with password hashing and validation'",
      answer: "git add . && git commit -m 'feat: add User model with password hashing and validation'",
      check(input) {
        const hasAdd = input.includes('git add');
        const hasCommit = input.includes('git commit') && input.includes('-m');
        const hasConventional = /['"]?(feat|fix|chore|docs|style|refactor|test|build|ci)(\(.+\))?:/.test(input);
        const ok = hasAdd && hasCommit && hasConventional;
        return {
          ok,
          msg: ok ? "committed." : "use a conventional commit message starting with feat:, fix:, or similar.",
        };
      },
    },
  },

  { /* step 96 — wrap up */
    mod: 4,
    alex: [
      "the User model is done. it has schema validation at the field level, automatic password hashing on save, a method to verify passwords, and a serialisation transform that keeps sensitive data out of API responses. that's a complete, production-quality model.",
      "next up: the Task model, and then we get into the auth routes — register and login. by the end of the auth module you'll be able to create users, issue JWTs, and protect routes. things start moving fast from here.",
    ],
  },

);
