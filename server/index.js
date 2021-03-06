import express from 'express';
// uses cookie parser or smtg similar internally
import session from 'express-session';
import md5 from 'md5';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User, Document } from './models/models';

// TODO
// import compression from 'compression';

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const auth = require('./routes/auth');
const routes = require('./routes/routes');
const MongoStore = require('connect-mongo')(session);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// TODO
// app.use(compression());
if (!process.env.MONGODB_URI) {
  console.error('Cannot find MONGODB_URI.  Run env.sh?');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI);


// Session Info
const sessionMiddleware = session({
  secret: process.env.SECRET, /* doing own HMAC */
  name: 'docuwrite_horizons',
  // creating a mongoose store
  //    purpose: a place to store our sessions on DB
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  proxy: true,
  resave: true,
});
app.use(sessionMiddleware);


// trying to associate session information with socket information
// resource: https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x

// authorization: https://stackoverflow.com/questions/19106861/authorizing-and-handshaking-with-socket-io
// this guy says to use sessionStore http://www.danielbaulig.de/socket-ioexpress/

// Initialize Passport
app.use(passport.initialize());
// now passport will use session to store sessions
app.use(passport.session());

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
});
// Passport Serialize
passport.serializeUser((user, done) => {
  // console.log('serializing user: ', user);
  done(null, user._id);
});

// Passport Deserialize
passport.deserializeUser((id, done) => User.findById(id, (err, user) => {
  // console.log('deserializing user: ', user);
  done(err, user);
}));

// Passport Strategy
passport.use(new LocalStrategy((email, password, done) => {
  User.findOne({ email }).exec()
  .then((user) => {
    if (!user) {
      console.log('no user in passport local strategy ', user);
      return done(null, false, { message: 'Incorrect username' });
    }

    if (user.password !== auth.hashPassword(password)) {
      return done(null, false, { message: 'Incorrect password' });
    }
    return done(null, user);
  })
  .catch((err) => {
    console.log(`Error in passport-local Strategy\n${err}`);
    return done(err);
  });
}));

app.use('/', auth.authRouter(passport));
app.use('/', routes);


const sharedDocs = {};
io.on('connection', (socket) => {
  socket.on('join-document', (docAuth, ackCB) => {
    Document.findById(docAuth.docID).exec()
    .then((doc) => {
      if (!doc) {
        ackCB({ error: 'no document found' });
      } else if (doc.owners.indexOf(docAuth.userID) < 0) {
        ackCB({ error: 'you don\'t have permission to see this document!' });
      } else {
        let secretToken = sharedDocs[docAuth.docID];
        if (!secretToken) {
          secretToken = sharedDocs[docAuth.docID] = md5(`${docAuth.docID + Math.random()}miao`);
        }
        ackCB({ title: doc.title, state: doc.state });
        socket.join(secretToken);
      }
    })
    .catch((error) => {
      console.log('error in finding document ', error);
      ackCB({ error });
    });
  });

  socket.on('share-document', (docAuth, ackCB) => {
    const { docIDs, userIDs } = docAuth;
    console.log('docIDs, ', docIDs);
    console.log('userIDs, ', userIDs);
  });

  socket.on('save-document', (docAuth, ackCB) => {
    Document.findByIdAndUpdate(docAuth.docID,
      { $set: { state: docAuth.state, title: docAuth.title } },
      { new: true })
      .exec()
    .then((doc) => {
      if (!doc) {
        ackCB({ success: 'no document found' });
      } else {
        ackCB({ success: true });
        socket.to(sharedDocs[doc._id]).emit('updated-doc', { title: doc.title, state: doc.state });
      }
    })
    .catch((error) => {
      console.log('Error from update-document', error);
      ackCB({ success: error });
    });
  });

  socket.on('update-document', (docAuth, ackCB) => {
    socket.to(sharedDocs[docAuth.docID]).emit('updated-doc', { title: docAuth.title, state: docAuth.state });
    ackCB({ success: true });
  });

  socket.on('leave-document', (docAuth, ackCB) => {
    Document.findByIdAndUpdate(docAuth.docID,
      { state: docAuth.state, title: docAuth.title },
      { new: true }).exec()
        .then((doc) => {
          if (!doc) {
            ackCB({ error: 'no document found' });
          } else {
            ackCB({ success: true });
            socket.to(sharedDocs[doc._id]).emit('updated-doc', { title: doc.title, state: doc.state });
            socket.leave(sharedDocs[doc._id]);
          }
        })
        .catch((error) => {
          console.log('Error from leave-document', error);
          ackCB({ success: error });
        });
  });

  socket.on('delete-document', (docAuth, ackCB) => {
    const { docIDs, userID } = docAuth;
    const errors = {};
    const success = {};
    Document.find({
      _id: { $in: [...docIDs.map(docID => mongoose.Types.ObjectId(docID))] },
      ownedBy: { $in: [mongoose.Types.ObjectId(userID)] },
    })
    .exec()
    .then(foundDocs =>
      Promise.all(foundDocs.filter(doc => !io.nsps['/'].adapter.rooms[sharedDocs[doc._id]] || io.nsps['/'].adapter.rooms[sharedDocs[doc._id]].length === 0)
             .map(doc => doc.remove().then((removed) => { success[doc._id] = !!removed; })),
    ))
    .then(() => ackCB({ success, errors }))
    .catch((err) => {
      errors.mongoDB = err;
      ackCB({ success, errors });
    });
  });


  socket.on('disconnect', () => {
    console.log('A user disconnected at', new Date().toLocaleString());
  });
});


server.listen('3000', () => console.log('Running on localhost 3000'));
