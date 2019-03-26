import * as mongoose from 'mongoose';

mongoose.set('useNewUrlParser', true);
mongoose.connect('mongodb://localhost:27017/articles');

export interface ArticleUnit extends mongoose.Document {
    title: string;
    alias: string;
    body: string;
    assets?: {
        title: string;
        link: string;
    }[];
}

const articleSchema: mongoose.Schema = new mongoose.Schema({
    title: String,
    alias: String,
    body: String,
    assets: {
        title: String,
        link: String
    }
});

const Article: mongoose.Model<ArticleUnit> = mongoose.model('Article', articleSchema, 'articles');

export default Article;