import * as mongoose from 'mongoose';

mongoose.set('useNewUrlParser', true);
mongoose.connect('mongodb://mongodatabase:27017/articles');

export interface ArticleUnit extends mongoose.Document {
    tags: string;
    date: string;
    author: string;
    title: string;
    alias: string;
    body: string;
}

const articleSchema: mongoose.Schema = new mongoose.Schema({
    tags: String,
    date: String,
    author: String,
    title: String,
    alias: String,
    body: String,
});

const Article: mongoose.Model<ArticleUnit> = mongoose.model('Article', articleSchema, 'articles');

export default Article;