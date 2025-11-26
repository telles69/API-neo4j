import { ModelFactory } from 'neogma';
import getNeogma from '../config/neogma.js';

const commentSchema = {
    label: 'Comment',
    schema: {
        id: {
            type: 'string',
            required: true,
        },
        text: {
            type: 'string',
            required: true,
        },
        createdAt: {
            type: 'string',
            required: true,
        },
    },
    relationships: {
        author: {
            model: 'User',
            direction: 'in',
            name: 'WROTE',
        },
        post: {
            model: 'Post',
            direction: 'out',
            name: 'ON',
        },
    },
};

const Comment = ModelFactory(commentSchema, getNeogma());

getNeogma().modelsByName['Comment'] = Comment;

export default Comment;
