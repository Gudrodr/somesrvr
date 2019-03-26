import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as bodyParser from 'koa-bodyparser';
import * as passport from 'koa-passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {Strategy, ExtractJwt} from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import * as cors from 'koa2-cors';
import User from './userSchema';
import Article from './articlesSchema';

const app = new Koa();
const router = new Router();

app.use(router.routes());
app.use(router.allowedMethods());
app.use(bodyParser());
app.use(passport.initialize());
app.use(cors());

const jwtSecret = 'someSecretWords';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false
    },
    (email: string, password: string, done) => {
      User.findOne({ email }, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user || !user.checkPassword(password)) {
          return done(null, false, { message: 'Неверно введенны данные' });
        }
        return done(null, user);
      });
    }
  )
);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: jwtSecret
};

passport.use(
  new Strategy(jwtOptions, (payload: any, done) => {
    User.findById(payload.id, (err, user) => {
      if (err) {
        return done(err);
      }
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    });
  })
);

router.get('/', async (ctx, next) => {
  try {
    await Article.find({}, {alias: 1, title: 1, _id: 0}, (err, result) => {
      if (err) {
        throw err;
      }
      let articles = [];
      result.forEach(item => articles.push(item));
      ctx.body = {articles};
    });
  } catch (err) {
    ctx.status = 500;
    ctx.body = err;
  }
  await next();
});

router.get('article', '/article/:alias', async (ctx, next) => {
  try {
    await Article.findOne({alias: ctx.params.alias}, (err, article) => {
      if (err) {
        throw err;
      }
      ctx.body = article;
    });
  } catch (err) {
    ctx.status = 500;
    ctx.body = err;
  }
  await next();
});

app.use(async (ctx, next) => {
  if (ctx.request.method === 'POST' && ctx.request.url === '/user') {
    try {
      ctx.body = await User.create(ctx.request.body);
    } catch (err) {
      ctx.status = 400;
      ctx.body = err;
    }
  }
  await next();
});

app.use(async (ctx, next) => {
  if (ctx.request.method === 'POST' && ctx.request.url === '/login') {
    await passport.authenticate('local', (err, user) => {
      if (user === false) {
        ctx.body = 'Login failed';
      } else {
        const payload = {
          id: user.id,
          userName: user.userName,
          email: user.email
        };
        const token = jwt.sign(payload, jwtSecret);

        ctx.body = { user: user.userName, token };
      }
    })(ctx, next);
  }
});

app.use(async (ctx, next) => {
    if (ctx.request.method === 'GET' && ctx.request.url === '/custom') {
        await passport.authenticate('jwt', (err, user) => {
            if (user) {
              ctx.body = `Hello ${user.userName}`;
            } else {
              ctx.body = 'No such user';
            }
        })(ctx, next);
    }
});

app.listen(3001);
