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

app.use(cors());
app.use(bodyParser());
app.use(passport.initialize());
app.use(router.routes());
app.use(router.allowedMethods());

const jwtSecret = 'someSecretWords';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false
    },
    function (email: string, password: string, done) {
      User.findOne({email}, (err, user) => {
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
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret
};

passport.use('jwt', new Strategy(jwtOptions, function (payload: any, done) {
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
    await Article.find({}, {alias: 1, title: 1, date: 1, tags: 1, _id: 0}, (err, result) => {
      if (err) {
        throw err;
      }
      const articles = [];
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

router.post('/write', async (ctx, next) => {
  try {
    await Article.create({
      tags: ctx.request.body.tags,
      date: ctx.request.body.date,
      author: ctx.request.body.author,
      title: ctx.request.body.title,
      alias: ctx.request.body.alias, 
      body: ctx.request.body.body
    }, (err, article) => {
      if (err) {
        throw err;
      }
      ctx.status = 200;
      ctx.body = [];
    });
  } catch (err) {
    ctx.status = 500;
    ctx.body = err;
  }
  await next();
});

// router.post('/user', async (ctx, next) => {
//   try {
//     ctx.body = await User.create(ctx.request.body);
//   } catch (err) {
//     ctx.status = 400;
//     ctx.body = err;
//   }
//   await next();
// });

router.post('/login', async (ctx, next) => {
  await passport.authenticate('local', (err, user) => {
    if (user === false) {
      ctx.body = {user: false};
    } else {
      const payload = {
        id: user.id,
        userName: user.userName,
        email: user.email
      };
      const token = jwt.sign(payload, jwtSecret);

      ctx.body = {user: user.userName, token};
    }
  })(ctx, next);
});

router.get('/user_check', async (ctx, next) => {
  await passport.authenticate('jwt', (err, user) => {
    try {
      if (err) {
        throw err;
      }
      if (user) {
        ctx.body = {success: true};
      } else {
        ctx.body = {success: false};
      }
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  })(ctx, next);
});

app.listen(3001);
