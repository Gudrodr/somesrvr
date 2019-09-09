import * as mongoose from 'mongoose';
import * as crypto from 'crypto';

// mongoose.set('debug', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://mongodatabase:27017/articles');

export interface UserInterface extends mongoose.Document {
    userName: string;
    email: {
        type: string;
        require: string;
        unique: string;
    };
    passwordHash: string;
    salt: string;
    checkPassword(password: string): boolean;
}

const userSchema: mongoose.Schema = new mongoose.Schema({
    userName: String,
    email: {
        type: String,
        required: 'Необходимо указать email',
        unique: 'Такой email уже существует'
    },
    passwordHash: String,
    salt: String
},
{
    timestamps: true
});

userSchema.virtual('password')
.set(function (password: string) {
    this._plainPassword = password;
    if (password) {
        this.salt = crypto.randomBytes(128).toString('base64');
        this.passwordHash = crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha256');
    } else {
        this.salt = undefined;
        this.passwordHash = undefined;
    }
})
.get(function () {
    return this._plainPassword;
});

userSchema.methods.checkPassword = function (password: string) {
    if (!password) {
        return false;
    }
    if (!this.passwordHash) {
        return false;
    }
    return crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha256').toString('utf8') === this.passwordHash;
};

const User: mongoose.Model<UserInterface> = mongoose.model('User', userSchema, 'users');

export default User;